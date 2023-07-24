const LinkServices = require('./LinkServices');
const LinkPort = require('../models/LinkPort');
const prepareForwardingAutomation = require('./PrepareForwardingAutomation');
const ForwardingAutomationService = require('onf-core-model-ap/applicationPattern/onfModel/services/ForwardingConstructAutomationServices');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');

/**
 * @description This function finds or creates a link.
 * @param {Object} preApprovedLinks details of the link
 **/
exports.createPreApprovedLinks = async function (preApprovedLinks) {
    let forwardings = [];
    for (let preApprovedLink of preApprovedLinks.links) {
        let servingOperationUuid = preApprovedLink.output;
        let consumingOperationUuidList = [];

        let linkResponse = await LinkServices.getLinkOfTheOperationAsync(servingOperationUuid, LinkPort.portDirectionEnum.OUTPUT);
        let existingLink = linkResponse.link;

        if (!existingLink) {
            if (Array.isArray(preApprovedLink.input)) {
                consumingOperationUuidList = preApprovedLink.input;
            } else {
                consumingOperationUuidList.push(preApprovedLink.input);
            }
            let response = await LinkServices.createCompleteLinkAsync(consumingOperationUuidList, servingOperationUuid);
            let linkUuid = response.link[onfAttributes.GLOBAL_CLASS.UUID];
            console.log(`Adding new link: ${linkUuid}`);
            let forwardingAutomationInputList = await prepareForwardingAutomation.createLinkChangeNotificationForwardings(
                linkUuid
            );
            forwardings.push(forwardingAutomationInputList);
        }
    }
    forwardings = forwardings.flat();
    ForwardingAutomationService.automateForwardingConstructAsync(
        "/v1/add-operation-client-to-link",
        forwardings,
        "",
        "",
        "1",
        ""
    );
}
