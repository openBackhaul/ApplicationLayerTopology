'use strict';

const httpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const tcpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpServerInterface');
const ControlConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ControlConstruct');
const operationServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationServerInterface');
const OperationClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationClientInterface');
const integerProfileOperation = require('onf-core-model-ap/applicationPattern/onfModel/models/profile/IntegerProfile');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const onfFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');
const LayerProtocol = require('onf-core-model-ap/applicationPattern/onfModel/models/LayerProtocol');
const ForwardingAutomationService = require('onf-core-model-ap/applicationPattern/onfModel/services/ForwardingConstructAutomationServices');

const operationKeyUpdateNotificationService = require('onf-core-model-ap/applicationPattern/onfModel/services/OperationKeyUpdateNotificationService');
const ControlConstructService = require('./ControlConstructService');
const IndividualServicesUtility = require('./IndividualServicesUtility');
const LinkServices = require('./LinkServices');

/**
 * This function acts as main block that initiates and coordinated the forwarding process for regard-application 
 * @param {Object} body contains {application-name, release-number, protocol, address, port} of regarded application
 * @param {Object} requestHeaders {user, originator, x-correlator, trace-indicator, customer-journey} of incoming request
 * @returns {Object} result - contains status of embedding process
 */
exports.regardApplication = async function (body, requestHeaders) {
  let result = {};
  try {
    let applicationName = body["application-name"];
    let releaseNumber = body["release-number"];
    result = await RequestForInquiringTopologyChangeInformationWithDefaultKey(applicationName, releaseNumber, requestHeaders);
    result = await CreateLinkForInquiringTopologyChangeInformation(applicationName, releaseNumber, requestHeaders);
    if (!result["successfully-connected"]) return result;
    let forwardingForInquiringTopologyInformation = "NewApplicationCausesRequestForTopologyChangeInformation.RequestForInquiringTopologyChangeInformation";
    let operationClientUuid = await IndividualServicesUtility.getConsequentOperationClientUuid(forwardingForInquiringTopologyInformation, applicationName, releaseNumber);
    let waitingTime = await integerProfileOperation.getIntegerValueForTheIntegerProfileNameAsync("maximumWaitTimeToReceiveOperationKey");
    let isOperationKeyUpdated = await operationKeyUpdateNotificationService.waitUntilOperationKeyIsUpdated(operationClientUuid, requestHeaders.timestampOfCurrentRequest, waitingTime);
    if (!isOperationKeyUpdated) {
      result["successfully-connected"] = false;
      result["reason-of-failure"] = `ALT_MAXIMUM_WAIT_TIME_TO_RECEIVE_OPERATION_KEY_EXCEEDED`;
      return result;
    }
    result = await RequestForInquiringTopologyChangeInformation(applicationName, releaseNumber, requestHeaders);
    if (!result["successfully-connected"]) return result;
    result = await CreateLinkForProvidingUpdatedLtpInformation(applicationName, releaseNumber, requestHeaders);
    if (!result["successfully-connected"]) return result;
    result = await CreateLinkForProvidingDeletedLtpInformation(applicationName, releaseNumber, requestHeaders);
    if (!result["successfully-connected"]) return result;
    result = await CreateLinkForProvidingUpdatedFcInformation(applicationName, releaseNumber, requestHeaders);
    if (!result["successfully-connected"]) return result;
    result = await CreateLinkForProvidingUpdatedFcPortInformation(applicationName, releaseNumber, requestHeaders);
    if (!result["successfully-connected"]) return result;
    result = await CreateLinkForProvidingDeletedFcPortInformation(applicationName, releaseNumber, requestHeaders);

  } catch (error) {
    console.log(error);
    result["successfully-connected"] = false;
    result["reason-of-failure"] = `ALT_UNKNOWN`;
  }
  return result;
}

/**
 * This function acts triggers and process callback for forwarding 
 *      "NewApplicationCausesRequestForTopologyChangeInformation.RequestForInquiringTopologyChangeInformationWithDefaultKey"
 * @param {String} applicationName - name of regarded application
 * @param {String} releaseNumber - release of regarded application
 * @param {Object} requestHeaders {user, originator, x-correlator, trace-indicator, customer-journey, traceIndicatorIncrementor} of incoming request
 * @returns {Object} result - contains status of embedding process
 */
async function RequestForInquiringTopologyChangeInformationWithDefaultKey(applicationName, releaseNumber, requestHeaders) {
  let result = {};
  let forwardingName = "NewApplicationCausesRequestForTopologyChangeInformation.RequestForInquiringTopologyChangeInformationWithDefaultKey";
  try {
    let requestBody = {};
    requestBody.topologyApplication = await httpServerInterface.getApplicationNameAsync();
    requestBody.topologyApplicationReleaseNumber = await httpServerInterface.getReleaseNumberAsync();
    requestBody.topologyApplicationProtocol = await tcpServerInterface.getLocalProtocol();
    requestBody.topologyApplicationAddress = await tcpServerInterface.getLocalAddressForForwarding();
    requestBody.topologyApplicationPort = await tcpServerInterface.getLocalPort();

    let controlConstructUuid = await ControlConstruct.getUuidAsync();

    let updateLtpUuid = controlConstructUuid + "-op-s-is-005";
    let deleteLtpAndDependentsUuid = controlConstructUuid + "-op-s-is-006";
    let updateFcUuid = controlConstructUuid + "-op-s-is-013";
    let UpdateFcPortUuid = controlConstructUuid + "-op-s-is-014";
    let deleteFcPortUuid = controlConstructUuid + "-op-s-is-015";

    requestBody.topologyOperationLtpUpdate = await operationServerInterface.getOperationNameAsync(updateLtpUuid);
    requestBody.topologyOperationLtpDeletion = await operationServerInterface.getOperationNameAsync(deleteLtpAndDependentsUuid);
    requestBody.topologyOperationFcUpdate = await operationServerInterface.getOperationNameAsync(updateFcUuid);
    requestBody.topologyOperationFcPortUpdate = await operationServerInterface.getOperationNameAsync(UpdateFcPortUuid);
    requestBody.topologyOperationFcPortDeletion = await operationServerInterface.getOperationNameAsync(deleteFcPortUuid);

    requestBody = onfFormatter.modifyJsonObjectKeysToKebabCase(requestBody);

    let response = await IndividualServicesUtility.forwardRequestWithDefaultOperationKey(
      forwardingName,
      requestBody,
      requestHeaders.user,
      requestHeaders.xCorrelator,
      requestHeaders.traceIndicator + "." + requestHeaders.traceIndicatorIncrementer++,
      requestHeaders.customerJourney,
      applicationName + releaseNumber
    );
    let responseCode = response.status;
    if (!responseCode.toString().startsWith("2")) {
      result["successfully-connected"] = false;
      result["reason-of-failure"] = `ALT_NOT_REACHABLE`;
      if(responseCode.toString() == "401") {
        console.log(`${forwardingName} is failed with response code ${responseCode}. \n Probably, links to the regarded application is already available and operation-keys in server and client would have updated \n Proceeding to further callbacks`);
      }
    } else {
      let isControlConstructUpdated = await UpdateControlConstructAndLinksInDataBase(response.data, applicationName, releaseNumber, requestHeaders);
      if(!isControlConstructUpdated) {
        result["successfully-connected"] = false;
        result["reason-of-failure"] = `ALT_UNKNOWN`;
      } else {
        result["successfully-connected"] = true;
      }
    }
    console.log(`${forwardingName} has been triggered with response ${response.status}`);
    if(result["successfully-connected"]) {
      console.log("update of control-construct to Elasticsearch is successful");
    }
    
  } catch (error) {
    console.log(error);
    result["successfully-connected"] = false;
    result["reason-of-failure"] = `ALT_UNKNOWN`;
  }
  return result;
}

/**
 * This function acts triggers and process callback for forwarding 
 *      "NewApplicationCausesRequestForTopologyChangeInformation.CreateLinkForInquiringTopologyChangeInformation"
 * @param {String} applicationName - name of regarded application
 * @param {String} releaseNumber - release of regarded application
 * @param {Object} requestHeaders {user, originator, x-correlator, trace-indicator, customer-journey, traceIndicatorIncrementor} of incoming request
 * @returns {Object} result - contains status of embedding process
 */
async function CreateLinkForInquiringTopologyChangeInformation(applicationName, releaseNumber, requestHeaders) {
  let result = {};
  let forwardingName = "NewApplicationCausesRequestForTopologyChangeInformation.CreateLinkForInquiringTopologyChangeInformation";
  let forwardingForInquiringTopologyInformation = "NewApplicationCausesRequestForTopologyChangeInformation.RequestForInquiringTopologyChangeInformation";
  try {
    /* formulating request body*/
    let requestBody = {};
    requestBody["serving-application-name"] = applicationName;
    requestBody["serving-application-release-number"] = releaseNumber;
    let operationClientUuid = await IndividualServicesUtility.getConsequentOperationClientUuid(forwardingForInquiringTopologyInformation, applicationName, releaseNumber);
    requestBody["operation-name"] = await OperationClientInterface.getOperationNameAsync(operationClientUuid);
    requestBody["consuming-application-name"] = await httpServerInterface.getApplicationNameAsync();
    requestBody["consuming-application-release-number"] = await httpServerInterface.getReleaseNumberAsync();

    let response = await IndividualServicesUtility.forwardRequest(
      forwardingName,
      requestBody,
      requestHeaders.user,
      requestHeaders.xCorrelator,
      requestHeaders.traceIndicator + "." + requestHeaders.traceIndicatorIncrementer++,
      requestHeaders.customerJourney
    );
    /* processing the response */
    result = processResponseForCreatingLinkService(response);
    console.log(`${forwardingName} has been triggered`);
  } catch (error) {
    console.log(error);
    result["successfully-connected"] = false;
    result["reason-of-failure"] = `ALT_ALT_UNKNOWN`;
  }
  return result;
}

/**
 * This function acts triggers and process callback for forwarding 
 *      "NewApplicationCausesRequestForTopologyChangeInformation.RequestForInquiringTopologyChangeInformation"
 * @param {String} applicationName - name of regarded application
 * @param {String} releaseNumber - release of regarded application
 * @param {Object} requestHeaders {user, originator, x-correlator, trace-indicator, customer-journey, traceIndicatorIncrementor} of incoming request
 * @returns {Object} result - contains status of embedding process
 */
async function RequestForInquiringTopologyChangeInformation(applicationName, releaseNumber, requestHeaders) {
  let result = {};
  let forwardingName = "NewApplicationCausesRequestForTopologyChangeInformation.RequestForInquiringTopologyChangeInformation";
  try {
    let requestBody = {};
    requestBody.topologyApplication = await httpServerInterface.getApplicationNameAsync();
    requestBody.topologyApplicationReleaseNumber = await httpServerInterface.getReleaseNumberAsync();
    requestBody.topologyApplicationProtocol = await tcpServerInterface.getLocalProtocol();
    requestBody.topologyApplicationAddress = await tcpServerInterface.getLocalAddressForForwarding();
    requestBody.topologyApplicationPort = await tcpServerInterface.getLocalPort();

    let controlConstructUuid = await ControlConstruct.getUuidAsync();

    let updateLtpUuid = controlConstructUuid + "-op-s-is-005";
    let deleteLtpAndDependentsUuid = controlConstructUuid + "-op-s-is-006";
    let updateFcUuid = controlConstructUuid + "-op-s-is-013";
    let UpdateFcPortUuid = controlConstructUuid + "-op-s-is-014";
    let deleteFcPortUuid = controlConstructUuid + "-op-s-is-015";

    requestBody.topologyOperationLtpUpdate = await operationServerInterface.getOperationNameAsync(updateLtpUuid);
    requestBody.topologyOperationLtpDeletion = await operationServerInterface.getOperationNameAsync(deleteLtpAndDependentsUuid);
    requestBody.topologyOperationFcUpdate = await operationServerInterface.getOperationNameAsync(updateFcUuid);
    requestBody.topologyOperationFcPortUpdate = await operationServerInterface.getOperationNameAsync(UpdateFcPortUuid);
    requestBody.topologyOperationFcPortDeletion = await operationServerInterface.getOperationNameAsync(deleteFcPortUuid);

    requestBody = onfFormatter.modifyJsonObjectKeysToKebabCase(requestBody);

    let response = await IndividualServicesUtility.forwardRequest(
      forwardingName,
      requestBody,
      requestHeaders.user,
      requestHeaders.xCorrelator,
      requestHeaders.traceIndicator + "." + requestHeaders.traceIndicatorIncrementer++,
      requestHeaders.customerJourney,
      applicationName + releaseNumber
    );
    let responseCode = response.status;
    if (!responseCode.toString().startsWith("2")) {
      result["successfully-connected"] = false;
      result["reason-of-failure"] = `ALT_NOT_REACHABLE`;
    } else {
      let isControlConstructUpdated = await UpdateControlConstructAndLinksInDataBase(response.data, applicationName, releaseNumber, requestHeaders);
      if(!isControlConstructUpdated) {
        result["successfully-connected"] = false;
        result["reason-of-failure"] = `ALT_UNKNOWN`;
      } else {
        result["successfully-connected"] = true;
      }
    }
    console.log(`${forwardingName} has been triggered with response ${response.status}`);
  } catch (error) {
    console.log(error);
    result["successfully-connected"] = false;
    result["reason-of-failure"] = `ALT_UNKNOWN`;
  }
  return result;
}

/**
 * This function acts triggers and process callback for forwarding 
 *      "NewApplicationCausesRequestForTopologyChangeInformation.CreateLinkForProvidingUpdatedLtpInformation"
 * @param {String} applicationName - name of regarded application
 * @param {String} releaseNumber - release of regarded application
 * @param {Object} requestHeaders {user, originator, x-correlator, trace-indicator, customer-journey, traceIndicatorIncrementor} of incoming request
 * @returns {Object} result - contains status of embedding process
 */
async function CreateLinkForProvidingUpdatedLtpInformation(applicationName, releaseNumber, requestHeaders) {
  let result = {};
  let forwardingName = "NewApplicationCausesRequestForTopologyChangeInformation.CreateLinkForProvidingUpdatedLtpInformation";
  try {
    /* formulating request body*/
    let requestBody = {};
    requestBody["serving-application-name"] = await httpServerInterface.getApplicationNameAsync();
    requestBody["serving-application-release-number"] = await httpServerInterface.getReleaseNumberAsync();
    let operationClientUuid = (await ControlConstruct.getUuidAsync()) + "-op-s-is-005";
    requestBody["operation-name"] = await operationServerInterface.getOperationNameAsync(operationClientUuid);
    requestBody["consuming-application-name"] = applicationName;
    requestBody["consuming-application-release-number"] = releaseNumber;

    let response = await IndividualServicesUtility.forwardRequest(
      forwardingName,
      requestBody,
      requestHeaders.user,
      requestHeaders.xCorrelator,
      requestHeaders.traceIndicator + "." + requestHeaders.traceIndicatorIncrementer++,
      requestHeaders.customerJourney
    );
    /* processing the response */
    result = processResponseForCreatingLinkService(response);
    console.log(`${forwardingName} has been triggered`);
  } catch (error) {
    console.log(error);
    result["successfully-connected"] = false;
    result["reason-of-failure"] = `ALT_UNKNOWN`;
  }
  return result;
}

/**
 * This function acts triggers and process callback for forwarding 
 *      "NewApplicationCausesRequestForTopologyChangeInformation.CreateLinkForProvidingDeletedLtpInformation"
 * @param {String} applicationName - name of regarded application
 * @param {String} releaseNumber - release of regarded application
 * @param {Object} requestHeaders {user, originator, x-correlator, trace-indicator, customer-journey, traceIndicatorIncrementor} of incoming request
 * @returns {Object} result - contains status of embedding process
 */
async function CreateLinkForProvidingDeletedLtpInformation(applicationName, releaseNumber, requestHeaders) {
  let result = {};
  let forwardingName = "NewApplicationCausesRequestForTopologyChangeInformation.CreateLinkForProvidingDeletedLtpInformation";
  try {
    /* formulating request body*/
    let requestBody = {};
    requestBody["serving-application-name"] = await httpServerInterface.getApplicationNameAsync();
    requestBody["serving-application-release-number"] = await httpServerInterface.getReleaseNumberAsync();
    let operationClientUuid = (await ControlConstruct.getUuidAsync()) + "-op-s-is-006";
    requestBody["operation-name"] = await operationServerInterface.getOperationNameAsync(operationClientUuid);
    requestBody["consuming-application-name"] = applicationName;
    requestBody["consuming-application-release-number"] = releaseNumber;

    let response = await IndividualServicesUtility.forwardRequest(
      forwardingName,
      requestBody,
      requestHeaders.user,
      requestHeaders.xCorrelator,
      requestHeaders.traceIndicator + "." + requestHeaders.traceIndicatorIncrementer++,
      requestHeaders.customerJourney
    );
    /* processing the response */
    result = processResponseForCreatingLinkService(response);
    console.log(`${forwardingName} has been triggered`);
  } catch (error) {
    console.log(error);
    result["successfully-connected"] = false;
    result["reason-of-failure"] = `ALT_UNKNOWN`;
  }
  return result;
}

/**
 * This function acts triggers and process callback for forwarding 
 *      "NewApplicationCausesRequestForTopologyChangeInformation.CreateLinkForProvidingUpdatedFcInformation"
 * @param {String} applicationName - name of regarded application
 * @param {String} releaseNumber - release of regarded application
 * @param {Object} requestHeaders {user, originator, x-correlator, trace-indicator, customer-journey, traceIndicatorIncrementor} of incoming request
 * @returns {Object} result - contains status of embedding process
 */
async function CreateLinkForProvidingUpdatedFcInformation(applicationName, releaseNumber, requestHeaders) {
  let result = {};
  let forwardingName = "NewApplicationCausesRequestForTopologyChangeInformation.CreateLinkForProvidingUpdatedFcInformation";
  try {
    /* formulating request body*/
    let requestBody = {};
    requestBody["serving-application-name"] = await httpServerInterface.getApplicationNameAsync();
    requestBody["serving-application-release-number"] = await httpServerInterface.getReleaseNumberAsync();
    let operationClientUuid = (await ControlConstruct.getUuidAsync()) + "-op-s-is-013";
    requestBody["operation-name"] = await operationServerInterface.getOperationNameAsync(operationClientUuid);
    requestBody["consuming-application-name"] = applicationName;
    requestBody["consuming-application-release-number"] = releaseNumber;

    let response = await IndividualServicesUtility.forwardRequest(
      forwardingName,
      requestBody,
      requestHeaders.user,
      requestHeaders.xCorrelator,
      requestHeaders.traceIndicator + "." + requestHeaders.traceIndicatorIncrementer++,
      requestHeaders.customerJourney
    );
    /* processing the response */
    result = processResponseForCreatingLinkService(response);
    console.log(`${forwardingName} has been triggered`);
  } catch (error) {
    console.log(error);
    result["successfully-connected"] = false;
    result["reason-of-failure"] = `ALT_UNKNOWN`;
  }
  return result;
}

/**
 * This function acts triggers and process callback for forwarding 
 *      "NewApplicationCausesRequestForTopologyChangeInformation.CreateLinkForProvidingUpdatedFcPortInformation"
 * @param {String} applicationName - name of regarded application
 * @param {String} releaseNumber - release of regarded application
 * @param {Object} requestHeaders {user, originator, x-correlator, trace-indicator, customer-journey, traceIndicatorIncrementor} of incoming request
 * @returns {Object} result - contains status of embedding process
 */
async function CreateLinkForProvidingUpdatedFcPortInformation(applicationName, releaseNumber, requestHeaders) {
  let result = {};
  let forwardingName = "NewApplicationCausesRequestForTopologyChangeInformation.CreateLinkForProvidingUpdatedFcPortInformation";
  try {
    /* formulating request body*/
    let requestBody = {};
    requestBody["serving-application-name"] = await httpServerInterface.getApplicationNameAsync();
    requestBody["serving-application-release-number"] = await httpServerInterface.getReleaseNumberAsync();
    let operationClientUuid = (await ControlConstruct.getUuidAsync()) + "-op-s-is-014";
    requestBody["operation-name"] = await operationServerInterface.getOperationNameAsync(operationClientUuid);
    requestBody["consuming-application-name"] = applicationName;
    requestBody["consuming-application-release-number"] = releaseNumber;

    let response = await IndividualServicesUtility.forwardRequest(
      forwardingName,
      requestBody,
      requestHeaders.user,
      requestHeaders.xCorrelator,
      requestHeaders.traceIndicator + "." + requestHeaders.traceIndicatorIncrementer++,
      requestHeaders.customerJourney
    );
    /* processing the response */
    result = processResponseForCreatingLinkService(response);
    console.log(`${forwardingName} has been triggered`);
  } catch (error) {
    console.log(error);
    result["successfully-connected"] = false;
    result["reason-of-failure"] = `ALT_UNKNOWN`;
  }
  return result;
}

/**
 * This function acts triggers and process callback for forwarding 
 *      "NewApplicationCausesRequestForTopologyChangeInformation.CreateLinkForProvidingDeletedFcPortInformation"
 * @param {String} applicationName - name of regarded application
 * @param {String} releaseNumber - release of regarded application
 * @param {Object} requestHeaders {user, originator, x-correlator, trace-indicator, customer-journey, traceIndicatorIncrementor} of incoming request
 * @returns {Object} result - contains status of embedding process
 */
async function CreateLinkForProvidingDeletedFcPortInformation(applicationName, releaseNumber, requestHeaders) {
  let result = {};
  let forwardingName = "NewApplicationCausesRequestForTopologyChangeInformation.CreateLinkForProvidingDeletedFcPortInformation";
  try {
    /* formulating request body*/
    let requestBody = {};
    requestBody["serving-application-name"] = await httpServerInterface.getApplicationNameAsync();
    requestBody["serving-application-release-number"] = await httpServerInterface.getReleaseNumberAsync();
    let operationClientUuid = (await ControlConstruct.getUuidAsync()) + "-op-s-is-015";
    requestBody["operation-name"] = await operationServerInterface.getOperationNameAsync(operationClientUuid);
    requestBody["consuming-application-name"] = applicationName;
    requestBody["consuming-application-release-number"] = releaseNumber;

    let response = await IndividualServicesUtility.forwardRequest(
      forwardingName,
      requestBody,
      requestHeaders.user,
      requestHeaders.xCorrelator,
      requestHeaders.traceIndicator + "." + requestHeaders.traceIndicatorIncrementer++,
      requestHeaders.customerJourney
    );
    /* processing the response */
    result = processResponseForCreatingLinkService(response);
    console.log(`${forwardingName} has been triggered`);
  } catch (error) {
    console.log(error);
    result["successfully-connected"] = false;
    result["reason-of-failure"] = `ALT_UNKNOWN`;
  }
  return result;
}

/**
 * This function is a generic code to formulate result for link-creating services
 * @param {Object} response contains response of add-operation-clients-to-link
 * @returns {Object} result - contains status of embedding process
 */
function processResponseForCreatingLinkService(response) {
  let result = {};
  try {
    let responseCode = response.status;
    if (!responseCode.toString().startsWith("2")) {
      if (responseCode.toString() == "404" || responseCode.toString() == "408") {
        result["successfully-connected"] = false;
        result["reason-of-failure"] = `ALT_NOT_REACHABLE`;
      } else {
        result["successfully-connected"] = false;
        result["reason-of-failure"] = `ALT_ALT_UNKNOWN`;
      }
    } else {
      let responseData = response.data;
      if (!responseData["client-successfully-added"]) {
        result["successfully-connected"] = false;
        result["reason-of-failure"] = `ALT_${responseData["reason-of-failure"]}`;
      } else {
        result["successfully-connected"] = true;
      }
    }
  } catch (error) {
    console.log(error);
    result["successfully-connected"] = false;
    result["reason-of-failure"] = `ALT_UNKNOWN`;
  }
  return result;
}

/**
 * This function updates the control-construct and creates link to Elasticsearch database 
 * @param {Object} controlConstruct - control-construct of regarded application
 * @param {String} applicationName - name of regarded application
 * @param {String} releaseNumber - release of regarded application
 * @param {Object} requestHeaders {user, originator, x-correlator, trace-indicator, customer-journey, traceIndicatorIncrementor} of incoming request
 * @returns {Boolean} - contains status of data update in database
 */
async function UpdateControlConstructAndLinksInDataBase(controlConstruct, applicationName, releaseNumber, requestHeaders) {
  try {
    // creates/update control-construct of application into database
    controlConstruct = controlConstruct["core-model-1-4:control-construct"];
    let took = (await ControlConstructService.createOrUpdateControlConstructAsync(controlConstruct))["took"];
    if (took == -1) {
      console.log(`control construct of ${controlConstruct[onfAttributes.GLOBAL_CLASS.UUID]} has not been updated in database `);
      return false;
    }
    // creates links for operation-servers of the application if not already exists into database
    let logicalTerminationPoints = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
    let operationServerNames = getAllOperationServerNameAsync(logicalTerminationPoints);
    let forwardings = [];
    for (let operationServerName of operationServerNames) {
      let endPointDetails = {
        'serving-application-name': applicationName,
        'serving-application-release-number': releaseNumber,
        'operation-name': operationServerName
      }
      let servingOperationResponse = await LinkServices.getServingOperationUuidAsync(endPointDetails);
      let servingOperationUuid = servingOperationResponse.servingOperationUuid;
      if (!servingOperationUuid) return false;
      let forwarding = await LinkServices.prepareLinkChangeNotificationForwardingsAsync(servingOperationUuid, []);
      if (forwarding) {
        forwardings.push(forwarding);
      }
    }
    // initiates forwarding of newly created links to OperationKeyManagement
    let operationServerUuidForCreatingLinks = (await ControlConstruct.getUuidAsync()) + "-op-s-is-018";    
    let newTraceIndicator = requestHeaders.traceIndicator + "." + (requestHeaders.traceIndicatorIncrementer - 1);
    let creatingLinksOperationServerName = await operationServerInterface.getOperationNameAsync(operationServerUuidForCreatingLinks);
    ForwardingAutomationService.automateForwardingConstructAsync(
      creatingLinksOperationServerName,
      forwardings,
      requestHeaders.user,
      requestHeaders.xCorrelator,
      newTraceIndicator,
      requestHeaders.customerJourney
    );
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

/**
 * Extracts operation server names from given list of LTPs.
 * @param {Array} logicalTerminationPoints LTPs from which the operation server names should be extracted
 * @returns {Array} of operation server names
 */
function getAllOperationServerNameAsync(logicalTerminationPoints) {
  let operationServerNames = [];
  for (let logicalTerminationPoint of logicalTerminationPoints) {
    let protocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
    let protocolName = protocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
    if (LayerProtocol.layerProtocolNameEnum.OPERATION_SERVER === protocolName) {
      let operationServerPac = protocol[onfAttributes.LAYER_PROTOCOL.OPERATION_SERVER_INTERFACE_PAC];
      let operationServerCapability = operationServerPac[onfAttributes.OPERATION_SERVER.CAPABILITY];
      operationServerNames.push(operationServerCapability[onfAttributes.OPERATION_SERVER.OPERATION_NAME]);
    }
  }
  return operationServerNames;
}




