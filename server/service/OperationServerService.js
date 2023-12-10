'use strict';
const fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');
const prepareForwardingAutomation = require('./individualServices/PrepareForwardingAutomation');
const ForwardingAutomationService = require('onf-core-model-ap/applicationPattern/onfModel/services/ForwardingConstructAutomationServices');

/**
 * Returns the configured life cycle state of the operation
 *
 * url String 
 * returns inline_response_200_10
 **/
exports.getOperationServerLifeCycleState = async function (url) {
  const value = await fileOperation.readFromDatabaseAsync(url);
  return {
    "operation-server-interface-1-0:life-cycle-state": value
  };
}

/**
 * Returns key for connecting
 *
 * url String 
 * returns inline_response_200_11
 **/
exports.getOperationServerOperationKey = async function (url) {
  const value = await fileOperation.readFromDatabaseAsync(url);
  return {
    "operation-server-interface-1-0:operation-key": value
  };
}

/**
 * Returns operation name
 *
 * url String 
 * returns inline_response_200_9
 **/
exports.getOperationServerOperationName = async function (url) {
  const value = await fileOperation.readFromDatabaseAsync(url);
  return {
    "operation-server-interface-1-0:operation-name": value
  };
}

/**
 * Configures life cycle state
 *
 * body Operationserverinterfaceconfiguration_lifecyclestate_body 
 * url String
 * uuid String
 * no response value expected for this operation
 **/
exports.putOperationServerLifeCycleState = async function (url, body, uuid) {
  const isUpdated = await fileOperation.writeToDatabaseAsync(url, body, false);
  if (isUpdated) {
    const forwardingAutomationInputList = await prepareForwardingAutomation.OAMLayerRequest(
      uuid
    );
    ForwardingAutomationService.automateForwardingConstructWithoutInputAsync(
      forwardingAutomationInputList
    );
  }
}

/**
 * Changes key for connecting
 *
 * body Operationserverinterfaceconfiguration_operationkey_body 
 * url String 
 * no response value expected for this operation
 **/
exports.putOperationServerOperationKey = async function (url, body) {
  await fileOperation.writeToDatabaseAsync(url, body, false);
}
