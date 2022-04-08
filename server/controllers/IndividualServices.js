'use strict';

var utils = require('../utils/writer.js');
var IndividualServices = require('../service/IndividualServicesService');
var responseCodeEnum = require('../applicationPattern/rest/server/ResponseCode');
var restResponseHeader = require('../applicationPattern/rest/server/ResponseHeader');
var restResponseBuilder = require('../applicationPattern/rest/server/ResponseBuilder');
var executionAndTraceService = require('../basicServices/ExecutionAndTraceService');

module.exports.addOperationClientToLink = function addOperationClientToLink (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.addOperationClientToLink(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.bequeathYourDataAndDie = function bequeathYourDataAndDie (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.bequeathYourDataAndDie(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteFcPort = function deleteFcPort (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.deleteFcPort(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteLtpAndDependents = function deleteLtpAndDependents (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.deleteLtpAndDependents(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
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
        .catch(async function (response) {
          responseBodyToDocument = responseBody;
          responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
          let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
          restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
        });
      executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
    } catch (error) {}
};

module.exports.listApplications = function listApplications (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.listApplications(user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.listEndPointsOfLink = function listEndPointsOfLink (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.listEndPointsOfLink(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.listLinkUuids = function listLinkUuids (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.listLinkUuids(user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.listLinksToOperationClientsOfApplication = function listLinksToOperationClientsOfApplication (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.listLinksToOperationClientsOfApplication(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.listOperationClientsAtApplication = function listOperationClientsAtApplication (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.listOperationClientsAtApplication(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.listOperationClientsReactingOnOperationServer = function listOperationClientsReactingOnOperationServer (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.listOperationClientsReactingOnOperationServer(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.listOperationServersAtApplication = function listOperationServersAtApplication (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.listOperationServersAtApplication(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.notifyLinkUpdates = function notifyLinkUpdates (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.notifyLinkUpdates(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
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
        .catch(async function (response) {
          responseBodyToDocument = responseBody;
          responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
          let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
          restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
        });
      executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
    } catch (error) {}
};

module.exports.removeOperationClientFromLink = function removeOperationClientFromLink (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.removeOperationClientFromLink(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.startApplicationInGenericRepresentation = function startApplicationInGenericRepresentation (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.startApplicationInGenericRepresentation(user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateAllLtpsAndFcs = function updateAllLtpsAndFcs (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.updateAllLtpsAndFcs(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateFc = function updateFc (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.updateFc(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateFcPort = function updateFcPort (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.updateFcPort(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateLtp = function updateLtp (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.updateLtp(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
