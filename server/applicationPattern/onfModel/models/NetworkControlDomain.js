/**
 * This class provides a stub for ONF core-model-1-4:control-construct. 
 * It provides functionality to ,
 *    - read the currently configured attribute values of the core-model-1-4:control-construct
 *    - configure the logical-termination-point and forwarding-domain
 **/

'use strict';

const onfPaths = require('../constants/OnfPaths');
const onfAttributes = require('../constants/OnfAttributes');
const onfFormatter = require('../utility/OnfAttributeFormatter');
const fileOperation = require('../../databaseDriver/JSONDriver');
const LayerProtocol = require('./LayerProtocol');
const {
  elasticsearchService,
  getIndexAliasAsync
} = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');

class NetworkControlDomain {

  /**
   * @description This function returns the link list entries from the core-model-1-4:control-construct
   * @returns {promise} returns link List.
   **/
  static async getLinkListAsync() {
    return new Promise(async function (resolve, reject) {
      try {
        let client = await elasticsearchService.getClient();
        let indexAlias = await getIndexAliasAsync("alt-2-0-1-es-c-es-1-0-0-001");
        let res = await client.search({
          index: indexAlias,
          filter_path: "hits.hits",
          body: {
            "query": {
              "match_all": {}
            }
          }

        })
        resolve(res.body.hits.hits);
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
        let linkList = await NetworkControlDomain.getLinkListAsync();
        for (let i = 0; i < linkList.length; i++) {
          let _link = linkList[i]._source;
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
   * @description This function returns the forwarding-domain list entries from the core-model-1-4:control-construct
   * @returns {promise} returns ForwardingDomain List.
   **/
  static async getControlConstructAsync(controlConstructUuid) {
    return new Promise(async function (resolve, reject) {
      try {
        let client = await elasticsearchService.getClient();
        let indexAlias = await getIndexAliasAsync("alt-2-0-1-es-c-es-1-0-0-000");
        let res = await client.search({
          index: indexAlias,
          filter_path: "hits.hits",
          body: {
            "query": {
              "match": {
                "uuid": controlConstructUuid
              }
            }
          }

        })
        resolve(res.body.hits.hits[0]);
      } catch (error) {
        reject(error);
      }
    });
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
        let client = await elasticsearchService.getClient();
        let indexAlias = await getIndexAliasAsync("alt-2-0-1-es-c-es-1-0-0-000");
        let res = await client.search({
          index: indexAlias,
          filter_path: "hits.hits",
          body: {
            "query": {
              "match_all": {}
            }
          }

        })
        let controlConstructList = res.body.hits.hits;
        if (controlConstructList) {
          for (let i = 0; i < controlConstructList.length; i++) {
            let controlConstruct = controlConstructList[i]._source;
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
   * @description This function adds a logical-termination-point instance to the core-model-1-4:control-construct/logical-termination-point
   * @param {String} logicalTerminationPoint an instance of the LogicalTerminationPoint
   * @returns {promise} returns {true|false}
   **/
  static addControlConstructAsync(controlConstruct) {
    return new Promise(async function (resolve, reject) {
      let isCreated = false;
      try {
        controlConstruct = onfFormatter.modifyJsonObjectKeysToKebabCase(controlConstruct);
        isCreated = await fileOperation.writeToDatabaseAsync(
          onfPaths.NETWORK_DOMAIN_CONTROL_CONSTRUCT,
          controlConstruct,
          true);
        resolve(isCreated);
      } catch (error) {
        reject(error);
      }
    });
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
  static addLinkAsync(link, consumingOperationLinkPort, servingOperationLinkPort) {
    return new Promise(async function (resolve, reject) {
      let isCreated = false;
      try {
        link = onfFormatter.modifyJsonObjectKeysToKebabCase(link);
        let client = await elasticsearchService.getClient();
        let indexAlias = await getIndexAliasAsync("alt-2-0-1-es-c-es-1-0-0-001");
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

}

module.exports = NetworkControlDomain;