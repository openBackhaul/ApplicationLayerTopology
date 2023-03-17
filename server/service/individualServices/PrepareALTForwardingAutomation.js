const forwardingConstructAutomationInput = require('onf-core-model-ap/applicationPattern/onfModel/services/models/forwardingConstruct/AutomationInput');
const onfFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');
const controlConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ControlConstruct');
const forwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const forwardingConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingConstruct');

exports.getALTForwardingAutomationInputAsync = function (logicalTerminationPointconfigurationStatus, forwardingConstructConfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {
            /***********************************************************************************
             * logical-termination-point related forwarding automation
             ************************************************************************************/
            let ltpforwardingConstructAutomationInputList = await getLTPForwardingAutomationInputListAsync(
                logicalTerminationPointconfigurationStatus
            );
            if (ltpforwardingConstructAutomationInputList) {
                for (let i = 0; i < ltpforwardingConstructAutomationInputList.length; i++) {
                    let ltpforwardingConstructAutomationInput = ltpforwardingConstructAutomationInputList[i];
                    forwardingConstructAutomationList.push(ltpforwardingConstructAutomationInput);
                }
            }

            /***********************************************************************************
             * forwarding-construct updation related forwarding automation
             ************************************************************************************/
            let fdforwardingConstructAutomationInputList = await getFDForwardingAutomationInputListAsync(
                forwardingConstructConfigurationStatus
            );
            if (fdforwardingConstructAutomationInputList) {
                for (let i = 0; i < fdforwardingConstructAutomationInputList.length; i++) {
                    let fdforwardingConstructAutomationInput = fdforwardingConstructAutomationInputList[i];
                    forwardingConstructAutomationList.push(fdforwardingConstructAutomationInput);
                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.getALTUnConfigureForwardingAutomationInputAsync = function (logicalTerminationPointconfigurationStatus, forwardingConstructConfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {

            /***********************************************************************************
             * forwarding-construct updation related forwarding automation
             ************************************************************************************/
            let fdforwardingConstructAutomationInputList = await getFDUnconfigureForwardingAutomationInputListAsync(
                forwardingConstructConfigurationStatus
            );
            if (fdforwardingConstructAutomationInputList) {
                for (let i = 0; i < fdforwardingConstructAutomationInputList.length; i++) {
                    let fdforwardingConstructAutomationInput = fdforwardingConstructAutomationInputList[i];
                    forwardingConstructAutomationList.push(fdforwardingConstructAutomationInput);
                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

function getLTPForwardingAutomationInputListAsync(logicalTerminationPointconfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {
            /***********************************************************************************
             * ServiceRequestCausesLtpUpdateRequest update-ltp
             ************************************************************************************/
            if (logicalTerminationPointconfigurationStatus) {
                if (logicalTerminationPointconfigurationStatus.hasOwnProperty('httpClientConfigurationStatus')) {
                    let httpClientConfigurationStatus = logicalTerminationPointconfigurationStatus.httpClientConfigurationStatus;
                    let tcpClientConfigurationStatus = logicalTerminationPointconfigurationStatus.tcpClientConfigurationStatus;
                    let operationClientConfigurationStatusList = logicalTerminationPointconfigurationStatus.operationClientConfigurationStatusList;

                    let httpClientForwardingAutomation = await getHttpClientForwardingAutomationInputAsync(httpClientConfigurationStatus);
                    let tcpClientForwardingAutomation = await getTcpClientForwardingAutomationInputAsync(tcpClientConfigurationStatus);
                    let operationClientForwardingAutomationList = await getOperationClientForwardingAutomationInputListAsync(operationClientConfigurationStatusList);

                    if (httpClientForwardingAutomation) {
                        forwardingConstructAutomationList.push(httpClientForwardingAutomation);
                    }
                    if (tcpClientForwardingAutomation) {
                        forwardingConstructAutomationList.push(tcpClientForwardingAutomation);
                    }

                    for (let i = 0; i < operationClientForwardingAutomationList.length; i++) {
                        let operationClientForwardingAutomation = operationClientForwardingAutomationList[i];
                        forwardingConstructAutomationList.push(operationClientForwardingAutomation);
                    }
                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

function getFDForwardingAutomationInputListAsync(forwardingConstructConfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {
            /***********************************************************************************
             * ServiceRequestCausesFcUpdateRequest /v1/update-fc
             ************************************************************************************/
            if (forwardingConstructConfigurationStatus) {
                if (forwardingConstructConfigurationStatus.hasOwnProperty('forwardingConstructConfigurationStatusList')) {
                    let fcConfigurationStatusList = forwardingConstructConfigurationStatus.forwardingConstructConfigurationStatusList;
                    let fcforwardingConstructAutomationInputList = await getFCForwardingAutomationInputList(fcConfigurationStatusList);

                    if (fcforwardingConstructAutomationInputList) {
                        for (let i = 0; i < fcforwardingConstructAutomationInputList.length; i++) {
                            let fcforwardingConstructAutomationInput = fcforwardingConstructAutomationInputList[i];
                            forwardingConstructAutomationList.push(fcforwardingConstructAutomationInput);
                        }
                    }
                    /***********************************************************************************
                     * ServiceRequestCausesFcPortUpdateRequest /v1/update-fc-port
                     ************************************************************************************/

                    let fcPortConfigurationStatusList = forwardingConstructConfigurationStatus.fcPortConfigurationStatusList;

                    let fcPortforwardingConstructAutomationInputList = await getFCPortForwardingAutomationInputList(fcPortConfigurationStatusList);

                    if (fcPortforwardingConstructAutomationInputList) {
                        for (let i = 0; i < fcPortforwardingConstructAutomationInputList.length; i++) {
                            let fcPortforwardingConstructAutomationInput = fcPortforwardingConstructAutomationInputList[i];
                            forwardingConstructAutomationList.push(fcPortforwardingConstructAutomationInput);
                        }
                    }

                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

function getFDUnconfigureForwardingAutomationInputListAsync(forwardingConstructConfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {
            if (forwardingConstructConfigurationStatus) {
                if (forwardingConstructConfigurationStatus.hasOwnProperty('forwardingConstructConfigurationStatusList')) {

                    /***********************************************************************************
                     * ServiceRequestCausesFcPortUpdateRequest /v1/delete-fc-port
                     ************************************************************************************/

                    let fcPortConfigurationStatusList = forwardingConstructConfigurationStatus.fcPortConfigurationStatusList;

                    let fcPortforwardingConstructAutomationInputList = await getFCPortDeleteForwardingAutomationInputList(fcPortConfigurationStatusList);

                    if (fcPortforwardingConstructAutomationInputList) {
                        for (let i = 0; i < fcPortforwardingConstructAutomationInputList.length; i++) {
                            let fcPortforwardingConstructAutomationInput = fcPortforwardingConstructAutomationInputList[i];
                            forwardingConstructAutomationList.push(fcPortforwardingConstructAutomationInput);
                        }
                    }

                }
            }

            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

function getHttpClientForwardingAutomationInputAsync(httpClientConfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        try {
            let forwardingAutomation;
            let serviceRequestCausesLtpUpdateRequestForwardingName = "ServiceRequestCausesLtpUpdateRequest";
            let serviceRequestCausesLtpUpdateRequestContext;
            let serviceRequestCausesLtpUpdateRequestRequestBody;

            if (httpClientConfigurationStatus) {
                if (httpClientConfigurationStatus.updated) {
                    let httpClientUuid = httpClientConfigurationStatus.uuid;
                    serviceRequestCausesLtpUpdateRequestRequestBody = await controlConstruct.getLogicalTerminationPointAsync(
                        httpClientUuid);
                    forwardingAutomation = new forwardingConstructAutomationInput(
                        serviceRequestCausesLtpUpdateRequestForwardingName,
                        serviceRequestCausesLtpUpdateRequestRequestBody,
                        serviceRequestCausesLtpUpdateRequestContext
                    );
                }
            }
            resolve(forwardingAutomation);
        } catch (error) {
            reject(error);
        }
    });
}

function getTcpClientForwardingAutomationInputAsync(tcpClientConfigurationStatus) {
    return new Promise(async function (resolve, reject) {
        try {
            let forwardingAutomation;
            let serviceRequestCausesLtpUpdateRequestForwardingName = "ServiceRequestCausesLtpUpdateRequest";
            let serviceRequestCausesLtpUpdateRequestContext;
            let serviceRequestCausesLtpUpdateRequestRequestBody;

            if (tcpClientConfigurationStatus) {
                if (tcpClientConfigurationStatus.updated) {
                    let tcpClientUuid = tcpClientConfigurationStatus.uuid;
                    serviceRequestCausesLtpUpdateRequestRequestBody = await controlConstruct.getLogicalTerminationPointAsync(
                        tcpClientUuid);
                    forwardingAutomation = new forwardingConstructAutomationInput(
                        serviceRequestCausesLtpUpdateRequestForwardingName,
                        serviceRequestCausesLtpUpdateRequestRequestBody,
                        serviceRequestCausesLtpUpdateRequestContext
                    );
                }
            }
            resolve(forwardingAutomation);
        } catch (error) {
            reject(error);
        }
    });
}

function getOperationClientForwardingAutomationInputListAsync(operationClientConfigurationStatusList) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {
            let forwardingAutomation;
            let serviceRequestCausesLtpUpdateRequestForwardingName = "ServiceRequestCausesLtpUpdateRequest";
            let serviceRequestCausesLtpUpdateRequestContext;
            let serviceRequestCausesLtpUpdateRequestRequestBody;

            if (operationClientConfigurationStatusList) {
                for (let i = 0; i < operationClientConfigurationStatusList.length; i++) {
                    let operationClientConfigurationStatus = operationClientConfigurationStatusList[i];
                    if (operationClientConfigurationStatus.updated) {
                        let operationClientUuid = operationClientConfigurationStatus.uuid;
                        serviceRequestCausesLtpUpdateRequestRequestBody = await controlConstruct.getLogicalTerminationPointAsync(
                            operationClientUuid);
                        serviceRequestCausesLtpUpdateRequestRequestBody = removeAttribute(
                            serviceRequestCausesLtpUpdateRequestRequestBody,
                            "operation-key");
                        forwardingAutomation = new forwardingConstructAutomationInput(
                            serviceRequestCausesLtpUpdateRequestForwardingName,
                            serviceRequestCausesLtpUpdateRequestRequestBody,
                            serviceRequestCausesLtpUpdateRequestContext
                        );
                        forwardingConstructAutomationList.push(forwardingAutomation);
                    }
                }
            }
            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

function getFCForwardingAutomationInputList(fcConfigurationStatusList) {
    return new Promise(async function (resolve, reject) {
        let serviceRequestCausesFcUpdateRequestForwardingName = "ServiceRequestCausesFcUpdateRequest";
        let serviceRequestCausesFcUpdateRequestContext;
        let serviceRequestCausesFcUpdateRequestRequestBody;
        let forwardingConstructAutomationList = [];
        try {
            if (fcConfigurationStatusList) {
                for (let i = 0; i < fcConfigurationStatusList.length; i++) {
                    let fcConfigurationStatus = fcConfigurationStatusList[i];
                    if (fcConfigurationStatus.updated) {
                        let forwardingConstructUuid = fcConfigurationStatus.uuid;
                        serviceRequestCausesFcUpdateRequestRequestBody = await forwardingDomain.getForwardingConstructAsync(
                            forwardingConstructUuid);
                        forwardingAutomation = new forwardingConstructAutomationInput(
                            serviceRequestCausesFcUpdateRequestForwardingName,
                            serviceRequestCausesFcUpdateRequestRequestBody,
                            serviceRequestCausesFcUpdateRequestContext
                        );
                        forwardingConstructAutomationList.push(forwardingAutomation);
                    }
                }
            }
            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

function getFCPortForwardingAutomationInputList(fcPortConfigurationStatusList) {
    return new Promise(async function (resolve, reject) {
        let serviceRequestCausesFcPortUpdateRequestForwardingName = "ServiceRequestCausesFcPortUpdateRequest";
        let serviceRequestCausesFcPortUpdateRequestContext;
        let serviceRequestCausesFcPortUpdateRequestRequestBody = {};
        let forwardingConstructAutomationList = [];

        try {
            if (fcPortConfigurationStatusList) {
                for (let i = 0; i < fcPortConfigurationStatusList.length; i++) {
                    let fcPortConfigurationStatus = fcPortConfigurationStatusList[i];
                    if (fcPortConfigurationStatus.updated) {
                        let forwardingConstructUuid = fcPortConfigurationStatus.uuid;
                        let fcPortlocalId = fcPortConfigurationStatus.localId;
                        serviceRequestCausesFcPortUpdateRequestRequestBody.fcUuid = forwardingConstructUuid;
                        serviceRequestCausesFcPortUpdateRequestRequestBody.fcPort = await forwardingConstruct.getFcPortAsync(
                            forwardingConstructUuid,
                            fcPortlocalId
                        );
                        serviceRequestCausesFcPortUpdateRequestRequestBody = onfFormatter.modifyJsonObjectKeysToKebabCase(serviceRequestCausesFcPortUpdateRequestRequestBody);
                        forwardingAutomation = new forwardingConstructAutomationInput(
                            serviceRequestCausesFcPortUpdateRequestForwardingName,
                            serviceRequestCausesFcPortUpdateRequestRequestBody,
                            serviceRequestCausesFcPortUpdateRequestContext
                        );
                        forwardingConstructAutomationList.push(forwardingAutomation);
                    }
                }
            }
            resolve(forwardingConstructAutomationList);
        } catch (error) {
            reject(error);
        }
    });
}

function getFCPortDeleteForwardingAutomationInputList(fcPortConfigurationStatusList) {
    return new Promise(async function (resolve, reject) {
        let serviceRequestCausesFcPortDeleteRequestForwardingName = "ServiceRequestCausesFcPortDeletionRequest";
        let serviceRequestCausesFcPortDeleteRequestRequestBody = {};
        let serviceRequestCausesFcPortDeleteRequestContext;
        let forwardingConstructAutomationList = [];

        try {
            if (fcPortConfigurationStatusList) {
                for (let i = 0; i < fcPortConfigurationStatusList.length; i++) {
                    let fcPortConfigurationStatus = fcPortConfigurationStatusList[i];
                    if (fcPortConfigurationStatus.updated) {
                        let forwardingConstructUuid = fcPortConfigurationStatus.uuid;
                        let fcPortlocalId = fcPortConfigurationStatus.localId;
                        serviceRequestCausesFcPortDeleteRequestRequestBody.fcUuid = forwardingConstructUuid;
                        serviceRequestCausesFcPortDeleteRequestRequestBody.fcPortLocalId = fcPortlocalId;
                        serviceRequestCausesFcPortDeleteRequestRequestBody = onfFormatter.modifyJsonObjectKeysToKebabCase(
                            serviceRequestCausesFcPortDeleteRequestRequestBody
                        );
                        forwardingAutomation = new forwardingConstructAutomationInput(
                            serviceRequestCausesFcPortDeleteRequestForwardingName,
                            serviceRequestCausesFcPortDeleteRequestRequestBody,
                            serviceRequestCausesFcPortDeleteRequestContext
                        );
                        forwardingConstructAutomationList.push(forwardingAutomation);
                    }
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