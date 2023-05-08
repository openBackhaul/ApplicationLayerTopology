/**
 * The LinkPort class models the access to the connection management functions.
 * It provides functionality to ,
 *      - read the currently configured attribute values of the link/link-port
 *      - configure the logical-termination-point of the link-port
 **/

'use strict';

const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const LinkServices = require('../individualServices/LinkServices');

class LinkPort {

    localId;
    portDirection;
    logicalTerminationPoint;

    static portDirectionEnum = {
        INPUT: "core-model-1-4:PORT_DIRECTION_TYPE_INPUT",
        OUTPUT: "core-model-1-4:PORT_DIRECTION_TYPE_OUTPUT"
    }
    /**
     * constructor 
     * @param {object} localId local identifier of the link-port.
     * @param {object} portDirection port-direction of the link-port.It can be INPUT or OUTPUT.
     * @param {object} logicalTerminationPoint uuid of the operation-client/server-interface logical-termination-point.
     */
    constructor(localId, portDirection, logicalTerminationPoint) {
        this.localId = localId;
        this.portDirection = portDirection;
        this.logicalTerminationPoint = logicalTerminationPoint;
    }

    /**
     * @description This function returns the next available localId for the link-port list in a link instance.
     * @param {String} linkUuid : uuid of a link
     * @returns {promise} string {localId }
     **/
    static generateNextLocalIdAsync(linkUuid) {
        return new Promise(async function (resolve, reject) {
            let nextlocalId = "100";
            try {
                let link = (await LinkServices.getLinkAsync(
                    linkUuid
                )).link;
                let linkPortList = link[
                    onfAttributes.LINK.LINK_PORT];
                let linkPortLocalIdList = [];
                for (let i = 0; i < linkPortList.length; i++) {
                    let linkPort = linkPortList[i];
                    let localId = linkPort[
                        onfAttributes.LOCAL_CLASS.LOCAL_ID];
                    linkPortLocalIdList.push(localId);
                }
                if (linkPortLocalIdList.length > 0) {
                    linkPortLocalIdList.sort();
                    let lastUuid = linkPortLocalIdList[
                        linkPortLocalIdList.length - 1];
                    nextlocalId = parseInt(lastUuid) + 1;
                }
                resolve(nextlocalId.toString());
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = LinkPort;