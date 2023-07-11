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

    /**
     * @description Returns Local ID of consuming operation client UUID.
     * @param {String} link
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
     * @description Adds a link-port instance to the link.
     * @param {String} linkUuid
     * @param {String} linkPort : new link-port to be added
     * @returns {Promise<Object>} { took }
     **/
    static async addLinkPortAsync(linkUuid, linkPort) {
        let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
        let client = await elasticsearchService.getClient(true, esUuid);
        let indexAlias = await getIndexAliasAsync(esUuid);
        let response = await client.updateByQuery({
            index: indexAlias,
            refresh: true,
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
        if (response && response.body.updated !== 0) {
            return { "took": response.body.took };
        } else {
            throw new Error('link-port was not updated');
        }
    }

    /**
     * @description This function deletes the linkPort instance that matches the localId argument from its corresponding
     * link
     * @param {String} linkUuid : uuid of the link
     * @param {String} linkPortLocalId : local-id of an existing link-port
     * @returns {Promise<Object>} { took }
     **/
    static async deleteLinkPortAsync(linkUuid, linkPortLocalId) {
        let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
        let client = await elasticsearchService.getClient(false, esUuid);
        let indexAlias = await getIndexAliasAsync(esUuid);
        let response = await client.updateByQuery({
            index: indexAlias,
            refresh: true,
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
        if (response && response.body.updated !== 0) {
            return { "took": response.body.took };
        } else {
            throw new Error('link-port was not updated');
        }
    }
}
module.exports = Link;
