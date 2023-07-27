'use strict';
var fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');
const { elasticsearchService, getApiKeyAsync, getIndexAliasAsync } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const ElasticsearchPreparation = require('./individualServices/ElasticsearchPreparation');

/**
 * Returns API key
 *
 * uuid String 
 * returns inline_response_200_42
 **/
exports.getElasticsearchClientApiKey = async function(url) {
  let value = await fileOperation.readFromDatabaseAsync(url);
  let response = {
    'elasticsearch-client-interface-1-0:api-key' : value
  };
  return response;
}

/**
 * Returns index alias
 *
 * uuid String 
 * returns inline_response_200_43
 **/
exports.getElasticsearchClientIndexAlias = async function(url) {
  let value = await fileOperation.readFromDatabaseAsync(url);
  let response = {
    'elasticsearch-client-interface-1-0:index-alias' : value
  };
  return response;
}

/**
 * Returns life cycle state of the connection towards Elasticsearch
 *
 * uuid String 
 * returns inline_response_200_46
 **/
exports.getElasticsearchClientLifeCycleState = async function(url) {
  let value = await fileOperation.readFromDatabaseAsync(url);
  let response = {
    'elasticsearch-client-interface-1-0:life-cycle-state' : value
  };
  return response;
}

/**
 * Returns operational state of the connection towards Elasticsearch
 *
 * uuid String 
 * returns inline_response_200_45
 **/
exports.getElasticsearchClientOperationalState = async function(uuid) {
  let value = await elasticsearchService.getElasticsearchClientOperationalStateAsync(uuid);
  let response = {
    'elasticsearch-client-interface-1-0:operational-state' : value
  };
  return response;
}

/**
 * Configures API key
 *
 * body Auth_apikey_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putElasticsearchClientApiKey = async function(url, body, uuid) {
  let oldValue = await getApiKeyAsync(uuid);
  if (oldValue !== body['elasticsearch-client-interface-1-0:api-key']) {
    await fileOperation.writeToDatabaseAsync(url, body, false);
    // recreate the client with new connection data
    await elasticsearchService.getClient(true, uuid);
    await ElasticsearchPreparation.prepareElasticsearch();
  }
}

/**
 * Configures index alias
 *
 * body Elasticsearchclientinterfaceconfiguration_indexalias_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putElasticsearchClientIndexAlias = async function(url, body, uuid) {
  let oldValue = await getIndexAliasAsync(uuid);
  if (oldValue !== body['elasticsearch-client-interface-1-0:index-alias']) {
    await fileOperation.writeToDatabaseAsync(url, body, false);
    await ElasticsearchPreparation.prepareElasticsearch();
  }
}
