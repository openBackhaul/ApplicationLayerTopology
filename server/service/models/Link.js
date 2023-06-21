/**
 * The Link class models the access to the connection management function.
 * It provides functionality to ,
 *      - read the currently configured attribute values of the /link
 *      - configure the link-ports of the link
 **/

'use strict';

const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const LinkPort = require('./LinkPort');
const onfFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');
const {
    elasticsearchService,
    getIndexAliasAsync,
} = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const ElasticsearchPreparation = require('../individualServices/ElasticsearchPreparation');

class Link {
    uuid;
    linkPort;
    /**
     * constructor 
     *  @param {String} uuid of the link
     * @param {LinkPort} linkPort object
     */
    constructor(uuid, linkPort) {
        this.uuid = uuid;
        this.linkPort = linkPort;
    }

    /**
     * Creates a Link object out of JSON.
     * @param {Object} link
     */
    static createFromObject(link) {
        let linkPort = [];
        for (let lp of link[onfAttributes.LINK.LINK_PORT]) {
            linkPort.push(new LinkPort(
                lp[onfAttributes.LOCAL_CLASS.LOCAL_ID],
                lp[onfAttributes.LINK.PORT_DIRECTION],
                lp[onfAttributes.LINK.LOGICAL_TERMINATION_POINT]
            ));
        }
        return new Link(link[onfAttributes.GLOBAL_CLASS.UUID], linkPort);
    }

    addNewLinkPort(linkPort) {
        this.linkPort.push(linkPort);
    }

    getLinkPorts() {
        return this.linkPort;
    }

    /**
     * @description Returns Local ID of consuming operation client UUID.
     * @param {Link} link
     * @param {String} clientOperationUuid
     * @returns localId
     */
    static getLocalIdOfTheConsumingOperation(link, clientOperationUuid) {
        let linkPortList = link[onfAttributes.LINK.LINK_PORT];
        for (let linkPort of linkPortList) {
            let linkPortLogicalTerminationPoint = linkPort[onfAttributes.LINK.LOGICAL_TERMINATION_POINT];
            let portDirection = linkPort[onfAttributes.LINK.PORT_DIRECTION];
            if (portDirection === LinkPort.portDirectionEnum.INPUT && linkPortLogicalTerminationPoint === clientOperationUuid) {
                return linkPort[onfAttributes.LOCAL_CLASS.LOCAL_ID];
            }
        }
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
                linkPort = onfFormatter.modifyJsonObjectKeysToKebabCase(linkPort);
                let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
                let client = await elasticsearchService.getClient(true, esUuid);
                let indexAlias = await getIndexAliasAsync(esUuid);
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
                let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
                let client = await elasticsearchService.getClient(true, esUuid);
                let indexAlias = await getIndexAliasAsync(esUuid)
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
}
module.exports = Link;
