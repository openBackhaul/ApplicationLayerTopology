/**
 * The LinkPort class models the access to the connection management functions.
 * It provides functionality to ,
 *      - read the currently configured attribute values of the link/link-port
 *      - configure the logical-termination-point of the link-port
 **/

'use strict';

const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');

class LinkPort {

    static portDirectionEnum = {
        INPUT: "core-model-1-4:PORT_DIRECTION_TYPE_INPUT",
        OUTPUT: "core-model-1-4:PORT_DIRECTION_TYPE_OUTPUT"
    }

    /**
     * @description This function returns the next available localId for the link-port list in a link instance.
     * @param {String} link
     * @returns {String} new local ID
     **/
    static generateNextLocalId(link) {
        let nextlocalId = "100";
        let linkPortList = link[onfAttributes.LINK.LINK_PORT];
        let linkPortLocalIdList = [];
        for (let linkPort of linkPortList) {
            let localId = linkPort[onfAttributes.LOCAL_CLASS.LOCAL_ID];
            linkPortLocalIdList.push(localId);
        }
        if (linkPortLocalIdList.length > 0) {
            linkPortLocalIdList.sort();
            let lastUuid = linkPortLocalIdList[linkPortLocalIdList.length - 1];
            nextlocalId = parseInt(lastUuid) + 1;
        }
        return nextlocalId.toString();
    }
}

module.exports = LinkPort;
