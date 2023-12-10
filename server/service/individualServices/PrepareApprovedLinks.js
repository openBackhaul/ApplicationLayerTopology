const LinkServices = require('./LinkServices');
const ForwardingAutomationService = require('onf-core-model-ap/applicationPattern/onfModel/services/ForwardingConstructAutomationServices');

/**
 * @description This function finds or creates a link.
 * @param {Object} preApprovedLinks details of the link
 **/
exports.createPreApprovedLinks = async function (preApprovedLinks) {
    let forwardings = [];
    for (let preApprovedLink of preApprovedLinks.links) {
        let servingOperationUuid = preApprovedLink.output;
        let consumingOperationUuidList = [];
        if (Array.isArray(preApprovedLink.input)) {
            consumingOperationUuidList = preApprovedLink.input;
        } else {
            consumingOperationUuidList.push(preApprovedLink.input);
        }
        let forwarding = await LinkServices.prepareLinkChangeNotificationForwardingsAsync(
            servingOperationUuid, consumingOperationUuidList
        );
        if (forwarding) {
            forwardings.push(forwarding);
        }
    }
    ForwardingAutomationService.automateForwardingConstructAsync(
        "/v1/add-operation-client-to-link",
        forwardings,
        "",
        "",
        "1",
        ""
    );
}

