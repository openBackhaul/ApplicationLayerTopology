/**
 * This module provides functionalities to
 *      - manipulate the /core-model-1-4:network-control-domain/link
 *      - create link instance for new connections
 *      - delete link instance for obsolete connections
 **/

'use strict';

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
 * @description This function finds or creates a link. If the consuming application is not specified, it
 * only creates a link with SOURCE part, not with SINK.
 * @param {Object} EndPoints details of the link
 * @return {Promise<Object>} { linkUuid, took }
 **/
exports.findOrCreateLinkForTheEndPointsAsync = async function (EndPoints) {
    let took = 0;
    let link = {};
    let servingEndpointResponse = await getServingOperationUuidAsync(EndPoints);
    took += servingEndpointResponse.took;
    let servingOperationUuid = servingEndpointResponse.servingOperationUuid;

    let consumingEndpointResponse = await getConsumingOperationUuidAsync(EndPoints);
    took += consumingEndpointResponse.took;
    let consumingOperationUuid = consumingEndpointResponse.consumingOperationUuid;

    if (servingOperationUuid) {
        let linkResponse = await getLinkOfTheOperationAsync(servingOperationUuid, LinkPort.portDirectionEnum.OUTPUT);
        link = linkResponse.link;
        took += linkResponse.took;
        let createOrUpdateResponse;
        if (link) {
            createOrUpdateResponse = await updateLinkAsync(link, consumingOperationUuid);
        } else {
            createOrUpdateResponse = await createLinkAsync(consumingOperationUuid, servingOperationUuid);
            link = createOrUpdateResponse.link;
        }
        took += createOrUpdateResponse.took;
    }
    return { "linkUuid": link[onfAttributes.GLOBAL_CLASS.UUID], "took": took };
}

/**
 * @description This function deletes a operation client from the link 
 * @param {String} EndPoints : EndPoint details of the link
 * @return {Promise<Objec>} { linkUuid, took }
 **/
exports.deleteOperationClientFromTheEndPointsAsync = async function (EndPoints) {
    let linkUuid;
    let took = 0;

    let servingEndpointResponse = await getServingOperationUuidAsync(EndPoints);
    took += servingEndpointResponse.took;
    let servingOperationUuid = servingEndpointResponse.servingOperationUuid;

    let consumingEndpointResponse = await getConsumingOperationUuidAsync(EndPoints);
    took += consumingEndpointResponse.took;
    let consumingOperationUuid = consumingEndpointResponse.consumingOperationUuid;

    if (servingOperationUuid && consumingOperationUuid) {
        let linkResponse = await getLinkOfTheOperationAsync(servingOperationUuid, LinkPort.portDirectionEnum.OUTPUT);
        let link = linkResponse.link;
        took += linkResponse.took;
        linkUuid = link[onfAttributes.GLOBAL_CLASS.UUID];
        if (link) {
            let localId = Link.getLocalIdOfTheConsumingOperation(link, consumingOperationUuid)
            if (localId) {
                let deleteResponse = await Link.deleteLinkPortAsync(linkUuid, localId);
                took += deleteResponse.took;
            }
        }
    }
    return { "linkUuid": linkUuid, "took": took };
}

async function getServingOperationUuidAsync(EndPoints) {
    let servingApplicationName = EndPoints["serving-application-name"];
    let servingApplicationReleaseNumber = EndPoints["serving-application-release-number"];
    let operationName = EndPoints["operation-name"];
    let servingApplicationCCResponse = await ControlConstructService.getControlConstructOfTheApplicationAsync(
        servingApplicationName,
        servingApplicationReleaseNumber);
    if (!servingApplicationCCResponse.controlConstruct) {
        return { "servingOperationUuid": undefined, "took": servingApplicationCCResponse.took };
    }
    let servingOperationUuid = ControlConstructService.getOperationServerUuid(
        servingApplicationCCResponse.controlConstruct,
        operationName);
    return { "servingOperationUuid": servingOperationUuid, "took": servingApplicationCCResponse.took };
}

async function getConsumingOperationUuidAsync(EndPoints) {
    let servingApplicationName = EndPoints["serving-application-name"];
    let servingApplicationReleaseNumber = EndPoints["serving-application-release-number"];
    let operationName = EndPoints["operation-name"];
    let consumingApplicationName = EndPoints["consuming-application-name"];
    let consumingApplicationReleaseNumber = EndPoints["consuming-application-release-number"];
    if (consumingApplicationName === undefined && consumingApplicationReleaseNumber === undefined) {
        return { "consumingOperationUuid": undefined, "took": 0 };
    }
    let consumingApplicationCCResponse = await ControlConstructService.getControlConstructOfTheApplicationAsync(
        consumingApplicationName,
        consumingApplicationReleaseNumber);
    if (!consumingApplicationCCResponse.controlConstruct) {
        return { "consumingOperationUuid": undefined, "took": consumingApplicationCCResponse.took };
    }
    let consumingOperationUuid = ControlConstructService.getOperationClientUuid(
        consumingApplicationCCResponse.controlConstruct,
        operationName,
        servingApplicationName,
        servingApplicationReleaseNumber
    );
    return { "consumingOperationUuid": consumingOperationUuid, "took": consumingApplicationCCResponse.took };
}

/**
 * @description Retrieves link from links, where
 * link-ports contain given operation UUID with the given port direction.
 * @param {String} operationUuid
 * @param {Enumerator} portDirection
 * @returns {Promise<Object>} { link, took }
 */
async function getLinkOfTheOperationAsync(operationUuid, portDirection) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
        index: indexAlias,
        body: {
            "query": {
                "nested": {
                    "path": "link-port",
                    "query": {
                        "term": {
                            "link-port.logical-termination-point": operationUuid
                        }
                    }
                }
            }
        }
    });
    if (res.body.hits.length === 0) {
        return { "took": res.body.took };
    }
    let links = createResultArray(res);
    for (let link of links) {
        let linkPorts = link[onfAttributes.LINK.LINK_PORT];
        let found = linkPorts.find(item => item[onfAttributes.LINK.PORT_DIRECTION] === portDirection &&
            item[onfAttributes.LINK.LOGICAL_TERMINATION_POINT] === operationUuid);
        if (found) {
            return { "link" : link, "took": res.body.took };
        }
    }
    return { "took": res.body.took };
}

/**
 * @description This function updates a link
 * @param {String} link
 * @param {String} consumingOperationuuid : logical-termination-point of the link-port
 * @return {Promise<Object>} { linkPort, took }
 **/
async function updateLinkAsync(link, consumingOperationuuid) {
    let isLinkExistsAsync = isConsumingServiceExists(link, consumingOperationuuid);
    if (!isLinkExistsAsync) {
        let linkLocalId = LinkPort.generateNextLocalId(link);
        let linkPort = {
            [onfAttributes.LOCAL_CLASS.LOCAL_ID] : linkLocalId,
            [onfAttributes.LINK.PORT_DIRECTION] : LinkPort.portDirectionEnum.INPUT,
            [onfAttributes.LINK.LOGICAL_TERMINATION_POINT] : consumingOperationuuid
        };
        return await Link.addLinkPortAsync(link[onfAttributes.GLOBAL_CLASS.UUID], linkPort);
    }
    return { "took": 0 };
}

function isConsumingServiceExists(link, consumingOperationUuid) {
    let linkPortList = link[onfAttributes.LINK.LINK_PORT];
    for (let linkPort of linkPortList) {
        let linkPortLogicalTerminationPoint = linkPort[onfAttributes.LINK.LOGICAL_TERMINATION_POINT];
        let portDirection = linkPort[onfAttributes.LINK.PORT_DIRECTION];
        if (portDirection === LinkPort.portDirectionEnum.INPUT
            && linkPortLogicalTerminationPoint === consumingOperationUuid) {
            return true;
        }
    }
    return false;
}

/**
 * @description This function creates a link
 * @param {String} servingOperationuuid : logical-termination-point of the link-port
 * @param {String} consumingOperationuuid : logical-termination-point of the link-port
 * @return {Promise<Object>} { link, took }
 **/
async function createLinkAsync(consumingOperationUuid, servingOperationUuid) {
    let linkUuid = await uuidv4();
    let link = {
        [onfAttributes.GLOBAL_CLASS.UUID]: linkUuid,
        [onfAttributes.LINK.LINK_PORT]: []
    };
    if (consumingOperationUuid !== undefined) {
        let consumingOperationLocalId = LinkPort.generateNextLocalId(link);
        let consumingOperationLinkPort = {
            [onfAttributes.LOCAL_CLASS.LOCAL_ID] : consumingOperationLocalId,
            [onfAttributes.LINK.PORT_DIRECTION] : LinkPort.portDirectionEnum.INPUT,
            [onfAttributes.LINK.LOGICAL_TERMINATION_POINT] : consumingOperationUuid
        };
        link[onfAttributes.LINK.LINK_PORT].push(consumingOperationLinkPort);
    }
    let servingOperationLocalId = LinkPort.generateNextLocalId(link);
    let servingOperationLinkPort = {
        [onfAttributes.LOCAL_CLASS.LOCAL_ID] : servingOperationLocalId,
        [onfAttributes.LINK.PORT_DIRECTION] : LinkPort.portDirectionEnum.OUTPUT,
        [onfAttributes.LINK.LOGICAL_TERMINATION_POINT] : servingOperationUuid
    };
    link[onfAttributes.LINK.LINK_PORT].push(servingOperationLinkPort);
    return await addLinkAsync(link);
}

/**
 * @description This function adds a link instance to the links index in ES.
 * @param {String} link
 * @returns {Promise<Object>} { link, took }
 **/
async function addLinkAsync(link) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
    let client = await elasticsearchService.getClient(true, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let startTime = process.hrtime();
    let res = await client.index({
        index: indexAlias,
        refresh: true,
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
 * @returns {Promise<Object>} { linkPort, took }
 */
exports.getOutputLinkPortFromInputLinkPortUuidAsync = async function (operationClientUuid) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
        index: indexAlias,
        filter_path: 'took,hits.hits._source.uuid,hits.hits._source.link-port',
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
    // if there is no hits , then response body will not contains a hit. So this shall be also considered as hits with 0 length 
    if (res.body.hits == undefined || res.body.hits.length === 0) {
        return { took: res.body.took };
    }
    let correctLink = res.body.hits.hits[0]._source;
    let linkPorts = correctLink[onfAttributes.LINK.LINK_PORT];
    let found = linkPorts.find(item => item[onfAttributes.LINK.PORT_DIRECTION] === LinkPort.portDirectionEnum.OUTPUT);
    return { "linkPort" : found, "took": res.body.took };
}

/**
 * @description Finds and removes link-ports where given LTP UUID is listed
 * as INPUT link-port.
 * @param {String} ltpUuid LTP UUID
 * @returns {Promise<Object>} { took }
 */
exports.deleteDependentLinkPortsAsync = async function (ltpUuid) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
        index: indexAlias,
        filter_path: 'took,hits.hits._id,hits.hits._source',
        body: {
            "query": {
                "nested": {
                    "path": "link-port",
                    "query": {
                        "term": {
                            "link-port.logical-termination-point": ltpUuid
                        }
                    }
                }
            }
        }
    });
    if (res.body.hits == undefined || res.body.hits.length === 0) {
        return { "took" : res.body.took };
    }
    let took = res.body.took;
    let linkPorts = res.body.hits.hits[0]._source[onfAttributes.LINK.LINK_PORT];
    let found = linkPorts.find(linkPort => linkPort[onfAttributes.LINK.LOGICAL_TERMINATION_POINT] === ltpUuid);
    let linkUuid = res.body.hits.hits[0]._source[onfAttributes.GLOBAL_CLASS.UUID];
    if (LinkPort.portDirectionEnum.INPUT === found[onfAttributes.LINK.PORT_DIRECTION]) {
        let deleteResponse = await Link.deleteLinkPortAsync(linkUuid, found[onfAttributes.LOCAL_CLASS.LOCAL_ID]);
        took += deleteResponse.took;
    }
    return { "took" : took };
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
 * @returns {Promise<Object>} { links, took }
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
