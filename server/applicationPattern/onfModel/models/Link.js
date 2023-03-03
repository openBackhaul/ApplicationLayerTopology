/**
 * The Link class models the access to the connection management function.
 * It provides functionality to ,
 *      - read the currently configured attribute values of the /link
 *      - configure the link-ports of the link
 **/

'use strict';

const onfPaths = require('../constants/OnfPaths');
const onfAttributes = require('../constants/OnfAttributes');
const fileOperation = require('../../databaseDriver/JSONDriver');
const NetworkControlDomain = require('./NetworkControlDomain');
const LinkPort = require('./LinkPort');
const onfFormatter = require('../utility/OnfAttributeFormatter');
const {
    elasticsearchService,
    getIndexAliasAsync
} = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');


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
                let linkList = await NetworkControlDomain.getLinkListAsync();
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
                let link = await NetworkControlDomain.getLinkAsync(linkUuid);
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
                let linkList = await NetworkControlDomain.getLinkListAsync();
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
                let linkList = await NetworkControlDomain.getLinkListAsync();
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

    static getLocalIdOfTheConsumingOperationAsync(linkUuid, clientOperationUuid) {
        return new Promise(async function (resolve, reject) {
            let linkPortLocalIdOfTheConsumingOperation;
            try {
                let link = await NetworkControlDomain.getLinkAsync(linkUuid);
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
    static async addLinkPortAsync(linkUuid, linkPort, isLinkCreated) {
        return new Promise(async function (resolve, reject) {
            let isCreated = false;
            try {
                linkPort = onfFormatter.modifyJsonObjectKeysToKebabCase(linkPort);
                let client = await elasticsearchService.getClient();
                let indexAlias = await getIndexAliasAsync("alt-2-0-1-es-c-es-1-0-0-001");
                let response = await client.updateByQuery({
                    index: indexAlias,
                    body: {
                        script: {
                            source: "ctx._source['link-port'].add(params['link-port'])",
                            params: {
                                "link-port": linkPort
                            }
                        },
                        query: {
                            match: {
                                "uuid": linkUuid
                            }
                        }
                    },
                });
                resolve(response);
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
                let client = await elasticsearchService.getClient();
                let indexAlias = await getIndexAliasAsync("alt-2-0-1-es-c-es-1-0-0-001");
                let response = await client.updateByQuery({
                    index: indexAlias,
                    body: {
                        script: {
                            source: "ctx._source['link-port'].removeIf(port -> port['local-id'] == params['local-id'])",
                            params: {
                                "local-id": linkPortLocalId
                            }
                        },
                        query: {
                            match: {
                                "uuid": linkUuid
                            }
                        }
                    },
                });

                resolve(response);
            } catch (error) {
                reject(error);
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
            let uuid = await fileOperation.readFromDatabaseAsync(onfPaths.CONTROL_CONSTRUCT_UUID);
            let uuidPrefix = uuid + "-op-link-";
            let nextUuidNumber = "000";
            let nextUuid;
            try {
                let linkList = await NetworkControlDomain.getLinkListAsync();
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