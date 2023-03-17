const forwardingConstructAutomationInput = require('onf-core-model-ap/applicationPattern/onfModel/services/models/forwardingConstruct/AutomationInput');
const httpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const tcpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpServerInterface');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const onfFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');
const prepareALTForwardingAutomation = require('onf-core-model-ap-bs/basicServices/services/PrepareALTForwardingAutomation');
const logicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');
const LayerProtocol = require('onf-core-model-ap/applicationPattern/onfModel/models/LayerProtocol');
const operationServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationServerInterface');
const onfPaths = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfPaths');

const fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');
const ControlConstructService = require('./ControlConstructService');
const LinkServices = require('./LinkServices');

exports.regardApplication = function (logicalTerminationPointconfigurationStatus, forwardingConstructConfigurationStatus, clientApplicationName,
    clientReleaseNumber) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {
            let forwardingAutomation;

            /***********************************************************************************
             * NewApplicationCausesRequestForTopologyChangeInformation /v1/redirect-topology-change-information
             ************************************************************************************/
            let topologyChangeInformationForwardingName = "NewApplicationCausesRequestForTopologyChangeInformation";
            let topologyChangeInformationContext = clientApplicationName + clientReleaseNumber;
            let topologyChangeInformationRequestBody = {};
            topologyChangeInformationRequestBody.topologyApplication = await httpServerInterface.getApplicationNameAsync();
            topologyChangeInformationRequestBody.topologyApplicationReleaseNumber = await httpServerInterface.getReleaseNumberAsync();
            topologyChangeInformationRequestBody.topologyApplicationAddress = await tcpServerInterface.getLocalAddress();
            topologyChangeInformationRequestBody.topologyApplicationPort = await tcpServerInterface.getLocalPort();
            topologyChangeInformationRequestBody.topologyOperationApplicationUpdate = "/v1/update-all-ltps-and-fcs";
            topologyChangeInformationRequestBody.topologyOperationLtpUpdate = "/v1/update-ltp";
            topologyChangeInformationRequestBody.topologyOperationLtpDeletion = "/v1/delete-ltp-and-dependents";
            topologyChangeInformationRequestBody.topologyOperationFcUpdate = "/v1/update-fc";
            topologyChangeInformationRequestBody.topologyOperationFcPortUpdate = "/v1/update-fc-port";
            topologyChangeInformationRequestBody.topologyOperationFcPortDeletion = "/v1/delete-fc-port";
            

            topologyChangeInformationRequestBody = onfFormatter.modifyJsonObjectKeysToKebabCase(topologyChangeInformationRequestBody);
            forwardingAutomation = new forwardingConstructAutomationInput(
                topologyChangeInformationForwardingName,
                topologyChangeInformationRequestBody,
                topologyChangeInformationContext
            );
            forwardingConstructAutomationList.push(forwardingAutomation);

            /***********************************************************************************
             * forwardings for application layer topology
             ************************************************************************************/
            let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputAsync(
                logicalTerminationPointconfigurationStatus,
                forwardingConstructConfigurationStatus
            );

            if (applicationLayerTopologyForwardingInputList) {
                for (let i = 0; i < applicationLayerTopologyForwardingInputList.length; i++) {
                    let applicationLayerTopologyForwardingInput = applicationLayerTopologyForwardingInputList[i];
                    forwardingConstructAutomationList.push(applicationLayerTopologyForwardingInput);
                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.disregardApplication = function (logicalTerminationPointconfigurationStatus, forwardingConstructConfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {

            /***********************************************************************************
             * forwardings for application layer topology
             ************************************************************************************/
            let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputAsync(
                logicalTerminationPointconfigurationStatus,
                forwardingConstructConfigurationStatus
            );

            if (applicationLayerTopologyForwardingInputList) {
                for (let i = 0; i < applicationLayerTopologyForwardingInputList.length; i++) {
                    let applicationLayerTopologyForwardingInput = applicationLayerTopologyForwardingInputList[i];
                    forwardingConstructAutomationList.push(applicationLayerTopologyForwardingInput);
                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.endSubscription = function (logicalTerminationPointconfigurationStatus, forwardingConstructConfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {

            /***********************************************************************************
           * forwardings for application layer topology
           ************************************************************************************/
            let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTUnConfigureForwardingAutomationInputAsync(
                logicalTerminationPointconfigurationStatus,
                forwardingConstructConfigurationStatus
            );

            if (applicationLayerTopologyForwardingInputList) {
                for (let i = 0; i < applicationLayerTopologyForwardingInputList.length; i++) {
                    let applicationLayerTopologyForwardingInput = applicationLayerTopologyForwardingInputList[i];
                    forwardingConstructAutomationList.push(applicationLayerTopologyForwardingInput);
                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.notifyLinkUpdates = function (logicalTerminationPointconfigurationStatus, forwardingConstructConfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {

            /***********************************************************************************
             * forwardings for application layer topology
             ************************************************************************************/
            let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputAsync(
                logicalTerminationPointconfigurationStatus,
                forwardingConstructConfigurationStatus
            );

            if (applicationLayerTopologyForwardingInputList) {
                for (let i = 0; i < applicationLayerTopologyForwardingInputList.length; i++) {
                    let applicationLayerTopologyForwardingInput = applicationLayerTopologyForwardingInputList[i];
                    forwardingConstructAutomationList.push(applicationLayerTopologyForwardingInput);
                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.addOperationClientToLink = function (linkUuid) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {
            let forwardingAutomation;

            /***********************************************************************************
             * LinkChangeNotification /v1/regard-updated-link
             ************************************************************************************/
            let linkChangeNotificationForwardingName = "LinkChangeNotification";
            let linkChangeNotificationContext;
            let linkChangeNotificationRequestBody = {};
            linkChangeNotificationRequestBody.linkUuid = linkUuid;

            linkChangeNotificationRequestBody = onfFormatter.modifyJsonObjectKeysToKebabCase(linkChangeNotificationRequestBody);
            forwardingAutomation = new forwardingConstructAutomationInput(
                linkChangeNotificationForwardingName,
                linkChangeNotificationRequestBody,
                linkChangeNotificationContext
            );
            forwardingConstructAutomationList.push(forwardingAutomation);
            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.removeOperationClientFromLink = function (linkUuid) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {
            let forwardingAutomation;

            /***********************************************************************************
             * LinkChangeNotification /v1/regard-updated-link
             ************************************************************************************/
            let linkChangeNotificationForwardingName = "LinkChangeNotification";
            let linkChangeNotificationContext;
            let linkChangeNotificationRequestBody = {};
            linkChangeNotificationRequestBody.linkUuid = linkUuid;

            linkChangeNotificationRequestBody = onfFormatter.modifyJsonObjectKeysToKebabCase(linkChangeNotificationRequestBody);
            forwardingAutomation = new forwardingConstructAutomationInput(
                linkChangeNotificationForwardingName,
                linkChangeNotificationRequestBody,
                linkChangeNotificationContext
            );
            forwardingConstructAutomationList.push(forwardingAutomation);
            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.updateLtp = async function(existingLtp, newLtp) {
    let consumingHttpServerCapability = await ControlConstructService.findHttpServerCapabilityFromLtpUuid(existingLtp.uuid);
    let protocols = newLtp[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL];
    let protocol = protocols[0];
    let protocolName = protocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
    if (LayerProtocol.layerProtocolNameEnum.OPERATION_CLIENT === protocolName) {
        return await updateOperationClientLtp(existingLtp, newLtp, consumingHttpServerCapability);
    } else if (LayerProtocol.layerProtocolNameEnum.HTTP_CLIENT === protocolName) {
        return await updateHttpClientLtp(existingLtp, newLtp, consumingHttpServerCapability);
    }
    return [];
}

async function updateHttpClientLtp(existingLtp, newLtp, consumingHttpServerCapability) {
    let forwardingConstructAutomationList = [];
    let existingReleaseNumber = consumingHttpServerCapability[onfAttributes.HTTP_SERVER.RELEASE_NUMBER];
    let newReleaseNumber = getReleaseNumberFromHttpClient(newLtp);
    if (existingReleaseNumber === newReleaseNumber) {
        return forwardingConstructAutomationList;
    }
    for (let existingOperationClientUuid of existingLtp[onfAttributes.LOGICAL_TERMINATION_POINT.CLIENT_LTP]) {
        let linkOutput = await LinkServices.getOutputLinkPortFromInputLinkPortUuidAsync(existingOperationClientUuid);
        if (!linkOutput) {
            continue;
        }
        let operationClientName = await findOperationClientNameAsync(existingOperationClientUuid);
        let operationServerUuid = linkOutput[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
        let servingHttpServerCapability = await ControlConstructService.findHttpServerCapabilityFromLtpUuid(operationServerUuid);
        let servingApplicationReleaseNumber = servingHttpServerCapability[onfAttributes.HTTP_SERVER.RELEASE_NUMBER];
        if (newReleaseNumber !== servingApplicationReleaseNumber) {
            let forwardingAutomation = createForwarding(
                servingHttpServerCapability,
                operationClientName,
                "LtpUpdateMightCauseOperationClientBeingRemovedFromLink", 
                consumingHttpServerCapability);
            forwardingConstructAutomationList.push(forwardingAutomation);
        }
        if (operationServerUuid) {
            servingHttpServerCapability[onfAttributes.HTTP_SERVER.RELEASE_NUMBER] = newReleaseNumber;
            /**************************************************************************************************************
             * LtpUpdateMightCauseOperationClientBeingAddedToLink /v1/update-ltp -> /v1/add-operation-client-to-link
             *************************************************************************************************************/
            let forwardingAutomation = createForwarding(
                servingHttpServerCapability,
                operationClientName,
                "LtpUpdateMightCauseOperationClientBeingAddedToLink", 
                consumingHttpServerCapability);
            forwardingConstructAutomationList.push(forwardingAutomation);
        }
    }
    return forwardingConstructAutomationList;
}

async function updateOperationClientLtp(existingLtp, newLtp, consumingHttpServerCapability) {
    let forwardingConstructAutomationList = [];
    let operationClientNewName = getOperationClientNameFromLtp(newLtp);
    let operationClientExistingName = getOperationClientNameFromLtp(existingLtp);
    if (operationClientNewName === operationClientExistingName) {
        return forwardingConstructAutomationList;
    }
    let linkOutput = await LinkServices.getOutputLinkPortFromInputLinkPortUuidAsync(existingLtp.uuid);
    if (!linkOutput) {
        return forwardingConstructAutomationList;
    }
    let operationServerUuid = linkOutput[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
    let operationServerName = await findOperationServerNameAsync(operationServerUuid);
    if (operationClientNewName === operationServerName) {
        return forwardingConstructAutomationList;
    }
    let servingHttpServerCapability = await ControlConstructService.findHttpServerCapabilityFromLtpUuid(operationServerUuid);
    /**************************************************************************************************************
     * LtpUpdateMightCauseOperationClientBeingRemovedFromLink /v1/update-ltp -> /v1/remove-operation-client-to-link
     *************************************************************************************************************/
    let forwardingAutomation = createForwarding(
        servingHttpServerCapability,
        operationClientExistingName,
        "LtpUpdateMightCauseOperationClientBeingRemovedFromLink", 
        consumingHttpServerCapability);
    forwardingConstructAutomationList.push(forwardingAutomation);
    // send add
    if (operationServerName.length !== 0) {
        /**************************************************************************************************************
         * LtpUpdateMightCauseOperationClientBeingAddedToLink /v1/update-ltp -> /v1/add-operation-client-to-link
         *************************************************************************************************************/
        let forwardingAutomation = createForwarding(
            servingHttpServerCapability,
            operationClientNewName,
            "LtpUpdateMightCauseOperationClientBeingAddedToLink", 
            consumingHttpServerCapability);
        forwardingConstructAutomationList.push(forwardingAutomation);
    }
    return forwardingConstructAutomationList;
}

function createForwarding(servingHttpServerCapability, operationName, forwardingName, consumingHttpServerCapability) {
    let forwardingRequestBody = {};
    forwardingRequestBody.servingApplicationName = servingHttpServerCapability[onfAttributes.HTTP_SERVER.APPLICATION_NAME];
    forwardingRequestBody.servingApplicationReleaseNumber = servingHttpServerCapability[onfAttributes.HTTP_SERVER.RELEASE_NUMBER];
    forwardingRequestBody.operationName = operationName;
    forwardingRequestBody.consumerApplicationName = consumingHttpServerCapability[onfAttributes.HTTP_SERVER.APPLICATION_NAME];
    forwardingRequestBody.consumerReleaseNumber = consumingHttpServerCapability[onfAttributes.HTTP_SERVER.RELEASE_NUMBER];

    forwardingRequestBody = onfFormatter.modifyJsonObjectKeysToKebabCase(forwardingRequestBody);
    let forwardingAutomation = new forwardingConstructAutomationInput(
        forwardingName,
        forwardingRequestBody,
        {}
    );
    return forwardingAutomation;
}

function getOperationClientNameFromLtp(ltp) {
    let protocols = ltp[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL];
    let protocol = protocols[0];
    if (onfAttributes.LAYER_PROTOCOL.OPERATION_CLIENT_INTERFACE_PAC in protocol) {
        let opClientInterfacePac = protocol[onfAttributes.LAYER_PROTOCOL.OPERATION_CLIENT_INTERFACE_PAC];
        let opClientConf = opClientInterfacePac[onfAttributes.OPERATION_CLIENT.CONFIGURATION];
        return opClientConf[onfAttributes.OPERATION_CLIENT.OPERATION_NAME];
    }
    return '';
}

async function findOperationServerNameAsync(operationServerUuid) {
    let cc = await ControlConstructService.getControlConstructFromLtpUuidAsync(operationServerUuid);
    let filteredLtps = cc[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
    let operationServerLtp = filteredLtps.find(ltp => ltp.uuid === operationServerUuid);
    if (operationServerLtp) {
        let protocol = operationServerLtp[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
        if (onfAttributes.LAYER_PROTOCOL.OPERATION_SERVER_INTERFACE_PAC in protocol) {
            let opServerInterfacePac = protocol[onfAttributes.LAYER_PROTOCOL.OPERATION_SERVER_INTERFACE_PAC];
            let opServerCap = opServerInterfacePac[onfAttributes.OPERATION_SERVER.CAPABILITY];
            return opServerCap[onfAttributes.OPERATION_SERVER.OPERATION_NAME];
        };
    }
    return '';
}

async function findOperationClientNameAsync(operationClientUuid) {
    let cc = await ControlConstructService.getControlConstructFromLtpUuidAsync(operationClientUuid);
    let filteredLtps = cc[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
    let operationClientLtp = filteredLtps.find(ltp => ltp.uuid === operationClientUuid);
    return getOperationClientNameFromLtp(operationClientLtp);
}

function getReleaseNumberFromHttpClient(logicalTerminationPoint) {
    let protocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
    let layerProtocolName = protocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
    if (LayerProtocol.layerProtocolNameEnum.HTTP_CLIENT === layerProtocolName) {
        let httpClientInterfacePac = protocol[onfAttributes.LAYER_PROTOCOL.HTTP_CLIENT_INTERFACE_PAC];
        let httpClientConf = httpClientInterfacePac[onfAttributes.HTTP_CLIENT.CONFIGURATION];
        return httpClientConf[onfAttributes.HTTP_CLIENT.RELEASE_NUMBER];
    }
    throw new Error('Release number of serving application not found.');
}


exports.inquireOamRequestApprovals = function (logicalTerminationPointconfigurationStatus, forwardingConstructConfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {

            /***********************************************************************************
             * forwardings for application layer topology
             ************************************************************************************/
            let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputAsync(
                logicalTerminationPointconfigurationStatus,
                forwardingConstructConfigurationStatus
            );

            if (applicationLayerTopologyForwardingInputList) {
                for (let i = 0; i < applicationLayerTopologyForwardingInputList.length; i++) {
                    let applicationLayerTopologyForwardingInput = applicationLayerTopologyForwardingInputList[i];
                    forwardingConstructAutomationList.push(applicationLayerTopologyForwardingInput);
                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.redirectOamRequestInformation = function (logicalTerminationPointconfigurationStatus, forwardingConstructConfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {

            /***********************************************************************************
             * forwardings for application layer topology
             ************************************************************************************/
            let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputAsync(
                logicalTerminationPointconfigurationStatus,
                forwardingConstructConfigurationStatus
            );

            if (applicationLayerTopologyForwardingInputList) {
                for (let i = 0; i < applicationLayerTopologyForwardingInputList.length; i++) {
                    let applicationLayerTopologyForwardingInput = applicationLayerTopologyForwardingInputList[i];
                    forwardingConstructAutomationList.push(applicationLayerTopologyForwardingInput);
                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.redirectServiceRequestInformation = function (logicalTerminationPointconfigurationStatus, forwardingConstructConfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {

            /***********************************************************************************
             * forwardings for application layer topology
             ************************************************************************************/
            let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputAsync(
                logicalTerminationPointconfigurationStatus,
                forwardingConstructConfigurationStatus
            );

            if (applicationLayerTopologyForwardingInputList) {
                for (let i = 0; i < applicationLayerTopologyForwardingInputList.length; i++) {
                    let applicationLayerTopologyForwardingInput = applicationLayerTopologyForwardingInputList[i];
                    forwardingConstructAutomationList.push(applicationLayerTopologyForwardingInput);
                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.redirectTopologyChangeInformation = function (logicalTerminationPointconfigurationStatus, forwardingConstructConfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {
            /***********************************************************************************
             * PromptForRedirectingTopologyInformationCausesSendingAnInitialStateToALT 
             * /v1/update-all-ltps-and-fcs
             ************************************************************************************/
            let updateAllLtpsAndFcsForwardingName = "PromptForRedirectingTopologyInformationCausesSendingAnInitialStateToALT";
            let updateAllLtpsAndFcsContext;
            let updateAllLtpsAndFcsRequestBody = {};
            let controlConstructUrl = onfPaths.CONTROL_CONSTRUCT;
            let controlConstruct = await fileOperation.readFromDatabaseAsync(controlConstructUrl);
            controlConstruct = removeAttribute(
                controlConstruct,
                "operation-key");
            updateAllLtpsAndFcsRequestBody["core-model-1-4:control-construct"] = controlConstruct;
            let forwardingAutomation = new forwardingConstructAutomationInput(
                updateAllLtpsAndFcsForwardingName,
                updateAllLtpsAndFcsRequestBody,
                updateAllLtpsAndFcsContext
            );
            forwardingConstructAutomationList.push(forwardingAutomation);

            /***********************************************************************************
             * forwardings for application layer topology
             ************************************************************************************/
            let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputAsync(
                logicalTerminationPointconfigurationStatus,
                forwardingConstructConfigurationStatus
            );

            if (applicationLayerTopologyForwardingInputList) {
                for (let i = 0; i < applicationLayerTopologyForwardingInputList.length; i++) {
                    let applicationLayerTopologyForwardingInput = applicationLayerTopologyForwardingInputList[i];
                    forwardingConstructAutomationList.push(applicationLayerTopologyForwardingInput);
                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.updateOperationKey = function (logicalTerminationPointconfigurationStatus, forwardingConstructConfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {

            /***********************************************************************************
             * forwardings for application layer topology
             ************************************************************************************/
            let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputAsync(
                logicalTerminationPointconfigurationStatus,
                forwardingConstructConfigurationStatus
            );

            if (applicationLayerTopologyForwardingInputList) {
                for (let i = 0; i < applicationLayerTopologyForwardingInputList.length; i++) {
                    let applicationLayerTopologyForwardingInput = applicationLayerTopologyForwardingInputList[i];
                    forwardingConstructAutomationList.push(applicationLayerTopologyForwardingInput);
                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.updateOperationClient = function (logicalTerminationPointconfigurationStatus, forwardingConstructConfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {

            /***********************************************************************************
             * forwardings for application layer topology
             ************************************************************************************/
            let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputAsync(
                logicalTerminationPointconfigurationStatus,
                forwardingConstructConfigurationStatus
            );

            if (applicationLayerTopologyForwardingInputList) {
                for (let i = 0; i < applicationLayerTopologyForwardingInputList.length; i++) {
                    let applicationLayerTopologyForwardingInput = applicationLayerTopologyForwardingInputList[i];
                    forwardingConstructAutomationList.push(applicationLayerTopologyForwardingInput);
                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}


exports.updateClient = function (logicalTerminationPointconfigurationStatus, forwardingConstructConfigurationStatus, applicationName) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {

            let currentApplicationName = await httpServerInterface.getApplicationNameAsync();
            if (currentApplicationName == applicationName) {
                let operationServerUuidList = await logicalTerminationPoint.getUuidListForTheProtocolAsync(
                    LayerProtocol.layerProtocolNameEnum.OPERATION_SERVER
                );
                for (let i = 0; i < operationServerUuidList.length; i++) {
                    let operationServerUuid = operationServerUuidList[i];
                    let lifeCycleState = await operationServerInterface.getLifeCycleState(operationServerUuid);
                    if (lifeCycleState == operationServerInterface.OperationServerInterfacePac.OperationServerInterfaceConfiguration.lifeCycleStateEnum.DEPRECATED) {
                        let oldOperationName = await operationServerInterface.getOperationNameAsync(operationServerUuid);
                        let newOperationName = await operationServerInterface.getNextVersionOfOperationNameIfExists(
                            oldOperationName);
                        /***********************************************************************************
                         * Send relay operation update /v1/relay-operation-update
                         ************************************************************************************/
                        if (newOperationName) {
                            let operationUpdateForwardingName = "PromptingNewReleaseForUpdatingServerCausesRequestForBroadcastingInfoAboutBackwardCompatibleUpdateOfOperation";
                            let operationUpdateContext;
                            let operationUpdateRequestBody = {};
                            operationUpdateRequestBody.applicationName = applicationName;
                            operationUpdateRequestBody.applicationReleaseNumber = await httpServerInterface.getReleaseNumberAsync();
                            operationUpdateRequestBody.oldOperationName = oldOperationName;
                            operationUpdateRequestBody.newOperationName = newOperationName;
                            operationUpdateRequestBody = onfFormatter.modifyJsonObjectKeysToKebabCase(operationUpdateRequestBody);
                            let forwardingAutomation = new forwardingConstructAutomationInput(
                                operationUpdateForwardingName,
                                operationUpdateRequestBody,
                                operationUpdateContext
                            );
                            forwardingConstructAutomationList.push(forwardingAutomation);
                        }
                    }
                }
            }

            /***********************************************************************************
             * forwardings for application layer topology
             ************************************************************************************/
            let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputAsync(
                logicalTerminationPointconfigurationStatus,
                forwardingConstructConfigurationStatus
            );

            if (applicationLayerTopologyForwardingInputList) {
                for (let i = 0; i < applicationLayerTopologyForwardingInputList.length; i++) {
                    let applicationLayerTopologyForwardingInput = applicationLayerTopologyForwardingInputList[i];
                    forwardingConstructAutomationList.push(applicationLayerTopologyForwardingInput);
                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

function removeAttribute(jsonObject, attributeName) {

    for (var element in jsonObject) {

        if (jsonObject.hasOwnProperty(element)) {

            if (element == attributeName) {
                delete jsonObject[element];

            } else if (typeof jsonObject[element] == 'object') {
                removeAttribute(jsonObject[element], attributeName);
            }
        }
    }
    return jsonObject;
}

exports.bequeathYourDataAndDie = function (logicalTerminationPointconfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {

            /***********************************************************************************
             * forwardings for application layer topology
             ************************************************************************************/
            let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputAsync(
                logicalTerminationPointconfigurationStatus,
                undefined
            );

            if (applicationLayerTopologyForwardingInputList) {
                for (let i = 0; i < applicationLayerTopologyForwardingInputList.length; i++) {
                    let applicationLayerTopologyForwardingInput = applicationLayerTopologyForwardingInputList[i];
                    forwardingConstructAutomationList.push(applicationLayerTopologyForwardingInput);
                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.OAMLayerRequest = function (uuid) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {

            /***********************************************************************************         
                        forwardings for application layer topology            
             *************************************************************************************/
            let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputForOamRequestAsync(
                uuid
            );


            if (applicationLayerTopologyForwardingInputList) {
                for (let i = 0; i < applicationLayerTopologyForwardingInputList.length; i++) {
                    let applicationLayerTopologyForwardingInput = applicationLayerTopologyForwardingInputList[i];
                    forwardingConstructAutomationList.push(applicationLayerTopologyForwardingInput);
                }
            }
            resolve(forwardingConstructAutomationList);
        }
        catch (error) {
            reject(error);
        }
    });
}