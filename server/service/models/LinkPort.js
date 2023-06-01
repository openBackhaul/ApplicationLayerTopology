/**
 * The LinkPort class models the access to the connection management functions.
 * It provides functionality to ,
 *      - read the currently configured attribute values of the link/link-port
 *      - configure the logical-termination-point of the link-port
 **/

'use strict';


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

    getLocalId() {
        return this.localId;
    }

    /**
     * @description This function returns the next available localId for the link-port list in a link instance.
     * @param {Link} link
     * @returns {String} new local ID
     **/
    static generateNextLocalId(link) {
        let nextlocalId = "100";
        let linkPortList = link.getLinkPorts();
        let linkPortLocalIdList = [];
        for (let linkPort of linkPortList) {
            let localId = linkPort.getLocalId();
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
