'use strict';

var ElasticsearchClient = require('../service/ElasticsearchClientService');
var responseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var oamLogService = require('onf-core-model-ap/applicationPattern/services/OamLogService');

module.exports.getElasticsearchClientApiKey = function getElasticsearchClientApiKey (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  ElasticsearchClient.getElasticsearchClientApiKey(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
      responseBuilder.buildResponse(res, responseCode, response);
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getElasticsearchClientIndexAlias = function getElasticsearchClientIndexAlias (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  ElasticsearchClient.getElasticsearchClientIndexAlias(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
      responseBuilder.buildResponse(res, responseCode, response);
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getElasticsearchClientLifeCycleState = function getElasticsearchClientLifeCycleState (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  ElasticsearchClient.getElasticsearchClientLifeCycleState(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
      responseBuilder.buildResponse(res, responseCode, response);
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getElasticsearchClientOperationalState = function getElasticsearchClientOperationalState (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  ElasticsearchClient.getElasticsearchClientOperationalState(uuid)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
      responseBuilder.buildResponse(res, responseCode, response);
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getElasticsearchClientServiceRecordsPolicy = function getElasticsearchClientServiceRecordsPolicy (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.METHOD_NOT_ALLOWED;
  responseBuilder.buildResponse(res, responseCode, {});
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putElasticsearchClientApiKey = function putElasticsearchClientApiKey (req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  ElasticsearchClient.putElasticsearchClientApiKey(req.url, body, uuid)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
      responseBuilder.buildResponse(res, responseCode, response);
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putElasticsearchClientIndexAlias = function putElasticsearchClientIndexAlias (req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  ElasticsearchClient.putElasticsearchClientIndexAlias(req.url, body, uuid)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
      responseBuilder.buildResponse(res, responseCode, response);
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putElasticsearchClientServiceRecordsPolicy = function putElasticsearchClientServiceRecordsPolicy (req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.METHOD_NOT_ALLOWED;
  responseBuilder.buildResponse(res, responseCode, {});
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};
