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
        let linkList = await fileOperation.readFromDatabaseAsync(onfPaths.LINK);
        resolve(linkList);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @description This function deletes a link instance that matches the localId argument from its corresponding 
   * core-model-1-4:control-construct/link
   * @param {String} linkUuid : uuid of the link
   * @returns {promise} boolean {true|false}
   **/
  static async deleteLinkAsync(linkUuid) {
    return new Promise(async function (resolve, reject) {
      let isDeleted = false;
      try {
        let linkPath = onfPaths.LINK +
          "=" +
          linkUuid;
        isDeleted = await fileOperation.deletefromDatabaseAsync(
          linkPath,
          linkPath,
          true);
        resolve(isDeleted);
      } catch (error) {
        reject(false);
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
    if (Object.keys(res.body).length === 0) {
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
        let controlConstructList = await ControlConstructService.getControlConstructListAsync()
        if (controlConstructList) {
          for (let i = 0; i < controlConstructList.length; i++) {
            let controlConstruct = controlConstructList[i];
            let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
            for (let j = 0; j < logicalTerminationPointList.length; j++) {
              let logicalTerminationPoint = logicalTerminationPointList[j];
              let layerProtocolList = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL]
              let layerProtocol = layerProtocolList[0];
              let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
              if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.HTTP_SERVER) {
                let httpServerPac = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_SERVER_INTERFACE_PAC];
                let httpServerCapability = httpServerPac[onfAttributes.HTTP_SERVER.CAPABILITY];
                let _applicationName = httpServerCapability[onfAttributes.HTTP_SERVER.APPLICATION_NAME];
                let _releaseNumber = httpServerCapability[onfAttributes.HTTP_SERVER.RELEASE_NUMBER];
                if (_applicationName == applicationName && _releaseNumber == releaseNumber) {
                  controlConstructInstance = controlConstruct;
                }
              }
            }
          }
          resolve(controlConstructInstance);
        } else {
          resolve(controlConstructInstance);
        }
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
        link = onfFormatter.modifyJsonObjectKeysToKebabCase(link);
        isCreated = await fileOperation.writeToDatabaseAsync(
          onfPaths.LINK,
          link,
          true);
        resolve(isCreated);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @description This function deletes a link instance that matches the uuid argument from the 
   * core-model-1-4:network-control-domain/link
   * @param {String} linkUuid : uuid of the link
   * @returns {promise} returns {true|false}
   **/
  static deleteLinkAsync(linkUuid) {
    return new Promise(async function (resolve, reject) {
      let isDeleted = false;
      try {
        let linkPath = onfPaths.LINK + "=" + linkUuid;
        isDeleted = await fileOperation.deletefromDatabaseAsync(
          linkPath,
          linkUuid,
          true);
        resolve(isDeleted);
      } catch (error) {
        reject(error);
      }
    });
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