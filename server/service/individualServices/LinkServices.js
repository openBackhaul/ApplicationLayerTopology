/**
 * This module provides functionalities to
 *      - manipulate the /core-model-1-4:network-control-domain/link
 *      - create link instance for new connections
 *      - delete link instance for obsolete connections
 **/

'use strict';

const LayerProtocol = require('onf-core-model-ap/applicationPattern/onfModel/models/LayerProtocol');
const Link = require('../models/Link');
const ControlConstructService = require('./ControlConstructService');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const LinkPort = require('../models/LinkPort');
const {
    v4: uuidv4
} = require('uuid');

const {
    elasticsearchService,
    getIndexAliasAsync,
    createResultArray
} = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const ElasticsearchPreparation = require('./ElasticsearchPreparation');

/**
 * @description This function finds or creates a link.
 * @param {Object} EndPoints details of the link
 * @return {Promise} String {uuid}
 **/
exports.findOrCreateLinkForTheEndPointsAsync = async function (EndPoints) {
    let linkUuid;
    let servingOperationUuid = await getServingOperationUuidAsync(EndPoints);
    let consumingOperationUuid = await getConsumingOperationUuidAsync(EndPoints);
    if (servingOperationUuid && consumingOperationUuid) {
        linkUuid = await Link.getLinkUuidOfTheServingOperationAsync(servingOperationUuid, LinkPort.portDirectionEnum.OUTPUT);
        if (linkUuid) {
            linkUuid = await updateLinkAsync(linkUuid, consumingOperationUuid);
        } else {
            linkUuid = await createLinkAsync(consumingOperationUuid, servingOperationUuid);
        }
    }
    return linkUuid;
}

/**
 * @description This function deletes a operation client from the link 
 * @param {String} EndPoints : EndPoint details of the link
 * @return {Promise<String>} linkUuid
 **/
exports.deleteOperationClientFromTheEndPointsAsync = async function (EndPoints) {
    let linkUuid;
    let servingOperationUuid = await getServingOperationUuidAsync(EndPoints);
    let consumingOperationUuid = await getConsumingOperationUuidAsync(EndPoints);
    if (servingOperationUuid && consumingOperationUuid) {
        linkUuid = await Link.getLinkUuidOfTheServingOperationAsync(servingOperationUuid);
        if (linkUuid) {
            await deleteLinkAsync(linkUuid, consumingOperationUuid);
        }
    }
    return linkUuid;
}

async function getServingOperationUuidAsync(EndPoints) {
    let servingApplicationName = EndPoints["serving-application-name"];
    let servingApplicationReleaseNumber = EndPoints["serving-application-release-number"];
    let operationName = EndPoints["operation-name"];
    let servingApplicationCCResponse = await ControlConstructService.getControlConstructOfTheApplicationAsync(
        servingApplicationName,
        servingApplicationReleaseNumber);
    let servingOperationUuid = ControlConstructService.getOperationServerUuid(
        servingApplicationCCResponse.controlConstruct,
        operationName);
    return servingOperationUuid;
}

async function getConsumingOperationUuidAsync(EndPoints) {
    let servingApplicationName = EndPoints["serving-application-name"];
    let servingApplicationReleaseNumber = EndPoints["serving-application-release-number"];
    let operationName = EndPoints["operation-name"];
    let consumingApplicationName = EndPoints["consuming-application-name"];
    let consumingApplicationReleaseNumber = EndPoints["consuming-application-release-number"];
    let consumingApplicationCCResponse = await ControlConstructService.getControlConstructOfTheApplicationAsync(
        consumingApplicationName,
        consumingApplicationReleaseNumber);
    let consumingOperationUuid = ControlConstructService.getOperationClientUuid(
        consumingApplicationCCResponse.controlConstruct,
        operationName,
        servingApplicationName,
        servingApplicationReleaseNumber
    );
    return consumingOperationUuid;
}

/**
 * @description This function deletes a link from Elasticsearch
 * @param {String} linkUuid : uuid of the link
 * @param {String} consumingOperationuuid : logical-termination-point of the link-port
 * @return {Promise<void>}
 **/
async function deleteLinkAsync(linkUuid, consumingOperationuuid) {
    let localId = await Link.getLocalIdOfTheConsumingOperationAsync(linkUuid, consumingOperationuuid)
    if (localId) {
        await Link.deleteLinkPortAsync(linkUuid, localId);
    }
}

/**
 * @description This function deletes the linkPort instance that matches the localId argument from its corresponding
 * link
 * @param {String} linkUuid : uuid of the link
 * @param {String} linkPortLocalId : local-id of an existing link-port
 * @returns {promise} boolean {true|false}
 **/
async function deleteLinkPortAsync(linkUuid, linkPortLocalId) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
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
    return response;
}

/**
 * @description This function updates a link
 * @param {String} linkUuid : uuid of the link
 * @param {String} consumingOperationuuid : logical-termination-point of the link-port
 * @return {Promise} 
 **/
function updateLinkAsync(linkUuid, consumingOperationuuid) {
    return new Promise(async function (resolve, reject) {
        try {
            let isLinkExistsAsync = await Link.isConsumingServiceExistsAsync(
                linkUuid,
                consumingOperationuuid
            );
            if (!isLinkExistsAsync) {
                let linkLocalId = await LinkPort.generateNextLocalIdAsync(linkUuid);
                let linkPort = new LinkPort(linkLocalId,
                    LinkPort.portDirectionEnum.INPUT,
                    consumingOperationuuid
                );
                await Link.addLinkPortAsync(linkUuid,
                    linkPort
                );
            }
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * @description This function creates a link
 * @param {String} servingOperationuuid : logical-termination-point of the link-port
 * @param {String} consumingOperationuuid : logical-termination-point of the link-port
 * @return {Promise} String {uuid}
 **/
function createLinkAsync(consumingOperationuuid, servingOperationuuid) {
    return new Promise(async function (resolve, reject) {
        try {
            let linkUuid = await uuidv4();
            let link = new Link(linkUuid, []);
            let isLinkCreated = await addLinkAsync(link);
            if (isLinkCreated.body.result === "created") {
                let consumingOperationLocalId = await LinkPort.generateNextLocalIdAsync(linkUuid);
                let consumingOperationLinkPort = new LinkPort(
                    consumingOperationLocalId,
                    LinkPort.portDirectionEnum.INPUT,
                    consumingOperationuuid
                );
                let isConsumingOperationLinkPortCreated = await Link.addLinkPortAsync(linkUuid, consumingOperationLinkPort);
                if (isConsumingOperationLinkPortCreated) {
                    let servingOperationLocalId = await LinkPort.generateNextLocalIdAsync(linkUuid);
                    let servingOperationLinkPort = new LinkPort(
                        servingOperationLocalId,
                        LinkPort.portDirectionEnum.OUTPUT,
                        servingOperationuuid
                    );
                    let isServingOperationLinkPortCreated = await Link.addLinkPortAsync(linkUuid, servingOperationLinkPort);
                    if (isServingOperationLinkPortCreated) {
                        resolve(linkUuid);
                    }
                }
            }
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * @description This function adds a link instance to the links index in ES.
 * @param {String} link an instance of the link
 * @returns {Promise<Object>} { took }
 **/
async function addLinkAsync(link) {
   link = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(link);
   let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
   let client = await elasticsearchService.getClient(true, esUuid);
   let indexAlias = await getIndexAliasAsync(esUuid);
   let startTime = process.hrtime();
   let res = await client.index({
       index: indexAlias,
       body: link
   });
   let backendTime = process.hrtime(startTime);
   if (res && res.body.result !== 'created') {
       throw new Error("Link was not added to ES.");
   }
   return {
       "link": link,
       "took": (backendTime[0] * 1000 + backendTime[1] / 1000000)
   };
}

/**
 * @description Retrieves output link-port object from link, where
 * where input link-ports contain given operation-client UUID.
 * @param {String} operationClientUuid
 * @returns {Promise<Object>} output link-port
 */
exports.getOutputLinkPortFromInputLinkPortUuidAsync = async function (operationClientUuid) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
        index: indexAlias,
        filter_path: 'hits.hits._source.uuid,hits.hits._source.link-port',
        body: {
            "query": {
                "nested": {
                    "path": "link-port",
                    "query": {
                        "term": {
                            "link-port.logical-termination-point": operationClientUuid
                        }
                    }
                }
            }
        }
    });
    if (Object.keys(res.body).length === 0) {
        return {};
    }
    let correctLink = res.body.hits.hits[0]._source;
    let linkPorts = correctLink['link-port'];
    return linkPorts.find(item => item['port-direction'] === LinkPort.portDirectionEnum.OUTPUT);
}

exports.deleteDependentLinkPorts = async function (uuid) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
        index: indexAlias,
        filter_path: 'hits.hits._id,hits.hits._source',
        body: {
            "query": {
                "nested": {
                    "path": "link-port",
                    "query": {
                        "term": {
                            "link-port.logical-termination-point": uuid
                        }
                    }
                }
            }
        }
    });
    if (Object.keys(res.body).length === 0) {
        return;
    }
    let linkPorts = res.body.hits.hits[0]._source[onfAttributes.LINK.LINK_PORT];
    let found = linkPorts.find(linkPort => linkPort[onfAttributes.LINK.LOGICAL_TERMINATION_POINT] === uuid);
    let linkUuid = res.body.hits.hits[0]._source[onfAttributes.GLOBAL_CLASS.UUID];
    if (LinkPort.portDirectionEnum.INPUT === found[onfAttributes.LINK.PORT_DIRECTION]) {
        deleteLinkPortAsync(linkUuid, found[onfAttributes.LOCAL_CLASS.LOCAL_ID]);
    }
}

/**
 * @description This function returns link given it's link UUID.
 * @param {String} linkUuid Link UUID
 * @returns {Promise<Object>} { link, took }
 **/
exports.getLinkAsync = async function(linkUuid) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
    let client = await elasticsearchService.getClient(true, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
    index: indexAlias,
    filter_path: "took,hits.hits._source",
    body: {
        "query": {
        "term": { "uuid": linkUuid }
        }
    }
    });
    return { "link": res.body.hits.hits[0]._source, "took": res.body.took }
}

/**
 * @description This function returns the link list entries from the core-model-1-4:control-construct
 * @returns {Promise<Object>} { links, took }.
 **/
exports.getLinkListAsync = async function() {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
    let client = await elasticsearchService.getClient(true, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
        index: indexAlias,
        filter_path: "took, hits.hits",
        body: {
            "from": 0,
            "size": 9999,
            "query": {
                "match_all": {}
            }
        }
    });
    let linkList = createResultArray(res);
    return { "links" : linkList, "took" : res.body.took };
}
