'use strict';
const fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');
const prepareForwardingAutomation = require('./individualServices/PrepareForwardingAutomation');
const ForwardingAutomationService = require('onf-core-model-ap/applicationPattern/onfModel/services/ForwardingConstructAutomationServices');
const tcpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const ElasticsearchPreparation = require('./individualServices/ElasticsearchPreparation');
const { isTcpClientElasticsearch, elasticsearchService } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const logicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');
const LayerProtocol = require('onf-core-model-ap/applicationPattern/onfModel/models/LayerProtocol');

/**
 * Returns remote IPv4 address
 *
 * url String 
 * returns inline_response_200_28
 **/
exports.getTcpClientRemoteAddress = async function (url) {
  const value = await fileOperation.readFromDatabaseAsync(url);
  return {
    "tcp-client-interface-1-0:remote-address": value
  };
}

exports.getTcpClientRemoteProtocol = async function (url) {
  const value = await fileOperation.readFromDatabaseAsync(url);
  return {
    "tcp-client-interface-1-0:remote-protocol": value
  };
}

/**
 * Returns target TCP port at server
 *
 * url String 
 * returns inline_response_200_29
 **/
exports.getTcpClientRemotePort = async function (url) {
  const value = await fileOperation.readFromDatabaseAsync(url);
  return {
    "tcp-client-interface-1-0:remote-port": value
  };
}

/**
 * Configures remote IPv4 address
 *
 * body Ipaddress_ipv4address_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putTcpClientRemoteAddress = async function (body, uuid) {
  const oldValue = await tcpClientInterface.getRemoteAddressAsync(uuid);
  const newValue = body["tcp-client-interface-1-0:remote-address"];
  if (oldValue !== newValue) {
    const isUpdated = await tcpClientInterface.setRemoteAddressAsync(uuid, newValue);
    if (isUpdated) {
      const forwardingAutomationInputList = await prepareForwardingAutomation.OAMLayerRequest(
        uuid
      );
      ForwardingAutomationService.automateForwardingConstructWithoutInputAsync(
        forwardingAutomationInputList
      );
      if (await isTcpClientElasticsearch(uuid)) {
        // recreate all the clients with new connection data
        const uuids = await logicalTerminationPoint.getUuidListForTheProtocolAsync(LayerProtocol.layerProtocolNameEnum.ES_CLIENT);
        for (const uuid of uuids) {
          await elasticsearchService.getClient(true, uuid);
        }
        await ElasticsearchPreparation.prepareElasticsearch();
      }
    }
  }
}

/**
 * Configures target TCP port at server
 *
 * body Tcpclientinterfaceconfiguration_remoteport_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putTcpClientRemotePort = async function (body, uuid) {
  const oldValue = await tcpClientInterface.getRemotePortAsync(uuid);
  const newValue = body["tcp-client-interface-1-0:remote-port"];
  if (oldValue !== newValue) {
    const isUpdated = await tcpClientInterface.setRemotePortAsync(uuid, newValue);
    if (isUpdated) {
      const forwardingAutomationInputList = await prepareForwardingAutomation.OAMLayerRequest(
        uuid
      );
      ForwardingAutomationService.automateForwardingConstructWithoutInputAsync(
        forwardingAutomationInputList
      );
      if (await isTcpClientElasticsearch(uuid)) {
        // recreate all the clients with new connection data
        const uuids = await logicalTerminationPoint.getUuidListForTheProtocolAsync(LayerProtocol.layerProtocolNameEnum.ES_CLIENT);
        for (const uuid of uuids) {
          await elasticsearchService.getClient(true, uuid);
        }
        await ElasticsearchPreparation.prepareElasticsearch();
      }
    }
  }
}

exports.putTcpClientRemoteProtocol = async function (body, uuid) {
  const oldValue = await tcpClientInterface.getRemoteProtocolAsync(uuid);
  const newValue = body["tcp-client-interface-1-0:remote-protocol"];
  if (oldValue !== newValue) {
    const isUpdated = await tcpClientInterface.setRemoteProtocolAsync(uuid, newValue);
    if (isUpdated) {
      const forwardingAutomationInputList = await prepareForwardingAutomation.OAMLayerRequest(
        uuid
      );
      ForwardingAutomationService.automateForwardingConstructWithoutInputAsync(
        forwardingAutomationInputList
      );
      if (await isTcpClientElasticsearch(uuid)) {
        // recreate all the clients with new connection data
        const uuids = await logicalTerminationPoint.getUuidListForTheProtocolAsync(LayerProtocol.layerProtocolNameEnum.ES_CLIENT);
        for (const uuid of uuids) {
          await elasticsearchService.getClient(true, uuid);
        }
        await ElasticsearchPreparation.prepareElasticsearch();
      }
    }
  }
}
