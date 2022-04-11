/**
 * This module provides functionalities to
 *      - manipulate the /core-model-1-4:network-control-domain/link
 *      - create link instance for new connections
 *      - delete link instance for obsolete connections
 **/

'use strict';

const LayerProtocol = require('../models/LayerProtocol');
const Link = require('../models/Link');
const NetworkControlDomain = require('../models/NetworkControlDomain');
const onfAttributes = require('../constants/OnfAttributes');
const LinkPort = require('../models/LinkPort');

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

            let ServingApplicationControlConstruct = await NetworkControlDomain.getControlConstructOfTheApplication(
                servingApplicationName,
                servingApplicationReleaseNumber);
            let consumingApplicationControlConstruct = await NetworkControlDomain.getControlConstructOfTheApplication(
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

            let ServingApplicationControlConstruct = await NetworkControlDomain.getControlConstructOfTheApplication(
                servingApplicationName,
                servingApplicationReleaseNumber);
            let consumingApplicationControlConstruct = await NetworkControlDomain.getControlConstructOfTheApplication(
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
 * @description This function deletes a link-port
 * @param {String} linkUuid : uuid of the link
 * @param {String} consumingOperationuuid : logical-termination-point of the link-port
 * @return {Promise} boolean {true|false}
 **/
 function deleteLinkAsync(linkUuid,consumingOperationuuid) {
    return new Promise(async function (resolve, reject) {
        try {
            let localId = await Link.getLocalIdOfTheConsumingOperationAsync(linkUuid,consumingOperationuuid)
            if (localId) {
                await Link.deleteLinkPortAsync(linkUuid,localId);
            }
            resolve(linkUuid);
        } catch (error) {
            reject(error);
        }
    });
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
            let isLinkCreated = await NetworkControlDomain.addLinkAsync(link);
            if (isLinkCreated) {
                let consumingOperationLocalId = await LinkPort.generateNextLocalIdAsync(linkUuid);
                let consumingOperationLinkPort = new LinkPort(
                    consumingOperationLocalId,
                    LinkPort.portDirectionEnum.INPUT,
                    consumingOperationuuid
                );
                let isLinkPortCreated = await Link.addLinkPortAsync(linkUuid, consumingOperationLinkPort);
                if (isLinkPortCreated) {
                    let servingOperationLocalId = await LinkPort.generateNextLocalIdAsync(linkUuid);
                    let servingOperationLinkPort = new LinkPort(
                        servingOperationLocalId,
                        LinkPort.portDirectionEnum.OUTPUT,
                        servingOperationuuid
                    );
                    await Link.addLinkPortAsync(linkUuid, servingOperationLinkPort);
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