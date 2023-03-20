/**
 * This class provides a stub for ONF core-model-1-4:control-construct. 
 * It provides functionality to ,
 *    - read the currently configured attribute values of the core-model-1-4:control-construct
 *    - configure the logical-termination-point and forwarding-domain
 **/

'use strict';

const onfPaths = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfPaths');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const onfFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');
const fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');
const LayerProtocol = require('onf-core-model-ap/applicationPattern/onfModel/models/LayerProtocol');
const {
  elasticsearchService,
  getIndexAliasAsync,
  createResultArray
} = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const ElasticsearchPreparation = require('./ElasticsearchPreparation');

class ControlConstructService {

  /**
   * @description This function returns the link list entries from the core-model-1-4:control-construct
   * @returns {promise} returns link List.
   **/
  static async getLinkListAsync() {
    return new Promise(async function (resolve, reject) {
      try {
        let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
        let client = await elasticsearchService.getClient(true, esUuid);
        let indexAlias = await getIndexAliasAsync(esUuid);
        let res = await client.search({
          index: indexAlias,
          filter_path: "hits.hits",
          body: {
            "query": {
              "match_all": {}
            }
          }

        })
        let linkList = await createResultArray(res);
        resolve(linkList);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @description This function returns the link entries from the core-model-1-4:control-construct
   * @returns {promise} returns link.
   **/
  static async getLinkAsync(linkUuid) {
    return new Promise(async function (resolve, reject) {
      let link;
      try {
        let linkList = await ControlConstructService.getLinkListAsync();
        for (let i = 0; i < linkList.length; i++) {
          let _link = linkList[i];
          let _linkUuid = _link[onfAttributes.GLOBAL_CLASS.UUID];
          if (_linkUuid == linkUuid) {
            link = _link;
          }
        }
        resolve(link);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @description This function returns the forwarding-domain list entries from the core-model-1-4:control-construct
   * @returns {promise} returns ForwardingDomain List.
   **/
  static async getControlConstructListAsync() {
    return new Promise(async function (resolve, reject) {
      try {
        let controlConstructList = await fileOperation.readFromDatabaseAsync(onfPaths.NETWORK_DOMAIN_CONTROL_CONSTRUCT);
        resolve(controlConstructList);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @description This function returns the control-construct from Elasticsearch.
   * @param {String} controlConstructUuid
   * @returns {Promise<Object>} control-construct
   **/
  static async getControlConstructAsync(controlConstructUuid) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
      index: indexAlias,
      filter_path: "hits.hits",
      body: {
        "query": {
          "term": {
            "uuid": controlConstructUuid
          }
        }
      }
    })
    if (Object.keys(res.body.hits.hits).length === 0) {
      throw new Error(`Could not find existing control-construct with UUID ${controlConstructUuid}`);
    }
    let controlConstruct = createResultArray(res);
    return controlConstruct[0];
  }

  /**
   * @description Given any LTP UUID, return its full control-construct.
   * @param {String} ltpUuid
   * @returns {Promise<String>} control-construct
   */
  static async getControlConstructFromLtpUuidAsync(ltpUuid) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
      index: indexAlias,
      filter_path: "hits.hits._source",
      body: {
        "query": {
          "term": {
            "logical-termination-point.uuid": ltpUuid
          }
        }
      }
    })
    if (Object.keys(res.body).length === 0) {
      throw new Error(`Could not find existing control-construct with LTP UUID ${ltpUuid}`);
    }
    let controlConstruct = createResultArray(res);
    return controlConstruct[0];
  }

  /**
   * @description Retrieves Elasticsearch document ID for a specific control-construct.
   * @param {String} controlConstructUuid
   * @returns {Promise<String>} Elasticsearch document ID
   */
  static async getDocumentId(controlConstructUuid) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
      index: indexAlias,
      filter_path: 'hits.hits._id',
      body: {
        "query": {
          "term": {
            "uuid": controlConstructUuid
          }
        }
      }
    });
    if (Object.keys(res.body).length === 0) {
      return undefined;
    }
    return res.body.hits.hits[0]._id;
  }

  /**
   * @description This function returns the logical-termination-point list entries from the core-model-1-4:control-construct that 
   * matches the layerProtocolName
   * @param {String} layerProtocolName : The vaue can be either undefined or any one of the LayerProtocol.layerProtocolNameEnum
   * @returns {promise} returns LogicalTerminationPoint instance List.
   **/
  static async getControlConstructOfTheApplication(applicationName, releaseNumber) {
    return new Promise(async function (resolve, reject) {
      let controlConstructInstance;
      try {
        let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
      index: indexAlias,
      filter_path : "hits.hits",
      body: {
        "query": {
              "bool": {
                "must": [
                 {"match" : { "logical-termination-point.layer-protocol.http-server-interface-1-0:http-server-interface-pac.http-server-interface-capability.application-name": applicationName} },
                {"match" : { "logical-termination-point.layer-protocol.http-server-interface-1-0:http-server-interface-pac.http-server-interface-capability.release-number": releaseNumber} }                 
                  ]
                }
            }
      }
    })
        if (Object.keys(res.body.hits.hits).length === 0) {
          throw new Error(`Could not find existing control-construct with ${applicationName} and ${releaseNumber}`);
        }
        let controlConstructList = await createResultArray(res);
        resolve(controlConstructList[0]);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @description Creates or updates full control-construct in ES.
   * @param {Object} controlConstruct full control-construct
   * @returns {Promise<boolean>} true if create/update succeeded, false if not
   **/
  static async createOrUpdateControlConstructAsync(controlConstruct) {
    let controlConstructUuid = controlConstruct[onfAttributes.GLOBAL_CLASS.UUID];
    let documentId = await ControlConstructService.getDocumentId(controlConstructUuid);
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res;
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
    return Object.keys(res).length !== 0 && (res.result === 'created' || res.result === 'updated');
  }

  /**
   * @description This function deletes a logical-termination-point instance that matches the uuid argument from the 
   * core-model-1-4:control-construct/logical-termination-point
   * @param {String} logicalTerminationPointUuid : the value should be a valid string in the pattern '-\d+-\d+-\d+-(http|tcp|op)-(s|c)-\d{4}$'
   * @returns {promise} returns {true|false}
   **/
  static deleteControlConstructAsync(controlConstructUuid) {
    return new Promise(async function (resolve, reject) {
      let isDeleted = false;
      try {
        let controlConstructPath = onfPaths.NETWORK_DOMAIN_CONTROL_CONSTRUCT + "=" + controlConstructUuid
        isDeleted = await fileOperation.deletefromDatabaseAsync(
          controlConstructPath,
          controlConstructUuid,
          true);
        resolve(isDeleted);
      } catch (error) {
        reject(error);
      }
    });
  }


  /**
   * @description This function adds a link instance to the core-model-1-4:network-control-domain/link
   * @param {String} link an instance of the link
   * @returns {promise} returns {true|false}
   **/
   static addLinkAsync(link) {
    return new Promise(async function (resolve, reject) {
      let isCreated = false;
      try {
        link = onfFormatter.modifyJsonObjectKeysToKebabCase(link)
        let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(true);
        let client = await elasticsearchService.getClient(true, esUuid);
        let indexAlias = await getIndexAliasAsync(esUuid);
        let response = await client.index({
          index: indexAlias,
          body: link
        });
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  }

  static deleteLtp(controlConstruct, ltpToBeRemovedUuid) {
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
   * @returns {Promise<Object>} http-server-capability
   */
  static async findHttpServerCapabilityFromLtpUuid(ltpUuid) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let res = await client.search({
        index: indexAlias,
        filter_path: '**.http-server-interface-capability.application-name,' +
        '**.http-server-interface-capability.release-number',
        body: {
            "query": {
            "term": {"logical-termination-point.uuid": ltpUuid}
            }
        }
    });
    if (Object.keys(res.body).length === 0) {
        throw new Error('Http server capability not found!');
    }
    let filteredLtps = res.body.hits.hits[0]._source['logical-termination-point'];
    for (let ltp of filteredLtps) {
        let layerProtocol = ltp[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
        if (onfAttributes.LAYER_PROTOCOL.HTTP_SERVER_INTERFACE_PAC in layerProtocol) {
            return layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_SERVER_INTERFACE_PAC][onfAttributes.HTTP_SERVER.CAPABILITY];
        }
    };
  }
}

module.exports = ControlConstructService;