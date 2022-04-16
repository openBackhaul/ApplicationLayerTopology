/**
 * @file This module provides functionality to migrate the data from the current version to the next version. 
 * @module SoftwareUpgrade
 **/

const operationClientInterface = require('../../applicationPattern/onfModel/models/layerProtocols/OperationClientInterface');
const logicalTerminationPoint = require('../../applicationPattern/onfModel/models/LogicalTerminationPoint');
const httpServerInterface = require('../../applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const httpClientInterface = require('../../applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');
const tcpClientInterface = require('../../applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const ForwardingDomain = require('../../applicationPattern/onfModel/models/ForwardingDomain');
const onfAttributes = require('../../applicationPattern/onfModel/constants/OnfAttributes');
const FcPort = require('../../applicationPattern/onfModel/models/FcPort');
const onfAttributeFormatter = require('../../applicationPattern/onfModel/utility/OnfAttributeFormatter');

const eventDispatcher = require('../../applicationPattern/rest/client/eventDispatcher');
const OperationClientInterface = require('../../applicationPattern/onfModel/models/layerProtocols/OperationClientInterface');
const LayerProtocol = require('../../applicationPattern/onfModel/models/LayerProtocol');
const OperationServerInterface = require('../../applicationPattern/onfModel/models/layerProtocols/OperationServerInterface');
const NetworkControlDomain = require('../../applicationPattern/onfModel/models/NetworkControlDomain');
const ControlConstruct = require('../../applicationPattern/onfModel/models/ControlConstruct');
const LinkPort = require('../../applicationPattern/onfModel/models/LinkPort');

/**
 * This method performs the set of procedure to transfer the data from this version to next version 
 * of the application and bring the new release official
 * @param {boolean} isdataTransferRequired represents true if data transfer is required
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * **/
exports.upgradeSoftwareVersion = async function (isdataTransferRequired, user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            if (isdataTransferRequired) {
                await transferDataToTheNewRelease(user, xCorrelator, traceIndicator, customerJourney);
            }
            await redirectNotificationNewRelease(user, xCorrelator, traceIndicator, customerJourney);
            await replaceOldReleaseWithNewRelease(user, xCorrelator, traceIndicator, customerJourney);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * This method performs the data transfer from the current instance to the new instance
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * The following are the list of forwarding-construct that will be automated to transfer the data from this current release to next release
 * 1. PromptForBequeathingDataCausesTransferOfListOfApplications
 * 2. PromptForBequeathingDataCausesTransferOfLtpsAndFcs
 * 3. PromptForBequeathingDataCausesTransferOfLinkInformation
 */
async function transferDataToTheNewRelease(user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            await PromptForBequeathingDataCausesTransferOfListOfApplications(user, xCorrelator, traceIndicator, customerJourney);
            await PromptForBequeathingDataCausesTransferOfLtpsAndFcs(user, xCorrelator, traceIndicator, customerJourney);
            await PromptForBequeathingDataCausesTransferOfLinkInformation(user, xCorrelator, traceIndicator, customerJourney);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * This method performs the set of procedure to redirect the notification to the new release
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * The following are the list of forwarding-construct that will be automated to redirect the notification 
 * to the new release and to end the existing subscription
 * 1. PromptForBequeathingDataCausesRObeingRequestedToNotifyApprovalsOfNewApplicationsToNewRelease
 * 2. PromptForBequeathingDataCausesRObeingRequestedToNotifyWithdrawnApprovalsToNewRelease
 * 3. PromptForBequeathingDataCausesRObeingRequestedToStopNotificationsToOldRelease
 */
async function redirectNotificationNewRelease(user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            await PromptForBequeathingDataCausesRObeingRequestedToNotifyApprovalsOfNewApplicationsToNewRelease(user, xCorrelator, traceIndicator, customerJourney);
            await PromptForBequeathingDataCausesRObeingRequestedToNotifyWithdrawnApprovalsToNewRelease(user, xCorrelator, traceIndicator, customerJourney);
            await PromptForBequeathingDataCausesRObeingRequestedToStopNotificationsToOldRelease(user, xCorrelator, traceIndicator, customerJourney);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * This method performs the set of procedure to replace the old release with the new release
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * The following are the list of forwarding-construct that will be automated to replace the old release with the new release
 * 1. PromptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement
 * 2. PromptForBequeathingDataCausesRequestForDeregisteringOfOldRelease
 */
async function replaceOldReleaseWithNewRelease(user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            await promptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement(user, xCorrelator, traceIndicator, customerJourney);
            await promptForBequeathingDataCausesRequestForDeregisteringOfOldRelease(user, xCorrelator, traceIndicator, customerJourney);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Prepare attributes and automate PromptForBequeathingDataCausesNewApplicationBeingRequestedToInquireForApplicationTypeApprovals<br>
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * @returns {boolean} return true if the operation is success or else return false
 */
async function PromptForBequeathingDataCausesTransferOfListOfApplications(user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let result = true;
            let forwardingKindNameOfTheBequeathOperation = "PromptForBequeathingDataCausesTransferOfListOfApplications";

            /***********************************************************************************
             * Preparing requestBody and transfering the data one by one
             ************************************************************************************/

            let inquiryForApplicationTypeApprovalFCName = "NewApplicationCausesRequestForLatestTopologyInformation";
            let forwardingConstructInstance = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(inquiryForApplicationTypeApprovalFCName);
            let operationClientUuidList = getFcPortOutputLogicalTerminationPointList(forwardingConstructInstance);

            for (let i = 0; i < operationClientUuidList.length; i++) {
                try {
                    let operationClientUuid = operationClientUuidList[i];
                    let httpClientUuid = (await logicalTerminationPoint.getServerLtpListAsync(operationClientUuid))[0];
                    let tcpClientUuid = (await logicalTerminationPoint.getServerLtpListAsync(httpClientUuid))[0];

                    let applicationName = await httpClientInterface.getApplicationNameAsync(httpClientUuid);
                    let releaseNumber = await httpClientInterface.getReleaseNumberAsync(httpClientUuid);
                    let applicationAddress = await tcpClientInterface.getRemoteAddressAsync(tcpClientUuid);
                    let applicationPort = await tcpClientInterface.getRemotePortAsync(tcpClientUuid);

                    /***********************************************************************************
                     * PromptForBequeathingDataCausesTransferOfListOfApplications
                     *   /v1/regard-application
                     ************************************************************************************/
                    let requestBody = {};
                    requestBody.applicationName = applicationName;
                    requestBody.applicationReleaseNumber = releaseNumber;
                    requestBody.applicationAddress = applicationAddress;
                    requestBody.applicationPort = applicationPort;
                    requestBody = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(requestBody);
                    result = await forwardRequest(
                        forwardingKindNameOfTheBequeathOperation,
                        requestBody,
                        user,
                        xCorrelator,
                        traceIndicator,
                        customerJourney
                    );
                    if (!result) {
                        throw forwardingKindNameOfTheBequeathOperation + "forwarding is not success for the input" + requestBody;
                    }

                } catch (error) {
                    console.log(error);
                    throw "operation is not success";
                }
            }
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Prepare attributes and automate PromptForBequeathingDataCausesNewApplicationBeingRequestedToDocumentSubscriptionsForDeregistrationNotifications<br>
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * @returns {boolean} return true if the operation is success or else return false
 */
async function PromptForBequeathingDataCausesTransferOfLtpsAndFcs(user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let result = true;
            let forwardingKindNameOfTheBequeathOperation = "PromptForBequeathingDataCausesTransferOfLtpsAndFcs";

            /***********************************************************************************
             * Preparing requestBody and transfering the data one by one
             ************************************************************************************/

            let controlConstructList = await NetworkControlDomain.getControlConstructListAsync();
            let currentControlConstructUuid = await ControlConstruct.getUuidAsync();

            for (let i = 0; i < controlConstructList.length; i++) {
                try {
                    let controlConstruct = controlConstructList[i];
                    let controlConstructUuid = controlConstruct[onfAttributes.GLOBAL_CLASS.UUID];
                    if (currentControlConstructUuid != controlConstructUuid) {
                        /***********************************************************************************
                         * PromptForBequeathingDataCausesTransferOfLtpsAndFcs
                         *   /v1/update-all-ltps-and-fcs
                         ************************************************************************************/
                        let requestBody = {};
                        requestBody["core-model-1-4:control-construct"] = controlConstruct;
                        result = await forwardRequest(
                            forwardingKindNameOfTheBequeathOperation,
                            requestBody,
                            user,
                            xCorrelator,
                            traceIndicator,
                            customerJourney
                        );
                        if (!result) {
                            throw forwardingKindNameOfTheBequeathOperation + "forwarding is not success for the input" + controlConstruct;
                        }
                    }
                } catch (error) {
                    console.log(error);
                    throw "operation is not success";
                }
            }
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}


/**
 * Prepare attributes and automate PromptForBequeathingDataCausesNewApplicationBeingRequestedToDocumentSubscriptionsForApprovalNotifications<br>
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * @returns {boolean} return true if the operation is success or else return false
 */
async function PromptForBequeathingDataCausesTransferOfLinkInformation(user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let result = true;
            let forwardingKindNameOfTheBequeathOperation = "PromptForBequeathingDataCausesTransferOfLinkInformation";

            /***********************************************************************************
             * Preparing requestBody and transfering the data one by one
             ************************************************************************************/
            let linkList = await NetworkControlDomain.getLinkListAsync();

            for (let i = 0; i < linkList.length; i++) {
                try {
                    let link = linkList[i];
                    let outputLinkPort = getOutputLinkPort(link);
                    let servingApplicationOperationServerUuid = outputLinkPort[onfAttributes.LINK.LOGICAL_TERMINATION_POINT];
                    let servingApplicationControlConstructUuid = figureOutControlConstructUuid(
                        servingApplicationOperationServerUuid);
                    let servingApplicationControlConstruct = await NetworkControlDomain.getControlConstructAsync(
                        servingApplicationControlConstructUuid);
                    let servingApplicationName = getApplicationName(servingApplicationControlConstruct);
                    let servingApplicationReleaseNumber = getReleaseNumber(servingApplicationControlConstruct);
                    let operationName = getOperationServerName(servingApplicationControlConstruct, servingApplicationOperationServerUuid);
                    let consumingApplicationName;
                    let consumingApplicationReleaseNumber;

                    let inputLinkPortList = getInputLinkPortList(link);
                    for (let j = 0; j < inputLinkPortList.length; j++) {
                        let inputLinkPort = inputLinkPortList[j];
                        let servingApplicationOperationClientUuid = inputLinkPort[onfAttributes.LINK.LOGICAL_TERMINATION_POINT];
                        let consumingApplicationControlConstructUuid = figureOutControlConstructUuid(
                            servingApplicationOperationClientUuid);
                        let cosumingApplicationControlConstruct = await NetworkControlDomain.getControlConstructAsync(
                            consumingApplicationControlConstructUuid);
                        consumingApplicationName = getApplicationName(cosumingApplicationControlConstruct);
                        consumingApplicationReleaseNumber = getReleaseNumber(cosumingApplicationControlConstruct);

                        /***********************************************************************************
                         * PromptForBequeathingDataCausesTransferOfLinkInformation
                         *   /v1/add-operation-client-to-link
                         ************************************************************************************/
                        let requestBody = {};
                        requestBody.servingApplicationName = servingApplicationName;
                        requestBody.servingApplicationReleaseNumber = servingApplicationReleaseNumber;
                        requestBody.operationName = operationName;
                        requestBody.consumingApplicationName = consumingApplicationName;
                        requestBody.consumingApplicationReleaseNumber = consumingApplicationReleaseNumber;
                        requestBody = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(requestBody);
                        result = await forwardRequest(
                            forwardingKindNameOfTheBequeathOperation,
                            requestBody,
                            user,
                            xCorrelator,
                            traceIndicator,
                            customerJourney
                        );
                        if (!result) {
                            throw forwardingKindNameOfTheBequeathOperation + "forwarding is not success for the input" + requestBody;
                        }
                    }
                } catch (error) {
                    console.log(error);
                    throw "operation is not success";
                }
            }
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Prepare attributes and automate PromptForBequeathingDataCausesTARbeingRequestedToRedirectInfoAboutApprovalsToNewApplication<br>
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * @returns {boolean} return true if the operation is success or else return false
 */
async function PromptForBequeathingDataCausesRObeingRequestedToNotifyApprovalsOfNewApplicationsToNewRelease(user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let result = true;
            let forwardingKindNameOfTheBequeathOperation = "PromptForBequeathingDataCausesRObeingRequestedToNotifyApprovalsOfNewApplicationsToNewRelease";

            /***********************************************************************************
             * Preparing requestBody 
             ************************************************************************************/
            try {

                let newReleaseHttpClientUuid = await httpClientInterface.getHttpClientUuidAsync("NewRelease");
                let newReleaseTcpClientUuid = (await logicalTerminationPoint.getServerLtpListAsync(newReleaseHttpClientUuid))[0];

                let applicationName = await httpServerInterface.getApplicationNameAsync();
                let releaseNumber = await httpClientInterface.getReleaseNumberAsync(newReleaseHttpClientUuid);
                let regardApplicationOperation = await OperationServerInterface.getOperationNameAsync("alt-0-0-1-op-s-3001");
                let applicationAddress = await tcpClientInterface.getRemoteAddressAsync(newReleaseTcpClientUuid);
                let applicationPort = await tcpClientInterface.getRemotePortAsync(newReleaseTcpClientUuid);

                /***********************************************************************************
                 * PromptForBequeathingDataCausesRObeingRequestedToNotifyApprovalsOfNewApplicationsToNewRelease
                 *   /v1/notify-approvals
                 ************************************************************************************/
                let requestBody = {};
                requestBody.subscriberApplication = applicationName;
                requestBody.subscriberReleaseNumber = releaseNumber;
                requestBody.subscriberOperation = regardApplicationOperation;
                requestBody.subscriberAddress = applicationAddress;
                requestBody.subscriberPort = applicationPort;
                requestBody = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(requestBody);
                result = await forwardRequest(
                    forwardingKindNameOfTheBequeathOperation,
                    requestBody,
                    user,
                    xCorrelator,
                    traceIndicator,
                    customerJourney
                );
                if (!result) {
                    throw forwardingKindNameOfTheBequeathOperation + "forwarding is not success for the input" + requestBody;
                }

            } catch (error) {
                console.log(error);
                throw "operation is not success";
            }

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Prepare attributes and automate PromptForBequeathingDataCausesTARbeingRequestedToRedirectInfoAboutApprovalsToNewApplication<br>
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * @returns {boolean} return true if the operation is success or else return false
 */
async function PromptForBequeathingDataCausesRObeingRequestedToNotifyWithdrawnApprovalsToNewRelease(user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let result = true;
            let forwardingKindNameOfTheBequeathOperation = "PromptForBequeathingDataCausesRObeingRequestedToNotifyWithdrawnApprovalsToNewRelease";

            /***********************************************************************************
             * Preparing requestBody 
             ************************************************************************************/
            try {

                let newReleaseHttpClientUuid = await httpClientInterface.getHttpClientUuidAsync("NewRelease");
                let newReleaseTcpClientUuid = (await logicalTerminationPoint.getServerLtpListAsync(newReleaseHttpClientUuid))[0];

                let applicationName = await httpServerInterface.getApplicationNameAsync();
                let releaseNumber = await httpClientInterface.getReleaseNumberAsync(newReleaseHttpClientUuid);
                let disregardApplicationOperation = await OperationServerInterface.getOperationNameAsync("alt-0-0-1-op-s-3002");
                let applicationAddress = await tcpClientInterface.getRemoteAddressAsync(newReleaseTcpClientUuid);
                let applicationPort = await tcpClientInterface.getRemotePortAsync(newReleaseTcpClientUuid);

                /***********************************************************************************
                 * PromptForBequeathingDataCausesRObeingRequestedToNotifyWithdrawnApprovalsToNewRelease
                 *   /v1/notify-withdrawn-approvals
                 ************************************************************************************/
                let requestBody = {};
                requestBody.subscriberApplication = applicationName;
                requestBody.subscriberReleaseNumber = releaseNumber;
                requestBody.subscriberOperation = disregardApplicationOperation;
                requestBody.subscriberAddress = applicationAddress;
                requestBody.subscriberPort = applicationPort;
                requestBody = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(requestBody);
                result = await forwardRequest(
                    forwardingKindNameOfTheBequeathOperation,
                    requestBody,
                    user,
                    xCorrelator,
                    traceIndicator,
                    customerJourney
                );
                if (!result) {
                    throw forwardingKindNameOfTheBequeathOperation + "forwarding is not success for the input" + requestBody;
                }

            } catch (error) {
                console.log(error);
                throw "operation is not success";
            }

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Prepare attributes and automate PromptForBequeathingDataCausesTARbeingRequestedToRedirectInfoAboutApprovalsToNewApplication<br>
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * @returns {boolean} return true if the operation is success or else return false
 */
async function PromptForBequeathingDataCausesRObeingRequestedToStopNotificationsToOldRelease(user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let result = true;
            let forwardingKindNameOfTheBequeathOperation = "PromptForBequeathingDataCausesRObeingRequestedToStopNotificationsToOldRelease";

            let listOfOperationToBeUnsubscribed = [];
            let approvalOperationName = await operationClientInterface.getOperationNameAsync("alt-0-0-1-op-c-3020");
            let withdrawApprovalOperationName = await operationClientInterface.getOperationNameAsync("alt-0-0-1-op-c-3021");
            listOfOperationToBeUnsubscribed.push(approvalOperationName);
            listOfOperationToBeUnsubscribed.push(withdrawApprovalOperationName);
            /***********************************************************************************
             * Preparing requestBody 
             ************************************************************************************/
            try {
                for (let i = 0; i < listOfOperationToBeUnsubscribed.length; i++) {

                    let applicationName = await httpServerInterface.getApplicationNameAsync();
                    let releaseNumber = await httpServerInterface.getReleaseNumberAsync();
                    let subscriptionName = listOfOperationToBeUnsubscribed[i];

                    /***********************************************************************************
                     * PromptForBequeathingDataCausesRObeingRequestedToStopNotificationsToOldRelease
                     *   /v1/end-subscription
                     ************************************************************************************/
                    let requestBody = {};
                    requestBody.subscriberApplication = applicationName;
                    requestBody.subscriberReleaseNumber = releaseNumber;
                    requestBody.subscription = subscriptionName;
                    requestBody = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(requestBody);
                    result = await forwardRequest(
                        forwardingKindNameOfTheBequeathOperation,
                        requestBody,
                        user,
                        xCorrelator,
                        traceIndicator,
                        customerJourney
                    );
                    if (!result) {
                        throw forwardingKindNameOfTheBequeathOperation + "forwarding is not success for the input" + requestBody;
                    }
                }

            } catch (error) {
                console.log(error);
                throw "operation is not success";
            }

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Prepare attributes and automate PromptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement<br>
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * @returns {boolean} return true if the operation is success or else return false
 */
async function promptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement(user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let result = true;
            let forwardingKindNameOfTheBequeathOperation = "PromptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement";

            /***********************************************************************************
             * Preparing requestBody 
             ************************************************************************************/
            try {

                let newReleaseHttpClientUuid = await httpClientInterface.getHttpClientUuidAsync("NewRelease");
                let newReleaseTcpClientUuid = (await logicalTerminationPoint.getServerLtpListAsync(newReleaseHttpClientUuid))[0];

                let applicationName = await httpServerInterface.getApplicationNameAsync();
                let oldReleaseNumber = await httpServerInterface.getReleaseNumberAsync();
                let newReleaseNumber = await httpClientInterface.getReleaseNumberAsync(newReleaseHttpClientUuid);
                let applicationAddress = await tcpClientInterface.getRemoteAddressAsync(newReleaseTcpClientUuid);
                let applicationPort = await tcpClientInterface.getRemotePortAsync(newReleaseTcpClientUuid);

                /***********************************************************************************
                 * PromptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement
                 *   /v1/relay-server-replacement
                 ************************************************************************************/
                let requestBody = {};
                requestBody.applicationName = applicationName;
                requestBody.oldApplicationReleaseNumber = oldReleaseNumber;
                requestBody.newApplicationReleaseNumber = newReleaseNumber;
                requestBody.newApplicationAddress = applicationAddress;
                requestBody.newApplicationPort = applicationPort;
                requestBody = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(requestBody);
                result = await forwardRequest(
                    forwardingKindNameOfTheBequeathOperation,
                    requestBody,
                    user,
                    xCorrelator,
                    traceIndicator,
                    customerJourney
                );
                if (!result) {
                    throw forwardingKindNameOfTheBequeathOperation + "forwarding is not success for the input" + requestBody;
                }

            } catch (error) {
                console.log(error);
                throw "operation is not success";
            }

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Prepare attributes and automate PromptForBequeathingDataCausesRequestForDeregisteringOfOldRelease<br>
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * @returns {boolean} return true if the operation is success or else return false
 */
async function promptForBequeathingDataCausesRequestForDeregisteringOfOldRelease(user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let result = true;
            let forwardingKindNameOfTheBequeathOperation = "PromptForBequeathingDataCausesRequestForDeregisteringOfOldRelease";

            /***********************************************************************************
             * Preparing requestBody 
             ************************************************************************************/
            try {
                let newReleaseHttpClientUuid = await httpClientInterface.getHttpClientUuidAsync("NewRelease");
                let oldApplicationName = await httpServerInterface.getApplicationNameAsync();
                let oldReleaseNumber = await httpServerInterface.getReleaseNumberAsync();
                let newReleaseNumber = await httpClientInterface.getReleaseNumberAsync(newReleaseHttpClientUuid);
                if (oldReleaseNumber != newReleaseNumber) {
                    /***********************************************************************************
                     * PromptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement
                     *   /v1/relay-server-replacement
                     ************************************************************************************/
                    let requestBody = {};
                    requestBody.applicationName = oldApplicationName;
                    requestBody.applicationReleaseNumber = oldReleaseNumber;
                    requestBody = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(requestBody);
                    result = await forwardRequest(
                        forwardingKindNameOfTheBequeathOperation,
                        requestBody,
                        user,
                        xCorrelator,
                        traceIndicator,
                        customerJourney
                    );
                    if (!result) {
                        throw forwardingKindNameOfTheBequeathOperation + "forwarding is not success for the input" + requestBody;
                    }
                }
            } catch (error) {
                console.log(error);
                throw "operation is not success";
            }

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

/****************************************************************************************
 * Functions utilized by individual services
 ****************************************************************************************/
function getFcPortOutputLogicalTerminationPointList(forwardingConstructInstance) {
    try {
        let fcPortOutputLogicalTerminationPointList = [];
        let fcPortList = forwardingConstructInstance[
            onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
        for (let i = 0; i < fcPortList.length; i++) {
            let fcPort = fcPortList[i];
            let fcPortPortDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
            if (fcPortPortDirection == FcPort.portDirectionEnum.OUTPUT) {
                let fclogicalTerminationPoint = fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT];
                fcPortOutputLogicalTerminationPointList.push(fclogicalTerminationPoint);
            }
        }
        return fcPortOutputLogicalTerminationPointList;
    } catch (error) {
        throw error;
    }
}

/**
 * @description This function automates the forwarding construct by calling the appropriate call back operations based on the fcPort input and output directions.
 * @param {String} operationServerUuid operation server uuid of the request url
 * @param {list}   attributeList list of attributes required during forwarding construct automation(to send in the request body)
 * @param {String} user user who initiates this request
 * @param {string} originator originator of the request
 * @param {string} xCorrelator flow id of this request
 * @param {string} traceIndicator trace indicator of the request
 * @param {string} customerJourney customer journey of the request
 **/
function forwardRequest(forwardingKindName, attributeList, user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let forwardingConstructInstance = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingKindName);
            let operationClientUuid = (getFcPortOutputLogicalTerminationPointList(forwardingConstructInstance))[0];
            let operationKey = await OperationClientInterface.getOperationKeyAsync(
                operationClientUuid);
            let operationName = await OperationClientInterface.getOperationNameAsync(
                operationClientUuid);
            let remoteIpAndPort = await OperationClientInterface.getTcpIpAddressAndPortAsyncAsync(
                operationClientUuid);
            let result = await eventDispatcher.dispatchEvent(
                remoteIpAndPort,
                operationName,
                operationKey,
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


/**********************************************************************************************************
 * Generic functions used across 
 **********************************************************************************************************/

/**
 * This function provides the uuid of the control-construct based on the logical-termination-point (or) 
 * forwarding-domain (or) forwarding-construct uuid
 * @param {*} uuid 
 * @returns controlConstructUuid
 */
function figureOutControlConstructUuid(uuid) {
    let controlConstructUuid = uuid.split('-').slice(0, 4).join("-");
    return controlConstructUuid;
}

/***************************************************************************************************************
 * End point details
 **************************************************************************************************************/

/**
 * This function returns the list of clients information reacting on the operation server 
 * @param {*} controlConstruct 
 * @param {*} operationClientsUuidsReactingOnOperationServerList 
 * @returns object in the form of {addressedApplicationName:"name",
 * addressedApplicationReleaseNumber:"0.0.1" ,addressedOperationName:"/v1/service1"}
 */
function getApplicationName(controlConstruct) {
    let applicationName;
    try {
        let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
        for (let i = 0; i < logicalTerminationPointList.length; i++) {
            let logicalTerminationPoint = logicalTerminationPointList[i];
            let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
            let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
            if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.HTTP_SERVER) {
                let httpServerInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_SERVER_INTERFACE_PAC];
                let httpServerCapability = httpServerInterfacePac[onfAttributes.HTTP_SERVER.CAPABILITY];
                applicationName = httpServerCapability[onfAttributes.HTTP_SERVER.APPLICATION_NAME];
            }
        }
        return applicationName;
    } catch (error) {
        console.log(error)
    }
}

/**
 * This function returns the list of clients information reacting on the operation server 
 * @param {*} controlConstruct 
 * @param {*} operationClientsUuidsReactingOnOperationServerList 
 * @returns object in the form of {addressedApplicationName:"name",
 * addressedApplicationReleaseNumber:"0.0.1" ,addressedOperationName:"/v1/service1"}
 */
function getReleaseNumber(controlConstruct) {
    let releaseNumber;
    try {
        let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
        for (let i = 0; i < logicalTerminationPointList.length; i++) {
            let logicalTerminationPoint = logicalTerminationPointList[i];
            let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
            let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
            if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.HTTP_SERVER) {
                let httpServerInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_SERVER_INTERFACE_PAC];
                let httpServerCapability = httpServerInterfacePac[onfAttributes.HTTP_SERVER.CAPABILITY];
                releaseNumber = httpServerCapability[onfAttributes.HTTP_SERVER.RELEASE_NUMBER];
            }
        }
        return releaseNumber;
    } catch (error) {
        console.log(error)
    }
}

/**
 * Provides operationServerUuid for the operationServerName
 * @param {*} controlConstruct complete control-construct instance
 * @param {*} operationServerName operation name of the operation Server
 * @returns operationServeruuid
 */
function getOperationServerName(controlConstruct, operationServerUuid) {
    let operationServerName;
    try {
        let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
        for (let i = 0; i < logicalTerminationPointList.length; i++) {
            let logicalTerminationPoint = logicalTerminationPointList[i];
            let uuid = logicalTerminationPoint[onfAttributes.GLOBAL_CLASS.UUID];
            if (uuid == operationServerUuid) {
                let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
                let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
                if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.OPERATION_SERVER) {
                    let operationServerInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.OPERATION_SERVER_INTERFACE_PAC];
                    let operationServerCapability = operationServerInterfacePac[onfAttributes.OPERATION_SERVER.CAPABILITY];
                    operationServerName = operationServerCapability[onfAttributes.OPERATION_SERVER.OPERATION_NAME];
                }
            }
        }
        return operationServerName;
    } catch (error) {
        console.log(error)
    }
}


/***************************************************************************************************************
 * End point details
 **************************************************************************************************************/


/**
 * Provides output link port
 * @param {*} controlConstruct complete control-construct instance
 * @param {*} operationServerName operation name of the operation Server
 * @returns operationServeruuid
 */
function getOutputLinkPort(link) {
    let outputLinkPort;
    try {
        let linkPortList = link[onfAttributes.LINK.LINK_PORT];
        for (let i = 0; i < linkPortList.length; i++) {
            let linkPort = linkPortList[i];
            let linkPortDirection = linkPort[onfAttributes.LINK.PORT_DIRECTION];
            if (linkPortDirection == LinkPort.portDirectionEnum.OUTPUT) {
                outputLinkPort = linkPort
            }
        }
        return outputLinkPort;
    } catch (error) {
        console.log(error)
    }
}

/**
 * Provides input link port
 * @param {*} controlConstruct complete control-construct instance
 * @param {*} operationServerName operation name of the operation Server
 * @returns operationServeruuid
 */
function getInputLinkPortList(link) {
    let inputLinkPortList = [];
    try {
        let linkPortList = link[onfAttributes.LINK.LINK_PORT];
        for (let i = 0; i < linkPortList.length; i++) {
            let linkPort = linkPortList[i];
            let linkPortDirection = linkPort[onfAttributes.LINK.PORT_DIRECTION];
            if (linkPortDirection == LinkPort.portDirectionEnum.INPUT) {
                inputLinkPortList.push(linkPort);
            }
        }
        return inputLinkPortList;
    } catch (error) {
        console.log(error)
    }
}