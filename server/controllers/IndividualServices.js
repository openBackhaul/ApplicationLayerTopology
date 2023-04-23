'use strict';

var utils = require('../utils/writer.js');
var IndividualServices = require('../service/IndividualServicesService');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var restResponseHeader = require('onf-core-model-ap/applicationPattern/rest/server/ResponseHeader');
var restResponseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
var executionAndTraceService = require('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');

module.exports.addOperationClientToLink = async function addOperationClientToLink (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let startTime = process.hrtime();
    let responseCode = responseCodeEnum.code.NO_CONTENT;
    let responseBodyToDocument = {};
    await IndividualServices.addOperationClientToLink(body, user, originator, xCorrelator, traceIndicator, customerJourney, req.url)
      .then(async function (responseBody) {
        responseBodyToDocument = responseBody;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      })
      .catch(async function (responseBody) {
        responseBodyToDocument = responseBody;
        responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
  } catch (error) {}
};

module.exports.bequeathYourDataAndDie = async function bequeathYourDataAndDie (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let startTime = process.hrtime();
    let responseCode = responseCodeEnum.code.NO_CONTENT;
    let responseBodyToDocument = {};
    await IndividualServices.bequeathYourDataAndDie(body, user, originator, xCorrelator, traceIndicator, customerJourney, req.url)
      .then(async function (responseBody) {
        responseBodyToDocument = responseBody;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      })
      .catch(async function (responseBody) {
        responseBodyToDocument = responseBody;
        responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
  } catch (error) {}
};

module.exports.deleteFcPort = async function deleteFcPort (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let startTime = process.hrtime();
    let responseCode = responseCodeEnum.code.NO_CONTENT;
    let responseBodyToDocument = undefined;
    await IndividualServices.deleteFcPort(body)
      .then(async function (responseBody) {
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, responseBody.took);
        restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
      })
      .catch(async function (responseBody) {
        responseBodyToDocument = responseBody;
        responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
  } catch (error) {}
};

module.exports.deleteLtpAndDependents = async function deleteLtpAndDependents (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
  IndividualServices.deleteLtpAndDependents(body, user, originator, xCorrelator, traceIndicator, customerJourney, req.url)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      responseBodyToDocument = responseBody;
      responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.disregardApplication = async function disregardApplication (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
      let startTime = process.hrtime();
      let responseCode = responseCodeEnum.code.NO_CONTENT;
      let responseBodyToDocument = {};
      await IndividualServices.disregardApplication(body, user, originator, xCorrelator, traceIndicator, customerJourney, req.url)
        .then(async function (responseBody) {
          responseBodyToDocument = responseBody;
          let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
          restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
        })
        .catch(async function (responseBody) {
          responseBodyToDocument = responseBody;
          responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
          let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
          restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
        });
      executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
    } catch (error) {}
};

module.exports.listApplications = async function listApplications (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
      let startTime = process.hrtime();
      let responseCode = responseCodeEnum.code.OK;
      let responseBodyToDocument = {};
      await IndividualServices.listApplications(user, originator, xCorrelator, traceIndicator, customerJourney)
        .then(async function (responseBody) {
          responseBodyToDocument = responseBody;
          let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
          restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
        })
        .catch(async function (responseBody) {
          responseBodyToDocument = responseBody;
          responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
          let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
          restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
        });
      executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
    } catch (error) {}
};

module.exports.listEndPointsOfLink = async function listEndPointsOfLink (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let startTime = process.hrtime();
    let responseCode = responseCodeEnum.code.OK;
    let responseBodyToDocument = {};
    await IndividualServices.listEndPointsOfLink(body)
      .then(async function (responseBody) {
        responseBodyToDocument = responseBody.body;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, responseBody.took);
        restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
      })
      .catch(async function (responseBody) {
        responseBodyToDocument = responseBody;
        responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
  } catch (error) {}
};

module.exports.listLinkUuids = async function listLinkUuids (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let startTime = process.hrtime();
    let responseCode = responseCodeEnum.code.OK;
    let responseBodyToDocument = {};
    await IndividualServices.listLinkUuids()
      .then(async function (responseBody) {
        responseBodyToDocument = responseBody.body;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, responseBody.took);
        restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
      })
      .catch(async function (responseBody) {
        responseBodyToDocument = responseBody;
        responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
  } catch (error) {
    console.log(error);
  }
};

module.exports.listLinksToOperationClientsOfApplication = async function listLinksToOperationClientsOfApplication (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let startTime = process.hrtime();
    let responseCode = responseCodeEnum.code.OK;
    let responseBodyToDocument = {};
    await IndividualServices.listLinksToOperationClientsOfApplication(body)
      .then(async function (responseBody) {
        responseBodyToDocument = responseBody.body;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, responseBody.took);
        restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
      })
      .catch(async function (responseBody) {
        responseBodyToDocument = responseBody;
        responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
  } catch (error) {}
};

module.exports.listOperationClientsAtApplication = async function listOperationClientsAtApplication (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let startTime = process.hrtime();
    let responseCode = responseCodeEnum.code.OK;
    let responseBodyToDocument = {};
    await IndividualServices.listOperationClientsAtApplication(body)
      .then(async function (responseBody) {
        responseBodyToDocument = responseBody.body;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, responseBody.took);
        restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
      })
      .catch(async function (responseBody) {
        responseBodyToDocument = responseBody;
        responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
  } catch (error) {}
};

module.exports.listOperationClientsReactingOnOperationServer = async function listOperationClientsReactingOnOperationServer (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let startTime = process.hrtime();
    let responseCode = responseCodeEnum.code.OK;
    let responseBodyToDocument = {};
    await IndividualServices.listOperationClientsReactingOnOperationServer(body, user, originator, xCorrelator, traceIndicator, customerJourney, req.url)
      .then(async function (responseBody) {
        responseBodyToDocument = responseBody;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      })
      .catch(async function (responseBody) {
        responseBodyToDocument = responseBody;
        responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
  } catch (error) {}
};

module.exports.listOperationServersAtApplication = async function listOperationServersAtApplication (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let startTime = process.hrtime();
    let responseCode = responseCodeEnum.code.OK;
    let responseBodyToDocument = {};
    await IndividualServices.listOperationServersAtApplication(body)
      .then(async function (responseBody) {
        responseBodyToDocument = responseBody.body;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, responseBody.took);
        restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
      })
      .catch(async function (responseBody) {
        responseBodyToDocument = responseBody;
        responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
  } catch (error) {}
};

module.exports.notifyLinkUpdates = async function notifyLinkUpdates (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let startTime = process.hrtime();
    let responseCode = responseCodeEnum.code.NO_CONTENT;
    let responseBodyToDocument = {};
    await IndividualServices.notifyLinkUpdates(body, user, originator, xCorrelator, traceIndicator, customerJourney, req.url)
      .then(async function (responseBody) {
        responseBodyToDocument = responseBody;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      })
      .catch(async function (responseBody) {
        responseBodyToDocument = responseBody;
        responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
  } catch (error) {}
};

module.exports.provideCurrentOperationKey = function provideCurrentOperationKey (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.provideCurrentOperationKey(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.regardApplication = async function regardApplication (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
      let startTime = process.hrtime();
      let responseCode = responseCodeEnum.code.NO_CONTENT;
      let responseBodyToDocument = {};
      await IndividualServices.regardApplication(body, user, originator, xCorrelator, traceIndicator, customerJourney, req.url)
        .then(async function (responseBody) {
          responseBodyToDocument = responseBody;
          let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
          restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
        })
        .catch(async function (responseBody) {
          responseBodyToDocument = responseBody;
          responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
          let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
          restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
        });
      executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
    } catch (error) {}
};

module.exports.removeOperationClientFromLink = async function removeOperationClientFromLink (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let startTime = process.hrtime();
    let responseCode = responseCodeEnum.code.NO_CONTENT;
    let responseBodyToDocument = {};
    await IndividualServices.removeOperationClientFromLink(body, user, originator, xCorrelator, traceIndicator, customerJourney, req.url)
      .then(async function (responseBody) {
        responseBodyToDocument = responseBody;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      })
      .catch(async function (responseBody) {
        responseBodyToDocument = responseBody;
        responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
  } catch (error) {}
};

module.exports.updateAllLtpsAndFcs = async function updateAllLtpsAndFcs (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  IndividualServices.updateAllLtpsAndFcs(body)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      responseBodyToDocument = responseBody;
      responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.updateFc = async function updateFc (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let startTime = process.hrtime();
    let responseCode = responseCodeEnum.code.NO_CONTENT;
    let responseBodyToDocument = {};
    await IndividualServices.updateFc(body, user, originator, xCorrelator, traceIndicator, customerJourney, req.url)
      .then(async function (responseBody) {
        responseBodyToDocument = responseBody;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      })
      .catch(async function (responseBody) {
        responseBodyToDocument = responseBody;
        responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
  } catch (error) {}
};

module.exports.updateFcPort = async function updateFcPort (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let startTime = process.hrtime();
    let responseCode = responseCodeEnum.code.NO_CONTENT;
    let responseBodyToDocument = {};
    await IndividualServices.updateFcPort(body, user, originator, xCorrelator, traceIndicator, customerJourney, req.url)
      .then(async function (responseBody) {
        responseBodyToDocument = responseBody;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      })
      .catch(async function (responseBody) {
        responseBodyToDocument = responseBody;
        responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
        let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
  } catch (error) {}
};

module.exports.updateLtp = async function updateLtp (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let startTime = process.hrtime();
    let responseCode = responseCodeEnum.code.NO_CONTENT;
    let responseBodyToDocument = {};
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    IndividualServices.updateLtp(body, user, originator, xCorrelator, traceIndicator, customerJourney, req.url)
      .then(async function (responseBody) {
        responseBodyToDocument = responseBody;
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      })
      .catch(async function (responseBody) {
        responseBodyToDocument = responseBody;
        responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
        restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
  } catch (error) {}
};
