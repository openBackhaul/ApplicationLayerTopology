'use strict';

const ForwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const LogicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');
const OperationClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationClientInterface');
const HttpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const HttpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');
const FcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');
const OnfAttributeFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');
const RequestHeader = require('onf-core-model-ap/applicationPattern/rest/client/RequestHeader');
const RestRequestBuilder = require('onf-core-model-ap/applicationPattern/rest/client/RequestBuilder');
const ExecutionAndTraceService = require('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');

var traceIndicatorIncrementer = 1;

/**
 * @description This function automates the forwarding construct by calling the appropriate call back operations based on the fcPort input and output directions.
 * Waits for response.
 * @param {String} forwardingAutomationInput
 * @param {String} headers
 * @returns {Promise<Object>} Response from forwarding
 **/
exports.automateForwardingConstructAsync = async function (forwardingAutomationInput, headers) {
    traceIndicatorIncrementer = 1;
    let forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(
        forwardingAutomationInput.forwardingName);
    let fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
    let fcOutputPortList = fcPortList.filter(fcp =>
        fcp[onfAttributes.FC_PORT.PORT_DIRECTION] === FcPort.portDirectionEnum.OUTPUT
    );
    let found = await findOutputMatchesContextAsync(fcOutputPortList, forwardingAutomationInput.context);
    return await dispatchEvent(
        found[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT],
        forwardingAutomationInput.attributeList,
        headers.user,
        headers.xCorrelator,
        headers.traceIndicator + "." + (traceIndicatorIncrementer++),
        headers.customerJourney
    );
}

/**
 * @param {Array} fcPortList
 * @param {String} context
 **/
async function findOutputMatchesContextAsync(fcPortList, context) {
    let found;
    for (let index = 0; index < fcPortList.length; index++) {
        const fcPort = fcPortList[index];
        let fcLogicalTerminationPoint = fcPort["logical-termination-point"];
        let serverLtpList = await LogicalTerminationPoint.getServerLtpListAsync(fcLogicalTerminationPoint);
        let httpClientUuid = serverLtpList[0];
        let applicationName = await HttpClientInterface.getApplicationNameAsync(httpClientUuid);
        let releaseNumber = await HttpClientInterface.getReleaseNumberAsync(httpClientUuid);
        let contextToBeChecked = applicationName + releaseNumber;
        if (contextToBeChecked == context) {
            found = fcPort;
        }
    }
    return found;
}

/**
 * This funtion formulates the request body based on the operation name and application 
 * @param {String} operationClientUuid uuid of the client operation that needs to be addressed
 * @param {object} httpRequestBody request body for the operation
 * @param {String} user username of the request initiator. 
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses. 
 * @param {String} traceIndicator Sequence number of the request. 
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies.
 */
async function dispatchEvent(operationClientUuid, httpRequestBody, user, xCorrelator, traceIndicator, customerJourney) {
    let operationKey = await OperationClientInterface.getOperationKeyAsync(
        operationClientUuid);
    let operationName = await OperationClientInterface.getOperationNameAsync(
        operationClientUuid);
    // we need information from the database at this stage, because the database might change
    // before the response is received, see https://github.com/openBackhaul/ExecutionAndTraceLog/issues/227
    let httpClientUuid = await LogicalTerminationPoint.getServerLtpListAsync(operationClientUuid);
    let serverApplicationName = await HttpClientInterface.getApplicationNameAsync(httpClientUuid[0]);
    let serverApplicationReleaseNumber = await HttpClientInterface.getReleaseNumberAsync(httpClientUuid[0]);
    let originator = await HttpServerInterface.getApplicationNameAsync();
    let httpRequestHeader = new RequestHeader(
        user, 
        originator,
        xCorrelator, 
        traceIndicator, 
        customerJourney, 
        operationKey
        );
    httpRequestHeader = OnfAttributeFormatter.modifyJsonObjectKeysToKebabCase(httpRequestHeader);
    let response = await RestRequestBuilder.BuildAndTriggerRestRequest(
        operationClientUuid,
        "POST", 
        httpRequestHeader, 
        httpRequestBody
        );
    let responseCode = response.status;
    if (responseCode == 408) {
        ExecutionAndTraceService.recordServiceRequestFromClient(serverApplicationName, serverApplicationReleaseNumber, xCorrelator, traceIndicator, user, originator, operationName, responseCode, httpRequestBody, response.data)
            .catch((error) => console.log(`record service request ${JSON.stringify({
                xCorrelator,
                traceIndicator,
                user,
                originator,
                serverApplicationName,
                serverApplicationReleaseNumber,
                operationName,
                responseCode,
                reqBody: httpRequestBody,
                resBody: response.data
            })} failed with error: ${error.message}`));
    }
    return response;
}
