/**
 * This class provides a stub for ONF core-model-1-4:control-construct. 
 * It provides functionality to ,
 *    - read the currently configured attribute values of the core-model-1-4:control-construct
 *    - configure the logical-termination-point and forwarding-domain
 **/

'use strict';

const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const LayerProtocol = require('onf-core-model-ap/applicationPattern/onfModel/models/LayerProtocol');
const {
  elasticsearchService,
  getIndexAliasAsync,
  createResultArray
} = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const ElasticsearchPreparation = require('./ElasticsearchPreparation');

class ControlConstructService {

  /**
   * @description This function returns the control-construct from Elasticsearch.
   * @param {String} controlConstructUuid
   * @returns {Promise<Object>} { controlConstruct, took }
   **/
  static async getControlConstructAsync(controlConstructUuid) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
      index: indexAlias,
      filter_path: "took, hits.hits",
      body: {
        "query": {
          "term": {
            "uuid": controlConstructUuid
          }
        }
      }
    })
    if (res.body.hits === undefined) {
      console.log(`Could not find existing control-construct with UUID ${controlConstructUuid}`);
      return { "took": res.body.took };
    }
    let controlConstruct = createResultArray(res);
    return { "controlConstruct": controlConstruct[0], "took": res.body.took };
  }

  /**
   * @description Given any LTP UUID, return its full control-construct.
   * @param {String} ltpUuid
   * @returns {Promise<Object>} { controlConstruct, took }
   */
  static async getControlConstructFromLtpUuidAsync(ltpUuid) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
      index: indexAlias,
      filter_path: "took,hits.hits._source",
      body: {
        "query": {
          "term": {
            "logical-termination-point.uuid": ltpUuid
          }
        }
      }
    });
    if (res.body.hits === undefined) {
      console.log(`Could not find existing control-construct with LTP UUID ${ltpUuid}`);
      return { "took" : res.body.took };
    }
    let controlConstruct = createResultArray(res);
    return { "controlConstruct" : controlConstruct[0], "took" : res.body.took };
  }

  /**
   * @description Retrieves Elasticsearch document ID for a specific control-construct.
   * @param {String} controlConstructUuid
   * @returns {Promise<Object>} { id, took }
   */
  static async getDocumentIdAsync(controlConstructUuid) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
      index: indexAlias,
      filter_path: "took,hits.hits._id",
      body: {
        "query": {
          "term": {
            "uuid": controlConstructUuid
          }
        }
      }
    });
    if (res.body.hits === undefined) {
      return { "took" : res.body.took };
    }
    return { "id": res.body.hits.hits[0]._id, "took" : res.body.took }
  }

  /**
   * @description This function returns control-construct for given application name and release number.
   * @param {String} applicationName
   * @param {String} releaseNumber
   * @returns {Promise<Object>} { controlConstruct, took }
   **/
  static async getControlConstructOfTheApplicationAsync(applicationName, releaseNumber) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
      index: indexAlias,
      filter_path: "took,hits.hits",
      body: {
        "query": {
          "bool": {
            "must": [
              {
                "match": {
                  "logical-termination-point.layer-protocol.http-server-interface-1-0:http-server-interface-pac.http-server-interface-capability.application-name": applicationName
                }
              },
              {
                "match": {
                  "logical-termination-point.layer-protocol.http-server-interface-1-0:http-server-interface-pac.http-server-interface-capability.release-number": releaseNumber
                }
              }
            ]
          }
        }
      }
    })
    if (res.body.hits.hits.length === 0) {
      console.log(`Could not find existing control-construct with ${applicationName} and ${releaseNumber}`);
      return { "took": res.body.took };
    }
    let controlConstruct = createResultArray(res);
    return { "controlConstruct": controlConstruct[0], "took": res.body.took };
  }

  /**
   * @description Creates or updates full control-construct in ES.
   * @param {Object} controlConstruct full control-construct
   * @returns {Promise<Object>} { took }
   **/
  static async createOrUpdateControlConstructAsync(controlConstruct) {
    let controlConstructUuid = controlConstruct[onfAttributes.GLOBAL_CLASS.UUID];
    let documentIdResponse = await ControlConstructService.getDocumentIdAsync(controlConstructUuid);
    let documentId = documentIdResponse.id;
    let took = documentIdResponse.took;
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res;
    let startTime = process.hrtime();
    if (documentId) {
      res = await client.index({
        index: indexAlias,
        id: documentId,
        body: controlConstruct
      });
    } else {
      res = await client.index({
        index: indexAlias,
        body: controlConstruct
      });
    }
    let backendTime = process.hrtime(startTime);
    let intermitent = (backendTime[0] * 1000 + backendTime[1] / 1000000);
    if (res.body.result === 'created' || res.body.result === 'updated') {
      return { "took": took + intermitent };
    }
  }

  static deleteLtpFromCCObject(controlConstruct, ltpToBeRemovedUuid) {
    let ltps = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
    let ltpToBeRemovedIndex = ltps.findIndex(ltp => ltp[onfAttributes.GLOBAL_CLASS.UUID] === ltpToBeRemovedUuid);
    ltps.splice(ltpToBeRemovedIndex, 1);
    ltps.forEach(ltp => {
      let clientLtps = ltp[onfAttributes.LOGICAL_TERMINATION_POINT.CLIENT_LTP];
      if (clientLtps.length !== 0) {
        let clientLtpIndex = clientLtps.findIndex(clientLtp => clientLtp === ltpToBeRemovedUuid);
        if (clientLtpIndex !== -1) {
          clientLtps.splice(clientLtpIndex, 1);
        }
      }
    });
    ltps.forEach(ltp => {
      let serverLtps = ltp[onfAttributes.LOGICAL_TERMINATION_POINT.SERVER_LTP];
      if (serverLtps.length !== 0) {
        let serverLtpIndex = serverLtps.findIndex(serverLtp =>serverLtp === ltpToBeRemovedUuid);
        if (serverLtpIndex !== -1) {
          serverLtps.splice(serverLtpIndex, 1);
        }
      }
    })
    return controlConstruct;
  }

  /**
   * @description Given any LTP uuid from any control-construct, find proper control-construct
   * and extract http-server-capability (this contains application-name and release-number).
   * @param {String} ltpUuid
   * @returns {Promise<Object>} { http-server-capability, took }
   */
  static async findHttpServerCapabilityFromLtpUuidAsync(ltpUuid) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
        index: indexAlias,
        filter_path: 'took,**.http-server-interface-capability.application-name,' +
        '**.http-server-interface-capability.release-number',
        body: {
            "query": {
            "term": {"logical-termination-point.uuid": ltpUuid}
            }
        }
    });
    if (res.body.hits.length === 0) {
        throw new Error('Http server capability not found!');
    }
    let filteredLtps = res.body.hits.hits[0]._source['logical-termination-point'];
    for (let ltp of filteredLtps) {
        let layerProtocol = ltp[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
        if (onfAttributes.LAYER_PROTOCOL.HTTP_SERVER_INTERFACE_PAC in layerProtocol) {
          let httpServerCapability = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_SERVER_INTERFACE_PAC][onfAttributes.HTTP_SERVER.CAPABILITY];
            return { "httpServerCapability": httpServerCapability, "took": res.body.took };
        }
    };
    return { "took": res.body.took };
  }

  /**
   * This function returns application name from http server LT in given control construct.
   * @param {Object} controlConstruct
   * @returns {String|undefined} applicationName
   */
  static getApplicationName(controlConstruct) {
    let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
    for (let logicalTerminationPoint of logicalTerminationPointList) {
      let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
      let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
      if (layerProtocolName === LayerProtocol.layerProtocolNameEnum.HTTP_SERVER) {
        let httpServerInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_SERVER_INTERFACE_PAC];
        let httpServerCapability = httpServerInterfacePac[onfAttributes.HTTP_SERVER.CAPABILITY];
        return httpServerCapability[onfAttributes.HTTP_SERVER.APPLICATION_NAME];
      }
    }
    return undefined;
  }

  /**
   * This function return application name from http server LT in given control construct.
   * @param {String} controlConstruct
   * @returns {String|undefined} releaseNumber
   */
  static getReleaseNumber(controlConstruct) {
    let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
    for (let i = 0; i < logicalTerminationPointList.length; i++) {
      let logicalTerminationPoint = logicalTerminationPointList[i];
      let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
      let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
      if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.HTTP_SERVER) {
        let httpServerInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_SERVER_INTERFACE_PAC];
        let httpServerCapability = httpServerInterfacePac[onfAttributes.HTTP_SERVER.CAPABILITY];
        return httpServerCapability[onfAttributes.HTTP_SERVER.RELEASE_NUMBER];
      }
    }
    return undefined;
  }

  /**
   * Provides operationServerUuid for the operationServerName.
   * @param {Object} controlConstruct complete control-construct instance
   * @param {String} operationServerName operation name of the operation Server
   * @returns {String|undefined} operationServerUuid
   */
  static getOperationServerUuid(controlConstruct, operationServerName) {
    let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
    for (let logicalTerminationPoint of logicalTerminationPointList) {
      let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
      let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
      if (layerProtocolName === LayerProtocol.layerProtocolNameEnum.OPERATION_SERVER) {
        let operationServerInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.OPERATION_SERVER_INTERFACE_PAC];
        let operationServerCapability = operationServerInterfacePac[onfAttributes.OPERATION_SERVER.CAPABILITY];
        let operationName = operationServerCapability[onfAttributes.OPERATION_SERVER.OPERATION_NAME];
        if (operationName === operationServerName) {
          return logicalTerminationPoint[onfAttributes.GLOBAL_CLASS.UUID];
        }
      }
    }
    return undefined;
  }

  /**
   * This function returns http-client configuration for operation-client UUID.
   * @param {Object} logicalTerminationPointList
   * @param {String} operationClientUuid
   * @returns {Object|undefined} httpClientConfiguration
   */
  static findHttpClientConfiguration(logicalTerminationPointList, operationClientUuid) {
    for (let logicalTerminationPoint of logicalTerminationPointList) {
      let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
      let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
      if (layerProtocolName === LayerProtocol.layerProtocolNameEnum.HTTP_CLIENT) {
        let clientLtpList = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.CLIENT_LTP];
        if (clientLtpList.includes(operationClientUuid)) {
          let httpClientInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_CLIENT_INTERFACE_PAC];
          return httpClientInterfacePac[onfAttributes.HTTP_CLIENT.CONFIGURATION];
        }
      }
    }
    return undefined;
  }

  /**
   * Provides operationClientUuid for the operationClientName.
   * @param {Object} controlConstruct complete control-construct instance
   * @param {String} operationClientName operation name of the operation client
   * @returns {String|undefined} operationClientUuid
   */
  static getOperationClientUuid(controlConstruct, operationClientName, consumingApplicationName, consumingApplicationReleaseNumber) {
    let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
    for (let logicalTerminationPoint of logicalTerminationPointList) {
      let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
      let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
      if (layerProtocolName === LayerProtocol.layerProtocolNameEnum.OPERATION_CLIENT) {
        let operationClientInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.OPERATION_CLIENT_INTERFACE_PAC];
        let operationClientConfiguration = operationClientInterfacePac[onfAttributes.OPERATION_CLIENT.CONFIGURATION];
        let operationName = operationClientConfiguration[onfAttributes.OPERATION_CLIENT.OPERATION_NAME];
        if (operationName === operationClientName) {
          let _operationClientUuid = logicalTerminationPoint[onfAttributes.GLOBAL_CLASS.UUID];
          let httpClientConfiguration = this.findHttpClientConfiguration(logicalTerminationPointList, _operationClientUuid);
          if (httpClientConfiguration) {
            let applicationName = httpClientConfiguration[onfAttributes.HTTP_CLIENT.APPLICATION_NAME];
            let releaseNumber = httpClientConfiguration[onfAttributes.HTTP_CLIENT.RELEASE_NUMBER];
            if (applicationName === consumingApplicationName && releaseNumber === consumingApplicationReleaseNumber) {
              return _operationClientUuid;
            }
          }
        }
      }
    }
    return undefined;
  }
}

module.exports = ControlConstructService;
