'use strict';

const eventDispatcher = require('./ForwardingAutomationServiceWithResponse');
const httpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');
const onfPaths = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfPaths');
const ResponseProfile = require('onf-core-model-ap/applicationPattern/onfModel/models/profile/ResponseProfile');
const ProfileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
const ForwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const ForwardingConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingConstruct');
const logicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');
const tcpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const FcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');

/**
* @description This function helps to get the APISegment of the operationClient uuid
* @return {Promise} returns the APISegment
**/
exports.getApiSegmentOfOperationClient = function (operationClientUuid) {
    let APISegment;
    try {
        APISegment = operationClientUuid.split("-")[6];
    } catch (error) {
        console.log("error in extracting the APISegment");
    }
    return APISegment;
}

exports.resolveApplicationNameAndHttpClientLtpUuidFromForwardingNameOfTypeSubscription = async function (forwardingName, applicationName, releaseNumber) {
    let httpClientUuidOfTheSubscribedApplication = undefined;
    const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
    if (forwardingConstruct === undefined) {
        return null;
    }

    let fcPortOutputDirectionLogicalTerminationPointList = [];
    const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
    for (const fcPort of fcPortList) {
        const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
        if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
            fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
        }
    }

    if (fcPortOutputDirectionLogicalTerminationPointList.length == 0) {
        return null;
    }

    for (let i = 0; i < fcPortOutputDirectionLogicalTerminationPointList.length; i++) {
        const opLtpUuid = fcPortOutputDirectionLogicalTerminationPointList[i];
        const httpLtpUuidList = await logicalTerminationPoint.getServerLtpListAsync(opLtpUuid);
        const httpClientLtpUuid = httpLtpUuidList[0];
        const _applicationName = await httpClientInterface.getApplicationNameAsync(httpClientLtpUuid);
        const _releaseNumber = await httpClientInterface.getReleaseNumberAsync(httpClientLtpUuid);
        if (_applicationName == applicationName && _releaseNumber == releaseNumber) {
            httpClientUuidOfTheSubscribedApplication = httpClientLtpUuid;
        }
    }
    return httpClientUuidOfTheSubscribedApplication;
}

/**
 * @description This function automates the forwarding construct by calling the appropriate call back operations based on the fcPort input and output directions.
 * @param {String} forwardingKindName Name of forwarding which has to be triggered
 * @param {list}   attributeList list of attributes required during forwarding construct automation(to send in the request body)
 * @param {String} user user who initiates this request
 * @param {string} originator originator of the request
 * @param {string} xCorrelator flow id of this request
 * @param {string} traceIndicator trace indicator of the request
 * @param {string} customerJourney customer journey of the request
 **/
exports.forwardRequest = function (forwardingKindName, attributeList, user, xCorrelator, traceIndicator, customerJourney, context) {
    return new Promise(async function (resolve, reject) {
        try {
            let forwardingConstructInstance = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingKindName);
            let operationClientUuid = "";
            if (context) {
                let fcPortList = forwardingConstructInstance["fc-port"];
                for (let fcPort of fcPortList) {
                    let fcPortDirection = fcPort["port-direction"];
                    if (fcPortDirection == FcPort.portDirectionEnum.OUTPUT) {
                        let isOutputMatchesContext = await isOutputMatchesContextAsync(fcPort, context);
                        if (isOutputMatchesContext) {
                            operationClientUuid = fcPort["logical-termination-point"];
                        }
                    }
                }
            } else {
                operationClientUuid = (await exports.getFcPortOutputLogicalTerminationPointList(forwardingConstructInstance))[0];
            }
            let result = await eventDispatcher.dispatchEvent(
                operationClientUuid,
                attributeList,
                user,
                xCorrelator,
                traceIndicator,
                customerJourney
            );
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * @description This function automates the forwarding construct by calling the appropriate call back operations based on the fcPort input and output directions.
 *              With default operation-key
 * @param {String} forwardingKindName Name of forwarding which has to be triggered
 * @param {list}   attributeList list of attributes required during forwarding construct automation(to send in the request body)
 * @param {String} user user who initiates this request
 * @param {string} originator originator of the request
 * @param {string} xCorrelator flow id of this request
 * @param {string} traceIndicator trace indicator of the request
 * @param {string} customerJourney customer journey of the request
 **/
exports.forwardRequestWithDefaultOperationKey = function (forwardingKindName, attributeList, user, xCorrelator, traceIndicator, customerJourney, context) {
    return new Promise(async function (resolve, reject) {
        try {
            let forwardingConstructInstance = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingKindName);
            let operationClientUuid = "";
            if (context) {
                let fcPortList = forwardingConstructInstance["fc-port"];
                for (let fcPort of fcPortList) {
                    let fcPortDirection = fcPort["port-direction"];
                    if (fcPortDirection == FcPort.portDirectionEnum.OUTPUT) {
                        let isOutputMatchesContext = await isOutputMatchesContextAsync(fcPort, context);
                        if (isOutputMatchesContext) {
                            operationClientUuid = fcPort["logical-termination-point"];
                        }
                    }
                }
            } else {
                operationClientUuid = (await exports.getFcPortOutputLogicalTerminationPointList(forwardingConstructInstance))[0];
            }
            let result = await eventDispatcher.dispatchEventWithDefaultOperationKey(
                operationClientUuid,
                attributeList,
                user,
                xCorrelator,
                traceIndicator,
                customerJourney
            );
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

exports.getFcPortOutputLogicalTerminationPointList = async function (forwardingConstructInstance) {
    let fcPortOutputLogicalTerminationPointList = [];
    let fcPortList = forwardingConstructInstance[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
    for (let i = 0; i < fcPortList.length; i++) {
        let fcPort = fcPortList[i];
        let fcPortPortDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
        if (fcPortPortDirection == FcPort.portDirectionEnum.OUTPUT) {
            let fclogicalTerminationPoint = fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT];
            fcPortOutputLogicalTerminationPointList.push(fclogicalTerminationPoint);
        }
    }
    return fcPortOutputLogicalTerminationPointList;
}

exports.getConsequentOperationClientUuid = async function (forwardingName, applicationName, releaseNumber) {
    let forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(
        forwardingName);
    let fcPortList = forwardingConstruct["fc-port"];
    for (let fcPort of fcPortList) {
        let fcPortDirection = fcPort["port-direction"];
        if (fcPortDirection == FcPort.portDirectionEnum.OUTPUT) {
            let fcLogicalTerminationPoint = fcPort["logical-termination-point"];
            let serverLtpList = await logicalTerminationPoint.getServerLtpListAsync(fcLogicalTerminationPoint);
            let httpClientUuid = serverLtpList[0];
            let applicationNameOfClient = await httpClientInterface.getApplicationNameAsync(httpClientUuid);
            let releaseNumberOfClient = await httpClientInterface.getReleaseNumberAsync(httpClientUuid);
            if (applicationNameOfClient == applicationName && releaseNumberOfClient == releaseNumber) {
                return fcLogicalTerminationPoint;
            }
        }
    }
    return undefined;
}

async function isOutputMatchesContextAsync(fcPort, context) {
    let fcLogicalTerminationPoint = fcPort["logical-termination-point"];
    let serverLtpList = await logicalTerminationPoint.getServerLtpListAsync(fcLogicalTerminationPoint);
    let httpClientUuid = serverLtpList[0];
    let applicationName = await httpClientInterface.getApplicationNameAsync(httpClientUuid);
    let releaseNumber = await httpClientInterface.getReleaseNumberAsync(httpClientUuid);
    return (context == (applicationName + releaseNumber));
}