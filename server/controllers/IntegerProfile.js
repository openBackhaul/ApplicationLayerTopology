'use strict';

var IntegerProfile = require('../service/IntegerProfileService');
var ResponseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
var ResponseCode = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var OamLogService = require('onf-core-model-ap/applicationPattern/services/OamLogService');

module.exports.getIntegerProfileIntegerName = async function getIntegerProfileIntegerName (req, res, next, uuid) {
  let responseCode = ResponseCode.code.OK;
  await IntegerProfile.getIntegerProfileIntegerName(req.url)
    .then(function (response) {
      ResponseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = ResponseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  OamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getIntegerProfileIntegerValue = async function getIntegerProfileIntegerValue (req, res, next, uuid) {
  let responseCode = ResponseCode.code.OK;
  await IntegerProfile.getIntegerProfileIntegerValue(req.url)
    .then(function (response) {
      ResponseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = ResponseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  OamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getIntegerProfileMaximum = async function getIntegerProfileMaximum (req, res, next, uuid) {
  let responseCode = ResponseCode.code.OK;
  await IntegerProfile.getIntegerProfileMaximum(req.url)
    .then(function (response) {
      ResponseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = ResponseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  OamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getIntegerProfileMinimum = async function getIntegerProfileMinimum (req, res, next, uuid) {
  let responseCode = ResponseCode.code.OK;
  await IntegerProfile.getIntegerProfileMinimum(req.url)
    .then(function (response) {
      ResponseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = ResponseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  OamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getIntegerProfilePurpose = async function getIntegerProfilePurpose (req, res, next, uuid) {
  let responseCode = ResponseCode.code.OK;
  IntegerProfile.getIntegerProfilePurpose(req.url)
    .then(function (response) {
      ResponseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = ResponseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  OamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);

};

module.exports.getIntegerProfileUnit = async function getIntegerProfileUnit (req, res, next, uuid) {
  let responseCode = ResponseCode.code.OK;
  await IntegerProfile.getIntegerProfileUnit(req.url)
    .then(function (response) {
      ResponseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = ResponseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  OamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putIntegerProfileIntegerValue = async function putIntegerProfileIntegerValue (req, res, next, body, uuid) {
  let responseCode = ResponseCode.code.NO_CONTENT;
  await IntegerProfile.putIntegerProfileIntegerValue(body, req.url, uuid)
    .then(function (response) {
      ResponseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = ResponseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  OamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};
