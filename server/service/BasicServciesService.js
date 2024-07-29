const ServiceUtils = require('onf-core-model-ap-bs/basicServices/utility/LogicalTerminationPoint');
const httpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');
const tcpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const operationClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationClientInterface');
const ForwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const ForwardingAutomationService = require('onf-core-model-ap/applicationPattern/onfModel/services/ForwardingConstructAutomationServices');
const forwardingConstructAutomationInput = require('onf-core-model-ap/applicationPattern/onfModel/services/models/forwardingConstruct/AutomationInput');
const httpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const tcpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpServerInterface');
const ControlConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ControlConstruct');
const operationServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationServerInterface');
const onfFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');
const logicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');
const prepareALTForwardingAutomation = require('onf-core-model-ap-bs/basicServices/services/PrepareALTForwardingAutomationV2');

/**
 * Embed yourself into the MBH SDN application layer
 *
 * body V1_embedyourself_body 
 * user String User identifier from the system starting the service call
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.embedYourself = async function (body, user, xCorrelator, traceIndicator, customerJourney, operationServerName) {
    let registryOfficeApplicationName = body["registry-office-application"];
    let registryOfficeReleaseNumber = body["registry-office-application-release-number"];
    let registryOfficeProtocol = body["registry-office-protocol"];
    let registryOfficeAddress = body["registry-office-address"];
    let registryOfficePort = body["registry-office-port"];
    let deregisterOperation = body["deregistration-operation"];
    let relayOperationUpdateOperation = body["relay-operation-update-operation"];
    let relayServerReplacementOperation = body["relay-server-replacement-operation"];

    /****************************************************************************************
     * Prepare logicalTerminationPointConfigurationInput object to
     * configure logical-termination-point
     ****************************************************************************************/

    let ltpConfigurationList = [];
    // update the registryOffice configuration
    let relayServerReplacementForwarding = "PromptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement";
    let relayOperationUpdate = "PromptingNewReleaseForUpdatingServerCausesRequestForBroadcastingInfoAboutBackwardCompatibleUpdateOfOperation";
    let deregisterApplication = "PromptForBequeathingDataCausesRequestForDeregisteringOfOldRelease";

    let registryOfficeClientUuidStack = await ServiceUtils.resolveClientUuidStackFromForwardingAsync(relayServerReplacementForwarding);
    let relayOperationUpdateOperationClientUuid = await ServiceUtils.resolveOperationClientUuidFromForwardingAsync(relayOperationUpdate);
    let deregisterApplicationOperationClientUuid = await ServiceUtils.resolveOperationClientUuidFromForwardingAsync(deregisterApplication);

    let existingRegistryOfficeApplicationName = await httpClientInterface.getApplicationNameAsync(registryOfficeClientUuidStack.httpClientUuid);
    let existingRegistryOfficeReleaseNumber = await httpClientInterface.getReleaseNumberAsync(registryOfficeClientUuidStack.httpClientUuid);
    let existingRegistryOfficeAddress = await tcpClientInterface.getRemoteAddressAsync(registryOfficeClientUuidStack.tcpClientUuid);
    let existingRegistryOfficePort = await tcpClientInterface.getRemotePortAsync(registryOfficeClientUuidStack.tcpClientUuid);
    let existingRegistryOfficeProtocol = await tcpClientInterface.getRemoteProtocolAsync(registryOfficeClientUuidStack.tcpClientUuid);
    let exsitingRegistryOfficeRelayServerReplacementOperation = await operationClientInterface.getOperationNameAsync(registryOfficeClientUuidStack.operationClientUuid);
    let exsitingRegistryOfficeRelayOperationUpdateOperation = await operationClientInterface.getOperationNameAsync(relayOperationUpdateOperationClientUuid);
    let exsitingRegistryOfficeDeregisterApplicationOperation = await operationClientInterface.getOperationNameAsync(deregisterApplicationOperationClientUuid);

    let isRoApplicationNameUpdated = false;
    let isRoReleaseNumberUpdated = false;
    let isRoAddressUpdated = false;
    let isRoPortUpdated = false;
    let isRoProtocolUpdated = false;
    let isRoRelayServerReplacementOperationUpdated = false;
    let isRoRelayOperationUpdateOperationUpdated = false;
    let isRoDeregisterApplicationOperationUpdated = false;

    if (registryOfficeApplicationName != existingRegistryOfficeApplicationName) {
        isRoApplicationNameUpdated = await httpClientInterface.setApplicationNameAsync(
            registryOfficeClientUuidStack.httpClientUuid,
            registryOfficeApplicationName);
    }
    if (registryOfficeReleaseNumber != existingRegistryOfficeReleaseNumber) {
        isRoReleaseNumberUpdated = await httpClientInterface.setReleaseNumberAsync(
            registryOfficeClientUuidStack.httpClientUuid,
            registryOfficeReleaseNumber);
    }
    if (JSON.stringify(registryOfficeAddress) != JSON.stringify(existingRegistryOfficeAddress)) {
        isRoAddressUpdated = await tcpClientInterface.setRemoteAddressAsync(
            registryOfficeClientUuidStack.tcpClientUuid,
            registryOfficeAddress);
    }
    if (registryOfficePort != existingRegistryOfficePort) {
        isRoPortUpdated = await tcpClientInterface.setRemotePortAsync(
            registryOfficeClientUuidStack.tcpClientUuid,
            registryOfficePort);
    }
    if (registryOfficeProtocol != existingRegistryOfficeProtocol) {
        isRoProtocolUpdated = await tcpClientInterface.setRemoteProtocolAsync(
            registryOfficeClientUuidStack.tcpClientUuid,
            registryOfficeProtocol);
    }
    if (relayServerReplacementOperation != exsitingRegistryOfficeRelayServerReplacementOperation) {
        isRoRelayServerReplacementOperationUpdated = await operationClientInterface.setOperationNameAsync(
            registryOfficeClientUuidStack.operationClientUuid,
            relayServerReplacementOperation);
    }

    if (relayOperationUpdateOperation != exsitingRegistryOfficeRelayOperationUpdateOperation) {
        isRoRelayOperationUpdateOperationUpdated = await operationClientInterface.setOperationNameAsync(
            relayOperationUpdateOperationClientUuid,
            relayOperationUpdateOperation);
    }

    if (deregisterOperation != exsitingRegistryOfficeDeregisterApplicationOperation) {
        isRoDeregisterApplicationOperationUpdated = await operationClientInterface.setOperationNameAsync(
            deregisterApplicationOperationClientUuid,
            deregisterOperation);
    }

    if (isRoApplicationNameUpdated || isRoReleaseNumberUpdated) {
        ltpConfigurationList.push(registryOfficeClientUuidStack.httpClientUuid);
    }
    if (isRoAddressUpdated || isRoPortUpdated || isRoProtocolUpdated) {
        ltpConfigurationList.push(registryOfficeClientUuidStack.tcpClientUuid);
    }
    if (isRoRelayServerReplacementOperationUpdated) {
        ltpConfigurationList.push(registryOfficeClientUuidStack.operationClientUuid);
    }
    if (isRoRelayOperationUpdateOperationUpdated) {
        ltpConfigurationList.push(relayOperationUpdateOperationClientUuid);
    }
    if (isRoDeregisterApplicationOperationUpdated) {
        ltpConfigurationList.push(deregisterApplicationOperationClientUuid);
    }

    /***********************************************************************
     * oldRelease information to be updated if provided in the requestBody
     ***********************************************************************/

    let oldApplicationNameInConfiguration;
    let beaqueathYourDataAndDieForwardingName = "PromptForEmbeddingInitiatesEmbeddingProcess.RequestForBequeathingData";
    let isOldReleaseExist = await isForwardingNameExist(beaqueathYourDataAndDieForwardingName);

    if (isOldReleaseExist) {
        let preceedingApplicationClientUuidStack = await ServiceUtils.resolveClientUuidStackFromForwardingAsync(beaqueathYourDataAndDieForwardingName);

        oldApplicationNameInConfiguration = await httpClientInterface.getApplicationNameAsync(preceedingApplicationClientUuidStack.httpClientUuid)
        let existingpreceedingApplicationAddress = await tcpClientInterface.getRemoteAddressAsync(preceedingApplicationClientUuidStack.tcpClientUuid);
        let existingpreceedingApplicationPort = await tcpClientInterface.getRemotePortAsync(preceedingApplicationClientUuidStack.tcpClientUuid);
        let existingpreceedingApplicationProtocol = await tcpClientInterface.getRemoteProtocolAsync(preceedingApplicationClientUuidStack.tcpClientUuid);

        let isORAddressUpdated = false;
        let isORPortUpdated = false;
        let isORProtocolUpdated = false;

        let oldReleaseAddress = body["old-release-address"];
        let oldReleaseProtocol = body["old-release-protocol"];
        let oldReleasePort = body["old-release-port"];
        if (oldReleaseAddress != undefined && JSON.stringify(oldReleaseAddress) != JSON.stringify(existingpreceedingApplicationAddress)) {
            isORAddressUpdated = await tcpClientInterface.setRemoteAddressAsync(
                preceedingApplicationClientUuidStack.tcpClientUuid,
                oldReleaseAddress);
        }
        if (oldReleasePort != undefined && oldReleasePort != existingpreceedingApplicationPort) {
            isORPortUpdated = await tcpClientInterface.setRemotePortAsync(
                preceedingApplicationClientUuidStack.tcpClientUuid,
                oldReleasePort);
        }
        if (oldReleaseProtocol != undefined && oldReleaseProtocol != existingpreceedingApplicationProtocol) {
            isORProtocolUpdated = await tcpClientInterface.setRemoteProtocolAsync(
                preceedingApplicationClientUuidStack.tcpClientUuid,
                oldReleaseProtocol);
        }

        if (isORAddressUpdated || isORPortUpdated || isORProtocolUpdated) {
            ltpConfigurationList.push(preceedingApplicationClientUuidStack.tcpClientUuid);
        }

    }

    /****************************************************************************************
     * Prepare attributes to configure forwarding-construct
     * Since the following forwarding-constructs are invariant , no configuration required in the forwarding-construct
     * PromptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement,
     * PromptingNewReleaseForUpdatingServerCausesRequestForBroadcastingInfoAboutBackwardCompatibleUpdateOfOperation
     * PromptForBequeathingDataCausesRequestForDeregisteringOfOldRelease
     ****************************************************************************************/

    /****************************************************************************************
     * Prepare attributes to automate forwarding-construct
     ****************************************************************************************/
    let forwardingAutomationInputList = await embedYourselfPrepareForwardingAutomation(
        ltpConfigurationList, oldApplicationNameInConfiguration
    );
    ForwardingAutomationService.automateForwardingConstructAsync(
        operationServerName,
        forwardingAutomationInputList,
        user,
        xCorrelator,
        traceIndicator,
        customerJourney
    );
}

async function isForwardingNameExist(forwardingName) {
    const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
    return forwardingConstruct !== undefined;
}

async function embedYourselfPrepareForwardingAutomation(ltpConfigurationList, oldApplicationName = '') {
    let forwardingConstructAutomationList = [];
    try {
        let forwardingAutomation;
        if (oldApplicationName != "OldRelease" && oldApplicationName != '') {
            /***********************************************************************************
             * PromptForEmbeddingInitiatesEmbeddingProcess.RequestForBequeathingData /v1/bequeath-your-data-and-die
             ************************************************************************************/
            let bequeathYourDataAndDieForwardingName = "PromptForEmbeddingInitiatesEmbeddingProcess.RequestForBequeathingData";
            let bequeathYourDataAndDieContext;
            let bequeathYourDataAndDieRequestBody = {};
            bequeathYourDataAndDieRequestBody.newApplicationName = await httpServerInterface.getApplicationNameAsync();
            bequeathYourDataAndDieRequestBody.newApplicationRelease = await httpServerInterface.getReleaseNumberAsync();
            bequeathYourDataAndDieRequestBody.newApplicationProtocol = await tcpServerInterface.getLocalProtocol();
            bequeathYourDataAndDieRequestBody.newApplicationAddress = await tcpServerInterface.getLocalAddressForForwarding();
            bequeathYourDataAndDieRequestBody.newApplicationPort = await tcpServerInterface.getLocalPort();
            let oldReleaseHttpClientUuid = await httpClientInterface.getHttpClientUuidFromForwarding(bequeathYourDataAndDieForwardingName);
            let oldReleaseTcpClientUuid = (await logicalTerminationPoint.getServerLtpListAsync(oldReleaseHttpClientUuid))[0];
            let oldReleaseProtocol = await tcpClientInterface.getRemoteProtocolAsync(oldReleaseTcpClientUuid);
            let oldReleaseAddress = await tcpClientInterface.getRemoteAddressAsync(oldReleaseTcpClientUuid);
            let oldReleasePort = await tcpClientInterface.getRemotePortAsync(oldReleaseTcpClientUuid);
            if (!(oldReleaseProtocol == bequeathYourDataAndDieRequestBody.newApplicationProtocol &&
                JSON.stringify(oldReleaseAddress) == JSON.stringify(bequeathYourDataAndDieRequestBody.newApplicationAddress) &&
                oldReleasePort == bequeathYourDataAndDieRequestBody.newApplicationPort)) {
                bequeathYourDataAndDieRequestBody = onfFormatter.modifyJsonObjectKeysToKebabCase(bequeathYourDataAndDieRequestBody);
                forwardingAutomation = new forwardingConstructAutomationInput(
                    bequeathYourDataAndDieForwardingName,
                    bequeathYourDataAndDieRequestBody,
                    bequeathYourDataAndDieContext
                );
                forwardingConstructAutomationList.push(forwardingAutomation);
            }
        }
        /***********************************************************************************
        * PromptForEmbeddingInitiatesEmbeddingProcess :: RetrieveControlConstructFromRo and RetrieveControlConstructFromTar
        * RegistryOffice and TypeApprovalRegister /v1/redirect-topology-change-information
        ************************************************************************************/
        
        let redirectTopologyChangeInformationRequestBody = {};
        redirectTopologyChangeInformationRequestBody.topologyApplication = await httpServerInterface.getApplicationNameAsync();
        redirectTopologyChangeInformationRequestBody.topologyApplicationReleaseNumber = await httpServerInterface.getReleaseNumberAsync();
        redirectTopologyChangeInformationRequestBody.topologyApplicationProtocol = await tcpServerInterface.getLocalProtocol();
        redirectTopologyChangeInformationRequestBody.topologyApplicationAddress = await tcpServerInterface.getLocalAddressForForwarding();
        redirectTopologyChangeInformationRequestBody.topologyApplicationPort = await tcpServerInterface.getLocalPort();
        
        let controlConstructUuid = await ControlConstruct.getUuidAsync();

        let updateLtpUuid = controlConstructUuid + "-op-s-is-005";
        let deleteLtpAndDependentsUuid = controlConstructUuid + "-op-s-is-006";
        let updateFcUuid = controlConstructUuid + "-op-s-is-013";
        let UpdateFcPortUuid = controlConstructUuid + "-op-s-is-014";
        let deleteFcPortUuid = controlConstructUuid + "-op-s-is-015";

        redirectTopologyChangeInformationRequestBody.topologyOperationLtpUpdate = await operationServerInterface.getOperationNameAsync(updateLtpUuid);
        redirectTopologyChangeInformationRequestBody.topologyOperationLtpDeletion = await operationServerInterface.getOperationNameAsync(deleteLtpAndDependentsUuid);
        redirectTopologyChangeInformationRequestBody.topologyOperationFcUpdate = await operationServerInterface.getOperationNameAsync(updateFcUuid);
        redirectTopologyChangeInformationRequestBody.topologyOperationFcPortUpdate = await operationServerInterface.getOperationNameAsync(UpdateFcPortUuid);
        redirectTopologyChangeInformationRequestBody.topologyOperationFcPortDeletion = await operationServerInterface.getOperationNameAsync(deleteFcPortUuid);

        redirectTopologyChangeInformationRequestBody = onfFormatter.modifyJsonObjectKeysToKebabCase(redirectTopologyChangeInformationRequestBody);
        let redirectTopologyChangeInformationForROForwardingName = "PromptForEmbeddingInitiatesEmbeddingProcess.RetrieveControlConstructFromRo";
        forwardingAutomation = new forwardingConstructAutomationInput(
            redirectTopologyChangeInformationForROForwardingName,
            redirectTopologyChangeInformationRequestBody,
            undefined
        );
        forwardingConstructAutomationList.push(forwardingAutomation);
        let redirectTopologyChangeInformationForTARForwardingName = "PromptForEmbeddingInitiatesEmbeddingProcess.RetrieveControlConstructFromTar";
        forwardingAutomation = new forwardingConstructAutomationInput(
            redirectTopologyChangeInformationForTARForwardingName,
            redirectTopologyChangeInformationRequestBody,
            undefined
        );
        forwardingConstructAutomationList.push(forwardingAutomation);

        /***********************************************************************************
         * forwardings for application layer topology
         ************************************************************************************/
        let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputAsync(
            ltpConfigurationList
        );

        if (applicationLayerTopologyForwardingInputList) {
            for (let i = 0; i < applicationLayerTopologyForwardingInputList.length; i++) {
                let applicationLayerTopologyForwardingInput = applicationLayerTopologyForwardingInputList[i];
                forwardingConstructAutomationList.push(applicationLayerTopologyForwardingInput);
            }
        }

        return forwardingConstructAutomationList;
    } catch (error) {
        console.log(error);
    }
}