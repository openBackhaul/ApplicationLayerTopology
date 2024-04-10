const forwardingConstructConfigurationInput = require('onf-core-model-ap/applicationPattern/onfModel/services/models/forwardingConstruct/ConfigurationInput');
const operationClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationClientInterface');
const httpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');
const operationServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationServerInterface');
const forwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const FcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');
const logicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');

exports.regardApplication = function (operationClientConfigurationStatusList,
    redirectTopologyInformationOperation) {
    return new Promise(async function (resolve, reject) {
        let forwardingConfigurationInputList = [];
        try {
            for (let i = 0; i < operationClientConfigurationStatusList.length; i++) {
                let configurationStatus = operationClientConfigurationStatusList[i];
                let operationClientUuid = configurationStatus.uuid;
                let operationClientName = await operationClientInterface.
                getOperationNameAsync(operationClientUuid);
                let forwardingConfigurationInput;
                if (operationClientName == redirectTopologyInformationOperation) {
                    let forwardingNameForInquiringTopologyChangeInformationWithDefaultKey =
                        "NewApplicationCausesRequestForTopologyChangeInformation.RequestForInquiringTopologyChangeInformationWithDefaultKey";
                    forwardingConfigurationInput = new forwardingConstructConfigurationInput(
                        forwardingNameForInquiringTopologyChangeInformationWithDefaultKey,
                        operationClientUuid
                    );
                    forwardingConfigurationInputList.push(
                        forwardingConfigurationInput
                    );
                    let forwardingNameForInquiringTopologyChangeInformation =
                        "NewApplicationCausesRequestForTopologyChangeInformation.RequestForInquiringTopologyChangeInformation";
                    forwardingConfigurationInput = new forwardingConstructConfigurationInput(
                        forwardingNameForInquiringTopologyChangeInformation,
                        operationClientUuid
                    );
                    forwardingConfigurationInputList.push(
                        forwardingConfigurationInput
                    );
                }
            }
            resolve(forwardingConfigurationInputList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.disregardApplication = function (operationClientConfigurationStatusList){
    return new Promise(async function (resolve, reject) {
        let forwardingConfigurationInputList = [];
        try {
            for (let i = 0; i < operationClientConfigurationStatusList.length; i++) {

                let configurationStatus = operationClientConfigurationStatusList[i];
                let operationClientUuid = configurationStatus.uuid;

                let forwardingConstructList = await forwardingDomain.getForwardingConstructListForTheFcPortAsync(
                    operationClientUuid,
                    FcPort.portDirectionEnum.OUTPUT);

                for (let j = 0; j < forwardingConstructList.length; j++) {
                    let fcNameList = forwardingConstructList[j]["name"];
                    let forwardingName = getValueFromKey(fcNameList, "ForwardingName");
                    let forwardingConfigurationInput = new forwardingConstructConfigurationInput(
                        forwardingName,
                        operationClientUuid
                    );
                    forwardingConfigurationInputList.push(
                        forwardingConfigurationInput
                    );
                }                
            }
            resolve(forwardingConfigurationInputList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.notifyLinkUpdates = function (operationClientConfigurationStatusList, subscriberOperation) {
    return new Promise(async function (resolve, reject) {
        let forwardingConfigurationInputList = [];
        try {
            for (let i = 0; i < operationClientConfigurationStatusList.length; i++) {
                let configurationStatus = operationClientConfigurationStatusList[i];
                let operationClientUuid = configurationStatus.uuid;
                let operationClientName = await operationClientInterface.
                getOperationNameAsync(operationClientUuid);
                let forwardingConfigurationInput;
                let forwardingName;
                if (operationClientName == subscriberOperation) {
                    forwardingName =
                        "LinkChangeNotification";
                    forwardingConfigurationInput = new forwardingConstructConfigurationInput(
                        forwardingName,
                        operationClientUuid
                    );
                }
                forwardingConfigurationInputList.push(
                    forwardingConfigurationInput
                );
            }
            resolve(forwardingConfigurationInputList);
        } catch (error) {
            reject(error);
        }
    });
}


exports.inquireOamRequestApprovals = function (operationClientConfigurationStatusList, oamApprovalOperation) {
    return new Promise(async function (resolve, reject) {
        let forwardingConfigurationInputList = [];
        try {
            for (let i = 0; i < operationClientConfigurationStatusList.length; i++) {
                let configurationStatus = operationClientConfigurationStatusList[i];
                let operationClientUuid = configurationStatus.uuid;
                let operationClientName = await operationClientInterface.
                getOperationNameAsync(operationClientUuid);
                let forwardingConfigurationInput;
                let forwardingName;
                if (operationClientName == oamApprovalOperation) {
                    forwardingName =
                        "OamRequestCausesInquiryForAuthentication";
                    forwardingConfigurationInput = new forwardingConstructConfigurationInput(
                        forwardingName,
                        operationClientUuid
                    );
                }
                forwardingConfigurationInputList.push(
                    forwardingConfigurationInput
                );
            }
            resolve(forwardingConfigurationInputList);
        } catch (error) {
            reject(error);
        }
    });
}


exports.endSubscription = function (subscriberApplication, subscriberReleaseNumber, subscriptionOperation) {
    return new Promise(async function (resolve, reject) {
        let forwardingConfigurationInputList = [];
        try {
            let httpClientUuid = await httpClientInterface.getHttpClientUuidAsync(subscriberApplication, subscriberReleaseNumber);
            if (httpClientUuid) {
                let operationClientUuidList = await logicalTerminationPoint.getClientLtpListAsync(httpClientUuid);
                if (operationClientUuidList) {
                    let operationServerUuid = await operationServerInterface.getOperationServerUuidAsync(subscriptionOperation);
                    if (operationServerUuid) {
                        let forwardingConstructManagementList = await forwardingDomain.getForwardingConstructListForTheFcPortAsync(operationServerUuid, FcPort.portDirectionEnum.MANAGEMENT);
                        if (forwardingConstructManagementList) {
                            for (let i = 0; i < forwardingConstructManagementList.length; i++) {
                                let forwardingConstruct = forwardingConstructManagementList[i];
                                let forwardingName = getValueFromKey(forwardingConstruct["name"],"ForwardingName");
                                let fcPortList = forwardingConstruct["fc-port"];
                                for (let j = 0; j < fcPortList.length; j++) {
                                    let fcPort = fcPortList[j];
                                    let fcPortDirection = fcPort["port-direction"];
                                    if (fcPortDirection == FcPort.portDirectionEnum.OUTPUT) {
                                        let fcPortLtp = fcPort["logical-termination-point"];
                                        if (operationClientUuidList.includes(fcPortLtp)) {
                                            let forwardingConfigurationInput = new forwardingConstructConfigurationInput(
                                                forwardingName,
                                                fcPortLtp
                                            );
                                            forwardingConfigurationInputList.push(
                                                forwardingConfigurationInput
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }            
            resolve(forwardingConfigurationInputList);
        } catch (error) {
            reject(error);
        }
    });
}


exports.redirectOamRequestInformation = function (operationClientConfigurationStatusList, oamLogOperation) {
    return new Promise(async function (resolve, reject) {
        let forwardingConfigurationInputList = [];
        try {
            for (let i = 0; i < operationClientConfigurationStatusList.length; i++) {
                let configurationStatus = operationClientConfigurationStatusList[i];
                let operationClientUuid = configurationStatus.uuid;
                let operationClientName = await operationClientInterface.
                getOperationNameAsync(operationClientUuid);
                let forwardingConfigurationInput;
                let forwardingName;
                if (operationClientName == oamLogOperation) {
                    forwardingName =
                        "OamRequestCausesLoggingRequest";
                    forwardingConfigurationInput = new forwardingConstructConfigurationInput(
                        forwardingName,
                        operationClientUuid
                    );
                }
                forwardingConfigurationInputList.push(
                    forwardingConfigurationInput
                );
            }
            resolve(forwardingConfigurationInputList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.redirectServiceRequestInformation = function (operationClientConfigurationStatusList, serviceLogOperation) {
    return new Promise(async function (resolve, reject) {
        let forwardingConfigurationInputList = [];
        try {
            for (let i = 0; i < operationClientConfigurationStatusList.length; i++) {
                let configurationStatus = operationClientConfigurationStatusList[i];
                let operationClientUuid = configurationStatus.uuid;
                let operationClientName = await operationClientInterface.
                getOperationNameAsync(operationClientUuid);
                let forwardingConfigurationInput;
                let forwardingName;
                if (operationClientName == serviceLogOperation) {
                    forwardingName =
                        "ServiceRequestCausesLoggingRequest";
                    forwardingConfigurationInput = new forwardingConstructConfigurationInput(
                        forwardingName,
                        operationClientUuid
                    );
                }
                forwardingConfigurationInputList.push(
                    forwardingConfigurationInput
                );
            }
            resolve(forwardingConfigurationInputList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.redirectTopologyChangeInformation = function (operationClientConfigurationStatusList,
    applicationUpdateTopologyOperation,
    ltpUpdateTopologyOperation,
    ltpDeletionTopologyOperation,
    fcUpdateTopologyOperation,
    fcPortUpdateTopologyOperation,
    fcPortDeletionTopologyOperation) {
    return new Promise(async function (resolve, reject) {
        let forwardingConfigurationInputList = [];
        try {
            for (let i = 0; i < operationClientConfigurationStatusList.length; i++) {
                let configurationStatus = operationClientConfigurationStatusList[i];
                let operationClientUuid = configurationStatus.uuid;
                let operationClientName = await operationClientInterface.
                getOperationNameAsync(operationClientUuid);
                let forwardingConfigurationInput;
                let forwardingName;
                if (operationClientName == applicationUpdateTopologyOperation) {
                    forwardingName =
                        "PromptForRedirectingTopologyInformationCausesSendingAnInitialStateToALT";
                    forwardingConfigurationInput = new forwardingConstructConfigurationInput(
                        forwardingName,
                        operationClientUuid
                    );
                } else if (operationClientName == ltpUpdateTopologyOperation) {
                    forwardingName =
                        "ServiceRequestCausesLtpUpdateRequest";
                    forwardingConfigurationInput = new forwardingConstructConfigurationInput(
                        forwardingName,
                        operationClientUuid
                    );
                } else if (operationClientName == ltpDeletionTopologyOperation) {
                    forwardingName =
                        "ServiceRequestCausesLtpDeletionRequest";
                    forwardingConfigurationInput = new forwardingConstructConfigurationInput(
                        forwardingName,
                        operationClientUuid
                    );
                } else if (operationClientName == fcUpdateTopologyOperation) {
                    forwardingName =
                        "ServiceRequestCausesFcUpdateRequest";
                    forwardingConfigurationInput = new forwardingConstructConfigurationInput(
                        forwardingName,
                        operationClientUuid
                    );
                } else if (operationClientName == fcPortUpdateTopologyOperation) {
                    forwardingName =
                        "ServiceRequestCausesFcPortUpdateRequest";
                    forwardingConfigurationInput = new forwardingConstructConfigurationInput(
                        forwardingName,
                        operationClientUuid
                    );
                } else if (operationClientName == fcPortDeletionTopologyOperation) {
                    forwardingName =
                        "ServiceRequestCausesFcPortDeletionRequest";
                    forwardingConfigurationInput = new forwardingConstructConfigurationInput(
                        forwardingName,
                        operationClientUuid
                    );
                }
                forwardingConfigurationInputList.push(
                    forwardingConfigurationInput
                );
            }
            resolve(forwardingConfigurationInputList);
        } catch (error) {
            reject(error);
        }
    });
}


 function getValueFromKey(nameList, key) {
    for (let i = 0; i < nameList.length; i++) {
        let valueName = nameList[i]["value-name"];
        if (valueName == key) {
            return nameList[i]["value"];
        }
    }
    return undefined;
}