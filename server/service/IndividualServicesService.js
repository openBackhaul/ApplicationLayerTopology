'use strict';

const LogicalTerminatinPointConfigurationInput = require('../applicationPattern/onfModel/services/models/logicalTerminationPoint/ConfigurationInput');
const LogicalTerminationPointService = require('../applicationPattern/onfModel/services/LogicalTerminationPointServices');
const LogicalTerminationPointConfigurationStatus = require('../applicationPattern/onfModel/services/models/logicalTerminationPoint/ConfigurationStatus');
const layerProtocol = require('../applicationPattern/onfModel/models/LayerProtocol');

const ForwardingConfigurationService = require('../applicationPattern/onfModel/services/ForwardingConstructConfigurationServices');
const ForwardingAutomationService = require('../applicationPattern/onfModel/services/ForwardingConstructAutomationServices');
const prepareForwardingConfiguration = require('./individualServices/PrepareForwardingConfiguration');
const prepareForwardingAutomation = require('./individualServices/PrepareForwardingAutomation');
const ConfigurationStatus = require('../applicationPattern/onfModel/services/models/ConfigurationStatus');

const logicalTerminationPoint = require('../applicationPattern/onfModel/models/LogicalTerminationPoint');
const httpServerInterface = require('../applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const tcpServerInterface = require('../applicationPattern/onfModel/models/layerProtocols/TcpServerInterface');
const operationServerInterface = require('../applicationPattern/onfModel/models/layerProtocols/OperationServerInterface');
const operationClientInterface = require('../applicationPattern/onfModel/models/layerProtocols/OperationClientInterface');
const httpClientInterface = require('../applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');

const onfAttributeFormatter = require('../applicationPattern/onfModel/utility/OnfAttributeFormatter');
const consequentAction = require('../applicationPattern/rest/server/responseBody/ConsequentAction');
const responseValue = require('../applicationPattern/rest/server/responseBody/ResponseValue');

const onfPaths = require('../applicationPattern/onfModel/constants/OnfPaths');
const onfAttributes = require('../applicationPattern/onfModel/constants/OnfAttributes');


const fileOperation = require('../applicationPattern/databaseDriver/JSONDriver');
const NetworkControlDomain = require('../applicationPattern/onfModel/models/NetworkControlDomain');
const FcPort = require('../applicationPattern/onfModel/models/FcPort');
const ForwardingConstruct = require('../applicationPattern/onfModel/models/ForwardingConstruct');
const LayerProtocol = require('../applicationPattern/onfModel/models/LayerProtocol');

/**
 * Connects an OperationClient to an OperationServer
 *
 * body V1_addoperationclienttolink_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.addOperationClientToLink = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    resolve();
  });
}


/**
 * Initiates process of embedding a new release
 *
 * body V1_bequeathyourdataanddie_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.bequeathYourDataAndDie = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    resolve();
  });
}


/**
 * FcPort identified by FcUuid and FcPortLid will be deleted
 *
 * body V1_deletefcport_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.deleteFcPort = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    resolve();
  });
}


/**
 * An OperationClient identified by LtpUuid and all its entries in FCs and Links gets deleted
 *
 * body V1_deleteltpanddependents_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.deleteLtpAndDependents = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {

      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let logicalTerminationPointUuid = body["uuid"];
      let controlConstructUuid = figureOutControlConstructUuid(logicalTerminationPointUuid);

      /****************************************************************************************
       * Prepare input object to 
       * configure control-construct list
       ****************************************************************************************/
      let controlConstructPath = onfPaths.NETWORK_DOMAIN_CONTROL_CONSTRUCT +
        "=" +
        controlConstructUuid;
      let logicalTerminationPointPath = controlConstructPath +
        "/logical-termination-point"
      let logicalTerminationPointPathForTheUuid = logicalTerminationPointPath +
        "=" +
        logicalTerminationPointUuid;

      let existingLogicalTerminationPoint = await fileOperation.readFromDatabaseAsync(logicalTerminationPointPathForTheUuid);

      if (existingLogicalTerminationPoint) {
        let layerProtocol = existingLogicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL];
        let layerProtocolName = layerProtocol[0][onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
        let isdeleted = await fileOperation.deletefromDatabaseAsync(logicalTerminationPointPathForTheUuid,
          existingLogicalTerminationPoint,
          true);
        if (isdeleted && (layerProtocolName== LayerProtocol.layerProtocolNameEnum.OPERATION_CLIENT || 
          layerProtocolName== LayerProtocol.layerProtocolNameEnum.OPERATION_SERVER)) {
          await deleteDependentFcPorts(controlConstructUuid, logicalTerminationPointUuid);
          await deleteDependentLinkPorts(logicalTerminationPointUuid);
        }
      }

      /****************************************************************************************
       * delete links
       ****************************************************************************************/

      

      /****************************************************************************************
       * Prepare attributes to automate forwarding-construct
       ****************************************************************************************/


      resolve();
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Removes application from application layer topology representation
 *
 * body V1_disregardapplication_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.disregardApplication = function (body, user, originator, xCorrelator, traceIndicator, customerJourney, operationServerName) {
  return new Promise(async function (resolve, reject) {
    try {

      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let applicationName = body["application-name"];
      let applicationReleaseNumber = body["application-release-number"];

      /****************************************************************************************
       * Prepare logicalTerminatinPointConfigurationInput object to 
       * configure logical-termination-point
       ****************************************************************************************/

      let logicalTerminationPointconfigurationStatus = await LogicalTerminationPointService.deleteApplicationInformationAsync(
        applicationName,
        applicationReleaseNumber
      );

      /****************************************************************************************
       * Prepare attributes to configure forwarding-construct
       ****************************************************************************************/

      let forwardingConfigurationInputList = [];
      let forwardingConstructConfigurationStatus;
      let operationClientConfigurationStatusList = logicalTerminationPointconfigurationStatus.operationClientConfigurationStatusList;

      if (operationClientConfigurationStatusList) {
        forwardingConfigurationInputList = await prepareForwardingConfiguration.disregardApplication(
          operationClientConfigurationStatusList
        );
        forwardingConstructConfigurationStatus = await ForwardingConfigurationService.
        unConfigureForwardingConstructAsync(
          operationServerName,
          forwardingConfigurationInputList
        );
      }


      /****************************************************************************************
       * Prepare attributes to configure control-construct
       ****************************************************************************************/
      // remove the entry from control-construct
      let controlConstruct = await NetworkControlDomain.getControlConstructOfTheApplication(
        applicationName,
        applicationReleaseNumber);
      if (controlConstruct) {
        let controlConstructUuid = controlConstruct["uuid"];
        await NetworkControlDomain.deleteControlConstructAsync(controlConstructUuid);
      }

      /****************************************************************************************
       * Prepare attributes to automate forwarding-construct
       ****************************************************************************************/
      let forwardingAutomationInputList = await prepareForwardingAutomation.disregardApplication(
        logicalTerminationPointconfigurationStatus,
        forwardingConstructConfigurationStatus
      );
      ForwardingAutomationService.automateForwardingConstructAsync(
        operationServerName,
        forwardingAutomationInputList,
        user,
        xCorrelator,
        traceIndicator,
        customerJourney
      );

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Provides list of applications that are part of the application layer topology representation
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns List
 **/
exports.listApplications = function (user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    let response = {};
    try {
      /****************************************************************************************
       * Preparing response body
       ****************************************************************************************/
      let applicationList = await getAllClientApplicationList();

      /****************************************************************************************
       * Setting 'application/json' response body
       ****************************************************************************************/
      response['application/json'] = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(applicationList);
    } catch (error) {
      console.log(error);
    }
    if (Object.keys(response).length > 0) {
      resolve(response[Object.keys(response)[0]]);
    } else {
      resolve();
    }
  });

}


/**
 * Provides list of operation UUIDs belonging to link identified by UUID
 *
 * body V1_listendpointsoflink_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_6
 **/
exports.listEndPointsOfLink = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "link-end-point-list": [{
        "application-name": "RegistryOffice",
        "application-release-number": "0.0.1",
        "operation-uuid": "ro-0-0-1-op-c-2070",
        "ltp-direction": "core-model-1-4:TERMINATION_DIRECTION_SINK"
      }, {
        "application-name": "ApplicationLayerTopology",
        "application-release-number": "0.0.1",
        "operation-uuid": "alt-0-0-1-op-s-0001",
        "ltp-direction": "core-model-1-4:TERMINATION_DIRECTION_SOURCE"
      }]
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Provides list of UUIDs of Links
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_5
 **/
exports.listLinkUuids = function (user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "link-uuid-list": ["alt-0-0-1-op-link-0001", "alt-0-0-1-op-link-0002"]
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Provides list of applications and names of operations that are connected by links to an application
 * 'Browses list of links for UUIDs of OperationClients at (application-name,application-release-number) as INPUT and  returns (serving-application-name,serving-application-release-number,operation-name) for OperationServers of UUIDs that are stated as OUTPUT.' 
 *
 * body V1_listlinkstooperationclientsofapplication_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_7
 **/
exports.listLinksToOperationClientsOfApplication = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "operation-server-list": [{
        "serving-application-name": "TypeApprovalRegister",
        "serving-application-release-number": "0.0.1",
        "operation-name": "/v1/embed-yourself"
      }, {
        "serving-application-name": "TypeApprovalRegister",
        "serving-application-release-number": "0.0.1",
        "operation-name": "/v1/update-client"
      }]
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Provides list of applications and names of operations that are consumed by an application
 * Returns information about targets of OperationClients.
 *
 * body V1_listoperationclientsatapplication_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_3
 **/
exports.listOperationClientsAtApplication = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "operation-client-list": [{
        "serving-application-name": "TypeApprovalRegister",
        "serving-application-release-number": "0.0.1",
        "operation-name": "/v1/embed-yourself"
      }, {
        "serving-application-name": "TypeApprovalRegister",
        "serving-application-release-number": "0.0.1",
        "operation-name": "/v1/update-client"
      }]
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Provides list of applications and names of operations that are addressed in case of an incomming request
 * Informs about the internal forwarding (FCs).
 *
 * body V1_listoperationclientsreactingonoperationserver_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_4
 **/
exports.listOperationClientsReactingOnOperationServer = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "operation-client-list": [{
        "addressed-application-name": "RegistryOffice",
        "addressed-application-release-number": "0.0.1",
        "addressed-operation-name": "/v1/register-application"
      }, {
        "addressed-application-name": "ExecutionAndTraceLog",
        "addressed-application-release-number": "0.0.1",
        "addressed-operation-name": "/v1/record-service-request"
      }]
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Provides list of names of operations that are supported by an application
 *
 * body V1_listoperationserversatapplication_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_2
 **/
exports.listOperationServersAtApplication = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "operation-server-name-list": ["/v1/register-yourself", "/v1/embed-yourself"]
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Offers subscribing for notifications about updates of Links
 *
 * body V1_notifylinkupdates_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.notifyLinkUpdates = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    resolve();
  });
}


/**
 * Provides operationKey of operation identified by UUID
 *
 * body V1_providecurrentoperationkey_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_8
 **/
exports.provideCurrentOperationKey = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "operation-key": "Operation key not yet provided."
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Adds to the list of applications
 *
 * body V1_regardapplication_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.regardApplication = function (body, user, originator, xCorrelator, traceIndicator, customerJourney, operationServerName) {
  return new Promise(async function (resolve, reject) {
    try {

      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let applicationName = body["application-name"];
      let applicationReleaseNumber = body["application-release-number"];
      let applicationAddress = body["application-address"];
      let applicationPort = body["application-port"];
      let listLTPsFCsOperation = "/v1/list-ltps-and-fcs";
      let redirectTopologyInformationOperation = "/v1/redirect-topology-change-information";

      /****************************************************************************************
       * Prepare logicalTerminatinPointConfigurationInput object to 
       * configure logical-termination-point
       ****************************************************************************************/

      let operationList = [
        listLTPsFCsOperation,
        redirectTopologyInformationOperation
      ];
      let logicalTerminatinPointConfigurationInput = new LogicalTerminatinPointConfigurationInput(
        applicationName,
        applicationReleaseNumber,
        applicationAddress,
        applicationPort,
        operationList
      );
      let logicalTerminationPointconfigurationStatus = await LogicalTerminationPointService.createOrUpdateApplicationInformationAsync(
        logicalTerminatinPointConfigurationInput
      );


      /****************************************************************************************
       * Prepare attributes to configure forwarding-construct
       ****************************************************************************************/

      let forwardingConfigurationInputList = [];
      let forwardingConstructConfigurationStatus;
      let operationClientConfigurationStatusList = logicalTerminationPointconfigurationStatus.operationClientConfigurationStatusList;

      if (operationClientConfigurationStatusList) {
        forwardingConfigurationInputList = await prepareForwardingConfiguration.regardApplication(
          operationClientConfigurationStatusList,
          listLTPsFCsOperation,
          redirectTopologyInformationOperation
        );
        forwardingConstructConfigurationStatus = await ForwardingConfigurationService.
        configureForwardingConstructAsync(
          operationServerName,
          forwardingConfigurationInputList
        );
      }

      /****************************************************************************************
       * Prepare attributes to automate forwarding-construct
       ****************************************************************************************/
      let forwardingAutomationInputList = await prepareForwardingAutomation.regardApplication(
        logicalTerminationPointconfigurationStatus,
        forwardingConstructConfigurationStatus,
        applicationName,
        applicationReleaseNumber
      );
      ForwardingAutomationService.automateForwardingConstructAsync(
        operationServerName,
        forwardingAutomationInputList,
        user,
        xCorrelator,
        traceIndicator,
        customerJourney
      );

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Disconnects an OperationClient
 *
 * body V1_removeoperationclientfromlink_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.removeOperationClientFromLink = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    resolve();
  });
}


/**
 * Starts application in generic representation
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200
 **/
exports.startApplicationInGenericRepresentation = function (user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "consequent-action-list": [{
        "label": "Inform about Application",
        "request": "https://10.118.125.157:1005/v1/inform-about-application-in-generic-representation"
      }],
      "response-value-list": [{
        "field-name": "applicationName",
        "value": "OwnApplicationName",
        "datatype": "String"
      }]
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Existing documentation of all interfaces and internal connections will be replaced for the same CcUuid
 *
 * body V1_updateallltpsandfcs_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.updateAllLtpsAndFcs = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {

      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let controlConstruct = body["core-model-1-4:control-construct"];
      let controlConstructUuid = controlConstruct["uuid"];

      /****************************************************************************************
       * Prepare input object to 
       * configure control-construct list
       ****************************************************************************************/

      let existingControlConstruct = await NetworkControlDomain.getControlConstructAsync(controlConstructUuid);
      if (existingControlConstruct) {
        let existingControlConstructAsAString = JSON.stringify(existingControlConstruct);
        let newControlConstructAsAString = JSON.stringify(controlConstruct);
        if (existingControlConstructAsAString != newControlConstructAsAString) {
          await NetworkControlDomain.deleteControlConstructAsync(controlConstructUuid);
          await NetworkControlDomain.addControlConstructAsync(controlConstruct);
        }
      } else {
        await NetworkControlDomain.addControlConstructAsync(controlConstruct);
      }

      /****************************************************************************************
       * Prepare attributes to configure forwarding-construct
       ****************************************************************************************/



      /****************************************************************************************
       * Prepare attributes to automate forwarding-construct
       ****************************************************************************************/


      resolve();
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Existing documentation of an FC identified by FcUuid will be replaced
 *
 * body V1_updatefc_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.updateFc = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    resolve();
  });
}


/**
 * Existing documentation of an FcPort identified by FcUuid and FcPortLid will be replaced
 *
 * body V1_updatefcport_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.updateFcPort = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    resolve();
  });
}


/**
 * Existing documentation of the interface identified by LtpUuid will be replaced
 *
 * body V1_updateltp_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-0-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.updateLtp = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {

      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let logicalTerminationPoint = body;
      let logicalTerminationPointUuid = logicalTerminationPoint[onfAttributes.GLOBAL_CLASS.UUID];
      let controlConstructUuid = figureOutControlConstructUuid(logicalTerminationPointUuid);

      /****************************************************************************************
       * Prepare input object to 
       * configure control-construct list
       ****************************************************************************************/
      let logicalTerminationPointPath = onfPaths.NETWORK_DOMAIN_CONTROL_CONSTRUCT +
        "=" +
        controlConstructUuid +
        "/" + onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT;

      let logicalTerminationPointPathForTheUuid = logicalTerminationPointPath +
        "=" +
        logicalTerminationPointUuid;

      let existingLogicalTerminationPoint = await fileOperation.readFromDatabaseAsync(logicalTerminationPointPathForTheUuid);

      if (existingLogicalTerminationPoint) {
        let existingLogicalTerminationPointAsAString = JSON.stringify(existingLogicalTerminationPoint);
        let newLogicalTerminationPointAsAString = JSON.stringify(logicalTerminationPoint);
        if (existingLogicalTerminationPointAsAString != newLogicalTerminationPointAsAString) {
          await fileOperation.deletefromDatabaseAsync(logicalTerminationPointPathForTheUuid,
            existingLogicalTerminationPoint,
            true);
          await fileOperation.writeToDatabaseAsync(logicalTerminationPointPath,
            logicalTerminationPoint,
            true);
        }
      } else {
        await fileOperation.writeToDatabaseAsync(logicalTerminationPointPath,
          logicalTerminationPoint,
          true);
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/****************************************************************************************
 * Functions utilized by individual services
 ****************************************************************************************/

/**
 * @description This function returns list of registered application information application-name , release-number.
 * @return {Promise} return the list of application information
 **/
function getAllClientApplicationList() {
  return new Promise(async function (resolve, reject) {
    let clientApplicationList = [];
    try {

      /** 
       * This class instantiate objects that holds the application name , release number 
       * of the client applications
       */
      let clientApplicationInformation = class ClientApplicationInformation {
        applicationName;
        applicationReleaseNumber;

        /**
         * @constructor 
         * @param {String} applicationName name of the client application.
         * @param {String} applicationReleaseNumber release number of the application.
         **/
        constructor(applicationName, applicationReleaseNumber) {
          this.applicationName = applicationName;
          this.applicationReleaseNumber = applicationReleaseNumber;
        }
      };
      let httpClientUuidList = await logicalTerminationPoint.getUuidListForTheProtocolAsync(layerProtocol.layerProtocolNameEnum.HTTP_CLIENT);
      for (let i = 0; i < httpClientUuidList.length; i++) {
        let httpClientUuid = httpClientUuidList[i];
        let applicationName = await httpClientInterface.getApplicationNameAsync(httpClientUuid);
        let applicationReleaseNumber = await httpClientInterface.getReleaseNumberAsync(httpClientUuid);
        let clientApplication = new clientApplicationInformation(applicationName, applicationReleaseNumber);
        clientApplicationList.push(clientApplication);
      }
      resolve(clientApplicationList);
    } catch (error) {
      reject(error);
    }
  });
}

async function deleteDependentFcPorts(controlConstructUuid, logicalTerminationPointUuid) {
  return new Promise(async function (resolve, reject) {
    try {
      let controlConstructPath = onfPaths.NETWORK_DOMAIN_CONTROL_CONSTRUCT + "=" + controlConstructUuid;
      let forwardingConstructPath = controlConstructPath + "/" + onfAttributes.CONTROL_CONSTRUCT.FORWARDING_DOMAIN;

      let forwardingDomainList = await fileOperation.readFromDatabaseAsync(
        forwardingConstructPath);
      /*************************************************************************************
       ****************delete dependents , if a fc-port exist for them***********************
       *************************************************************************************/
      for (let i = 0; i < forwardingDomainList.length; i++) {
        let forwardingDomain = forwardingDomainList[i];
        let forwardingDomainUuid = forwardingDomain[onfAttributes.GLOBAL_CLASS.UUID];
        let forwardingConstructList = forwardingDomain[onfAttributes.FORWARDING_DOMAIN.FORWARDING_CONSTRUCT];

        for (let j = 0; j < forwardingConstructList.length; j++) {
          let forwardingConstruct = forwardingConstructList[j];
          let forwardingConstructUuid = forwardingConstruct[onfAttributes.GLOBAL_CLASS.UUID];
          let nameList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.NAME];
          let forwardingKind = getValueFromKey(nameList, "ForwardingKind");
          let fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];

          for (let k = 0; k < fcPortList.length; k++) {
            let fcPort = fcPortList[k];
            let fcPortLocalId = fcPort[onfAttributes.LOCAL_CLASS.LOCAL_ID];
            let FcPortlogicalTerminationPoint = fcPort[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];

            if (FcPortlogicalTerminationPoint == logicalTerminationPointUuid) {
              await deleteFcPorts(
                forwardingKind,
                controlConstructUuid,
                forwardingDomainUuid,
                forwardingConstructUuid,
                fcPortLocalId
              );
            }

          }
        }
      }

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}


async function deleteFcPorts(forwardingName, controlConstructUuid, forwardingDomainUuid, forwardingConstructUuid, fcPortLocalId) {
  return new Promise(async function (resolve, reject) {
    try {
      let controlConstructPath = onfPaths.NETWORK_DOMAIN_CONTROL_CONSTRUCT + "=" + controlConstructUuid;
      let forwardingDomainPath = controlConstructPath + "/" + onfAttributes.CONTROL_CONSTRUCT.FORWARDING_DOMAIN + "=" + forwardingDomainUuid;
      let forwardingConstructPath = forwardingDomainPath + "/" + onfAttributes.FORWARDING_DOMAIN.FORWARDING_CONSTRUCT + "=" + forwardingConstructUuid;
      let fcPortPath = forwardingConstructPath + "/" + onfAttributes.FORWARDING_CONSTRUCT.FC_PORT + "=" + fcPortLocalId;

      if (forwardingName != ForwardingConstruct.name.forwardingConstructKindEnum.INVARIANT_PROCESS_SNIPPET) {
        await fileOperation.deletefromDatabaseAsync(fcPortPath,
          fcPortPath,
          true);
      } else {
        fcPortPath = fcPortPath +
          "/" + onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT;
        await fileOperation.writeToDatabaseAsync(fcPortPath,
          "-1",
          false);
      }

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

async function deleteDependentLinkPorts(logicalTerminationPointUuid) {
  return new Promise(async function (resolve, reject) {
    try {
      let linkList = await NetworkControlDomain.getLinkListAsync();
      if (linkList) {
        for (let i = 0; i < linkList.length; i++) {
          let link = linkList[i];
          let linkUuid = link["uuid"];
          let linkPortList = link["link-port"];
          if(linkPortList){
            for(let j=0;j<linkPortList.length;j++){
              let linkPort = linkPortList[j];
              let linkPortLogicalTerminationPoint = linkPort["logical-termination-point"];
              if(linkPortLogicalTerminationPoint == logicalTerminationPointUuid){
                await NetworkControlDomain.deleteLinkAsync(linkUuid);
              }
            }
          }
        }
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function figureOutControlConstructUuid(uuid) {
  let controlConstructUuid = uuid.split('-').slice(0, 4).join("-");
  return controlConstructUuid;
}

function getValueFromKey(nameList, key) {
  for (let i = 0; i < nameList.length; i++) {
    let valueName = nameList[i]["value-name"];
    if (valueName == key) {
      return nameList[i]["value"];
    }
  }
  return undefined;
}