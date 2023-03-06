/**
 * The Link class models the access to the connection management function.
 * It provides functionality to ,
 *      - read the currently configured attribute values of the /link
 *      - configure the link-ports of the link
 **/

'use strict';

const onfPaths = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfPaths');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');
const ControlConstructService = require('../individualServices/ControlConstructService');
const LinkPort = require('./LinkPort');
const onfFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');

class Link {
    uuid;
    linkPort;
    /**
     * constructor 
     * @param {uuid} uuid of the link
     * @param {linkPort} linkPort object
     */
    constructor(uuid, linkPort) {
        this.uuid = uuid;
        this.linkPort = linkPort;
    }

    static isLinkExistsAsync(servingOperationUuid, consumingOperationuuid) {
        return new Promise(async function (resolve, reject) {
            let isLinkExists = false;
            try {
                let linkList = await ControlConstructService.getLinkListAsync();
                for (let i = 0; i < linkList.length; i++) {
                    let isServingOperationUuidExists = false;
                    let isConsumingOperationuuid = false;
                    let link = linkList[i];
                    let linkPortList = link[onfAttributes.LINK.LINK_PORT];
                    for (let j = 0; j < linkPortList.length; j++) {
                        let linkPort = linkPortList[j];
                        let linkPortLogicalTerminationPoint = linkPort[onfAttributes.LINK.LOGICAL_TERMINATION_POINT];
                        let portDirection = linkPort[onfAttributes.LINK.PORT_DIRECTION];
                        if (portDirection == LinkPort.portDirectionEnum.INPUT && linkPortLogicalTerminationPoint == consumingOperationuuid) {
                            isConsumingOperationuuid = true;
                        } else if (portDirection == LinkPort.portDirectionEnum.OUTPUT && linkPortLogicalTerminationPoint == servingOperationUuid) {
                            isServingOperationUuidExists = true;
                        }
                    }
                    if (isServingOperationUuidExists && isConsumingOperationuuid) {
                        isLinkExists = true;
                    }
                }
                resolve(isLinkExists);
            } catch (error) {
                reject(error);
            }
        });
    }

    static isConsumingServiceExistsAsync(linkUuid, consumingOperationuuid) {
        return new Promise(async function (resolve, reject) {
            let isConsumingServiceExists = false;
            try {
                let link = await ControlConstructService.getLinkAsync(linkUuid);
                let linkPortList = link["link-port"];
                for (let j = 0; j < linkPortList.length; j++) {
                    let linkPort = linkPortList[j];
                    let linkPortLogicalTerminationPoint = linkPort[onfAttributes.LINK.LOGICAL_TERMINATION_POINT];
                    let portDirection = linkPort[onfAttributes.LINK.PORT_DIRECTION];
                    if (portDirection == LinkPort.portDirectionEnum.INPUT && linkPortLogicalTerminationPoint == consumingOperationuuid) {
                        isConsumingServiceExists = true;
                    }
                }
                resolve(isConsumingServiceExists);
            } catch (error) {
                reject(error);
            }
        });
    }

    static getLinkUuidOfTheServingOperationAsync(servingOperationUuid) {
        return new Promise(async function (resolve, reject) {
            let linkUuidOfTheServingOperation;
            try {
                let linkList = await ControlConstructService.getLinkListAsync();
                for (let i = 0; i < linkList.length; i++) {
                    let link = linkList[i];
                    let linkPortList = link[onfAttributes.LINK.LINK_PORT];
                    for (let j = 0; j < linkPortList.length; j++) {
                        let linkPort = linkPortList[j];
                        let linkPortLogicalTerminationPoint = linkPort[onfAttributes.LINK.LOGICAL_TERMINATION_POINT];
                        let portDirection = linkPort[onfAttributes.LINK.PORT_DIRECTION];
                        if (portDirection == LinkPort.portDirectionEnum.OUTPUT && linkPortLogicalTerminationPoint == servingOperationUuid) {
                            linkUuidOfTheServingOperation = link[onfAttributes.GLOBAL_CLASS.UUID];
                        }
                    }
                }
                resolve(linkUuidOfTheServingOperation);
            } catch (error) {
                reject(error);
            }
        });
    }

    static getLinkUuidOfTheConsumingOperationAsync(clientOperationUuid) {
        return new Promise(async function (resolve, reject) {
            let linkUuidOfTheConsumingOperation;
            try {
                let linkList = await ControlConstructService.getLinkListAsync();
                for (let i = 0; i < linkList.length; i++) {
                    let link = linkList[i];
                    let linkPortList = link[onfAttributes.LINK.LINK_PORT];
                    for (let j = 0; j < linkPortList.length; j++) {
                        let linkPort = linkPortList[j];
                        let linkPortLogicalTerminationPoint = linkPort[onfAttributes.LINK.LOGICAL_TERMINATION_POINT];
                        let portDirection = linkPort[onfAttributes.LINK.PORT_DIRECTION];
                        if (portDirection == LinkPort.portDirectionEnum.INPUT && linkPortLogicalTerminationPoint == clientOperationUuid) {
                            linkUuidOfTheConsumingOperation = link[onfAttributes.GLOBAL_CLASS.UUID];
                        }
                    }
                }
                resolve(linkUuidOfTheConsumingOperation);
            } catch (error) {
                reject(error);
            }
        });
    }

    static getLocalIdOfTheConsumingOperationAsync(linkUuid,clientOperationUuid) {
        return new Promise(async function (resolve, reject) {
            let linkPortLocalIdOfTheConsumingOperation;
            try {
                let link = await ControlConstructService.getLinkAsync(linkUuid);
                let linkPortList = link[onfAttributes.LINK.LINK_PORT];
                for (let i = 0; i < linkPortList.length; i++) {
                    let linkPort = linkPortList[i];
                    let linkPortLogicalTerminationPoint = linkPort[onfAttributes.LINK.LOGICAL_TERMINATION_POINT];
                    let portDirection = linkPort[onfAttributes.LINK.PORT_DIRECTION];
                    if (portDirection == LinkPort.portDirectionEnum.INPUT && linkPortLogicalTerminationPoint == clientOperationUuid) {
                        linkPortLocalIdOfTheConsumingOperation = linkPort[onfAttributes.LOCAL_CLASS.LOCAL_ID];
                    }
                }
                resolve(linkPortLocalIdOfTheConsumingOperation);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @description This function adds a linkPort instance to the core-model-1-4:control-construct/link
     * @param {String} linkUuid : uuid of the link
     * @param {String} linkPort : linkPort instance
     * @returns {promise} boolean {true | false} 
     **/
    static async addLinkPortAsync(linkUuid, linkPort) {
        return new Promise(async function (resolve, reject) {
            let isCreated = false;
            try {
                let linkPortPath = onfPaths.LINK +
                    "=" +
                    linkUuid +
                    "/link-port";
                linkPort = onfFormatter.modifyJsonObjectKeysToKebabCase(linkPort);
                isCreated = await fileOperation.writeToDatabaseAsync(
                    linkPortPath,
                    linkPort,
                    true);
                resolve(isCreated);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @description This function deletes the linkPort instance that matches the localId argument from its corresponding 
     * link
     * @param {String} linkUuid : uuid of the link
     * @param {String} linkPortLocalId : local-id of an existing link-port
     * @returns {promise} boolean {true|false}
     **/
    static async deleteLinkPortAsync(linkUuid, linkPortLocalId) {
        return new Promise(async function (resolve, reject) {
            let isDeleted = false;
            try {
                let linkPortPath = onfPaths.LINK +
                    "=" +
                    linkUuid +
                    "/link-port" + "=" + linkPortLocalId;
                isDeleted = await fileOperation.deletefromDatabaseAsync(
                    linkPortPath,
                    linkPortLocalId,
                    true);
                resolve(isDeleted);
            } catch (error) {
                reject(false);
            }
        });
    }



    /**
     * @description This function returns the next available localId for the link-port list in a link instance.
     * @param {String} linkUuid : uuid of a link
     * @returns {promise} string {localId }
     **/
    static generateNextUuidAsync() {
        return new Promise(async function (resolve, reject) {
            let uuidPrefix = "alt-0-0-1-op-link-";
            let nextUuidNumber = "0000";
            let nextUuid;
            try {
                let linkList = await ControlConstructService.getLinkListAsync();
                let linkUuidList = [];
                for (let i = 0; i < linkList.length; i++) {
                    let link = linkList[i];
                    let uuid = link[
                        onfAttributes.GLOBAL_CLASS.UUID];
                    linkUuidList.push(uuid);
                }
                if (linkUuidList.length > 0) {
                    linkUuidList.sort();
                    let lastUuid = linkUuidList[
                        linkUuidList.length - 1];
                    uuidPrefix = lastUuid.substring(
                        0,
                        lastUuid.lastIndexOf("-") + 1);
                    nextUuidNumber = (parseInt(lastUuid.substring(
                        lastUuid.lastIndexOf("-") + 1,
                        lastUuid.length))) + 1;
                }
                nextUuid = uuidPrefix + nextUuidNumber;
                resolve(nextUuid.toString());
            } catch (error) {
                reject(error);
            }
        });
    }
}
module.exports = Link;