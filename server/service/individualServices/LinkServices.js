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
    elasticsearchService,
    getIndexAliasAsync
  } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const ElasticsearchPreparation = require('./ElasticsearchPreparation');

/**
 * @description This function find or create a link
 * @param {object} EndPoints : EndPoint details of the link
 * @return {Promise} String {uuid}
 **/
exports.findOrCreateLinkForTheEndPointsAsync = function (EndPoints) {
    return new Promise(async function (resolve, reject) {
        let linkUuid;
        try {

            let servingApplicationName = EndPoints["serving-application-name"];
            let servingApplicationReleaseNumber = EndPoints["serving-application-release-number"];
            let operationName = EndPoints["operation-name"];
            let consumingApplicationName = EndPoints["consuming-application-name"];
            let consumingApplicationReleaseNumber = EndPoints["consuming-application-release-number"];

            let ServingApplicationControlConstruct = await ControlConstructService.getControlConstructOfTheApplication(
                servingApplicationName,
                servingApplicationReleaseNumber);
            let consumingApplicationControlConstruct = await ControlConstructService.getControlConstructOfTheApplication(
                consumingApplicationName,
                consumingApplicationReleaseNumber);

            if (ServingApplicationControlConstruct && consumingApplicationControlConstruct) {
                let servingOperationuuid = getOperationServerUuid(
                    ServingApplicationControlConstruct,
                    operationName);
                let consumingOperationuuid = getOperationClientUuid(
                    consumingApplicationControlConstruct,
                    operationName,
                    servingApplicationName,
                    servingApplicationReleaseNumber
                );
                if (servingOperationuuid && consumingOperationuuid) {
                    linkUuid = await createOrUpdateLinkAsync(consumingOperationuuid, servingOperationuuid)
                }
            }
            resolve(linkUuid);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * @description This function deletes a operation client from the link 
 * @param {String} EndPoints : EndPoint details of the link
 * @return {Promise} boolean {true | false}
 **/
 exports.deleteOperationClientFromTheEndPointsAsync = function (EndPoints) {
    return new Promise(async function (resolve, reject) {
        let linkUuid;
        try {

            let servingApplicationName = EndPoints["serving-application-name"];
            let servingApplicationReleaseNumber = EndPoints["serving-application-release-number"];
            let operationName = EndPoints["operation-name"];
            let consumingApplicationName = EndPoints["consuming-application-name"];
            let consumingApplicationReleaseNumber = EndPoints["consuming-application-release-number"];

            let ServingApplicationControlConstruct = await ControlConstructService.getControlConstructOfTheApplication(
                servingApplicationName,
                servingApplicationReleaseNumber);
            let consumingApplicationControlConstruct = await ControlConstructService.getControlConstructOfTheApplication(
                consumingApplicationName,
                consumingApplicationReleaseNumber);

            if (ServingApplicationControlConstruct && consumingApplicationControlConstruct) {
                let servingOperationuuid = getOperationServerUuid(
                    ServingApplicationControlConstruct,
                    operationName);
                let consumingOperationuuid = getOperationClientUuid(
                    consumingApplicationControlConstruct,
                    operationName,
                    servingApplicationName,
                    servingApplicationReleaseNumber
                );
                if (servingOperationuuid && consumingOperationuuid) {
                    linkUuid = await Link.getLinkUuidOfTheServingOperationAsync(servingOperationuuid);
                    if(linkUuid){
                        await deleteLinkAsync(linkUuid,consumingOperationuuid);
                    }
                }
            }
            resolve(linkUuid);
        } catch (error) {
            reject(error);
        }
    });
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
        await Link.deleteLinkPortAsync(linkUuid,localId);
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
 * @description This function creates or updates a link
 * @param {String} servingOperationuuid : logical-termination-point of the link-port
 * @param {String} consumingOperationuuid : logical-termination-point of the link-port
 * @return {Promise} string {uuid}
 **/
function createOrUpdateLinkAsync(consumingOperationuuid, servingOperationuuid) {
    return new Promise(async function (resolve, reject) {
        try {
            let linkUuid = await Link.getLinkUuidOfTheServingOperationAsync(servingOperationuuid);
            if (linkUuid) {
                await updateLinkAsync(linkUuid, consumingOperationuuid)
            } else {
                linkUuid = await createLinkAsync(consumingOperationuuid, servingOperationuuid)
            }
            resolve(linkUuid);
        } catch (error) {
            reject(error);
        }
    });
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
            let linkUuid = await Link.generateNextUuidAsync();
            let link = new Link(linkUuid, []);
            let isLinkCreated = await ControlConstructService.addLinkAsync(link);
            if (isLinkCreated) {
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
                    if(isServingOperationLinkPortCreated){
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
 * Provides operationServerUuid for the operationServerName
 * @param {*} controlConstruct complete control-construct instance
 * @param {*} operationServerName operation name of the operation Server
 * @returns operationServeruuid
 */
function getOperationServerUuid(controlConstruct, operationServerName) {
    let operationServerUuid;
    try {
        let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
        for (let i = 0; i < logicalTerminationPointList.length; i++) {
            let logicalTerminationPoint = logicalTerminationPointList[i];
            let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
            let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
            if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.OPERATION_SERVER) {
                let operationServerInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.OPERATION_SERVER_INTERFACE_PAC];
                let operationServerCapability = operationServerInterfacePac[onfAttributes.OPERATION_SERVER.CAPABILITY];
                let operationName = operationServerCapability[onfAttributes.OPERATION_SERVER.OPERATION_NAME];
                if (operationName == operationServerName) {
                    operationServerUuid = logicalTerminationPoint[onfAttributes.GLOBAL_CLASS.UUID];
                }
            }
        }
        return operationServerUuid;
    } catch (error) {
        console.log(error)
    }
}

/**
 * Provides operationClientUuid for the operationClientName
 * @param {*} controlConstruct complete control-construct instance
 * @param {*} operationClientName operation name of the operation client
 * @returns operationClientUuid
 */
function getOperationClientUuid(controlConstruct, operationClientName, consumingApplicationName, consumingApplicationReleaseNumber) {
    let operationClientUuid;
    try {
        let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
        for (let i = 0; i < logicalTerminationPointList.length; i++) {
            let logicalTerminationPoint = logicalTerminationPointList[i];
            let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
            let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
            if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.OPERATION_CLIENT) {
                let operationClientInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.OPERATION_CLIENT_INTERFACE_PAC];
                let operationClientConfiguration = operationClientInterfacePac[onfAttributes.OPERATION_CLIENT.CONFIGURATION];
                let operationName = operationClientConfiguration[onfAttributes.OPERATION_CLIENT.OPERATION_NAME];
                if (operationName == operationClientName) {
                    let _operationClientUuid = logicalTerminationPoint[onfAttributes.GLOBAL_CLASS.UUID];
                    let applicationName = getApplicationName(logicalTerminationPointList,
                        _operationClientUuid);
                    let releaseNumber = getReleaseNumber(logicalTerminationPointList,
                        _operationClientUuid);
                    if (applicationName == consumingApplicationName && releaseNumber == consumingApplicationReleaseNumber) {
                        operationClientUuid = _operationClientUuid;
                    }
                }
            }
        }
        return operationClientUuid;
    } catch (error) {
        console.log(error)
    }
}

/**
 * This function returns the list of clients information reacting on the operation server 
 * @param {*} controlConstruct 
 * @param {*} operationClientsUuidsReactingOnOperationServerList 
 * @returns object in the form of {addressedApplicationName:"name",
 * addressedApplicationReleaseNumber:"0.0.1" ,addressedOperationName:"/v1/service1"}
 */
 function getApplicationName(logicalTerminationPointList,
    operationClientUuid) {
    let applicationName;
    try {
      for (let i = 0; i < logicalTerminationPointList.length; i++) {
        let logicalTerminationPoint = logicalTerminationPointList[i];
        let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
        let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
        if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.HTTP_CLIENT) {
          let clientLtpList = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.CLIENT_LTP];
          if (clientLtpList.includes(operationClientUuid)) {
            let httpClientInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_CLIENT_INTERFACE_PAC];
            let httpClientCapability = httpClientInterfacePac[onfAttributes.HTTP_CLIENT.CAPABILITY];
            applicationName = httpClientCapability[onfAttributes.HTTP_CLIENT.APPLICATION_NAME];
          }
        }
      }
      return applicationName;
    } catch (error) {
      console.log(error)
    }
  }
  
  /**
   * This function returns the list of clients information reacting on the operation server 
   * @param {*} controlConstruct 
   * @param {*} operationClientsUuidsReactingOnOperationServerList 
   * @returns object in the form of {addressedApplicationName:"name",
   * addressedApplicationReleaseNumber:"0.0.1" ,addressedOperationName:"/v1/service1"}
   */
  function getReleaseNumber(logicalTerminationPointList,
    operationClientUuid) {
    let releaseNumber;
    try {
      for (let i = 0; i < logicalTerminationPointList.length; i++) {
        let logicalTerminationPoint = logicalTerminationPointList[i];
        let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
        let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
        if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.HTTP_CLIENT) {
          let clientLtpList = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.CLIENT_LTP];
          if (clientLtpList.includes(operationClientUuid)) {
            let httpClientInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_CLIENT_INTERFACE_PAC];
            let httpClientConfiguration = httpClientInterfacePac[onfAttributes.HTTP_CLIENT.CONFIGURATION];
            releaseNumber = httpClientConfiguration[onfAttributes.HTTP_CLIENT.RELEASE_NUMBER];
          }
        }
      }
      return releaseNumber;
    } catch (error) {
      console.log(error)
    }
  }
}

/**
 * @description Retrieves output link-port object from link, where
 * where input link-ports contain given operation-client UUID.
 * @param {String} operationClientUuid
 * @returns {Promise<Object>} output link-port
 */
exports.getOutputLinkPortFromInputLinkPortUuidAsync = async function(operationClientUuid) {
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
                        "term": { "link-port.logical-termination-point": operationClientUuid }
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

exports.deleteDependentLinkPorts = async function(uuid) {
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
            "term": { "link-port.logical-termination-point": uuid }
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

