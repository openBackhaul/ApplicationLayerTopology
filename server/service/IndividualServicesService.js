'use strict';

const LogicalTerminatinPointConfigurationInput = require('onf-core-model-ap/applicationPattern/onfModel/services/models/logicalTerminationPoint/ConfigurationInputWithMapping');
const LogicalTerminationPointService = require('onf-core-model-ap/applicationPattern/onfModel/services/LogicalTerminationPointWithMappingServices');
const LogicalTerminationPointConfigurationStatus = require('../applicationPattern/onfModel/services/models/logicalTerminationPoint/ConfigurationStatus');
const layerProtocol = require('../applicationPattern/onfModel/models/LayerProtocol');

const LinkServices = require('./individualServices/LinkServices');

const individualServicesOperationsMapping = require('./individualServices/IndividualServicesOperationsMapping');
const ForwardingConfigurationService = require('onf-core-model-ap/applicationPattern/onfModel/services/ForwardingConstructConfigurationServices');
const ForwardingAutomationService = require('onf-core-model-ap/applicationPattern/onfModel/services/ForwardingConstructAutomationServices');
const FcPort = require("onf-core-model-ap/applicationPattern/onfModel/models/FcPort");

const prepareForwardingConfiguration = require('./individualServices/PrepareForwardingConfiguration');
const prepareForwardingAutomation = require('./individualServices/PrepareForwardingAutomation');
const softwareUpgrade = require('./individualServices/SoftwareUpgrade');
const ConfigurationStatus = require('onf-core-model-ap/applicationPattern/onfModel/services/models/ConfigurationStatus');
const httpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const tcpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpServerInterface');
const httpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');
const onfAttributeFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');

const logicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');
const tcpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const ForwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');


const operationServerInterface = require('../applicationPattern/onfModel/models/layerProtocols/OperationServerInterface');
const operationClientInterface = require('../applicationPattern/onfModel/models/layerProtocols/OperationClientInterface');
const consequentAction = require('../applicationPattern/rest/server/responseBody/ConsequentAction');
const responseValue = require('../applicationPattern/rest/server/responseBody/ResponseValue');

const onfPaths = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfPaths');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');

const fileOperation = require('../applicationPattern/databaseDriver/JSONDriver');

const ForwardingConstruct = require('../applicationPattern/onfModel/models/ForwardingConstruct');
const LayerProtocol = require('../applicationPattern/onfModel/models/LayerProtocol');
const TcpServerInterface = require('../applicationPattern/onfModel/models/layerProtocols/TcpServerInterface');
const LinkPort = require('./models/LinkPort');
const Link = require('./models/Link');
const { elasticsearchService, getIndexAliasAsync } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const ControlConstructService = require('./individualServices/ControlConstructService');

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

exports.addOperationClientToLink = function (body, user, originator, xCorrelator, traceIndicator, customerJourney, operationServerName) {
  return new Promise(async function (resolve, reject) {
    try {

      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let EndPointDetails = body;

      /****************************************************************************************
       * Prepare logicalTerminatinPointConfigurationInput object to 
       * configure logical-termination-point
       ****************************************************************************************/
      let linkUuid = await LinkServices.findOrCreateLinkForTheEndPointsAsync(EndPointDetails);


      /****************************************************************************************
       * Prepare attributes to automate forwarding-construct
       ****************************************************************************************/
      let forwardingAutomationInputList = await prepareForwardingAutomation.addOperationClientToLink(
        linkUuid
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
exports.bequeathYourDataAndDie = function (body, user, originator, xCorrelator, traceIndicator, customerJourney, operationServerName) {
  return new Promise(async function (resolve, reject) {
    try {

      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let applicationName = body["new-application-name"];
      let releaseNumber = body["new-application-release"];
      let protocol = body["new-application-protocol"];
      let address = body["new-application-address"];
      let port = body["new-application-port"];

      /****************************************************************************************
       * Prepare logicalTerminatinPointConfigurationInput object to 
       * configure logical-termination-point
       ****************************************************************************************/
      let isdataTransferRequired = true;
      
      let httpClientUuidList = await resolveHttpClient() 
      let newReleaseHttpClientLtpUuid = httpClientUuidList.httpClientUuid
      let tcpclientUuid = httpClientUuidList.tcpClientUuid

      let currentNewReleaseApplicationName = await httpClientInterface.getApplicationNameAsync(newReleaseHttpClientLtpUuid);
      let currentNewReleaseNumber = await httpClientInterface.getReleaseNumberAsync(newReleaseHttpClientLtpUuid);
      let currentNewReleaseRemoteAddress = await tcpClientInterface.getRemoteAddressAsync(tcpclientUuid);
      let currentNewReleaseRemoteProtocol = await tcpClientInterface.getRemoteProtocolAsync(tcpclientUuid);
      let currentNewReleaseRemotePort = await tcpClientInterface.getRemotePortAsync(tcpclientUuid);
      let update = {};
      let logicalTerminationPointConfigurationStatus = {};
      if (newReleaseHttpClientLtpUuid != undefined) {
        if (releaseNumber != currentNewReleaseNumber) {
          update.isReleaseUpdated = await httpClientInterface.setReleaseNumberAsync(newReleaseHttpClientLtpUuid, releaseNumber);
        }
        if (applicationName != currentNewReleaseApplicationName) {
          update.isApplicationNameUpdated = await httpClientInterface.setApplicationNameAsync(newReleaseHttpClientLtpUuid, applicationName);
        }
        if (update.isReleaseUpdated || update.isApplicationNameUpdated) {
          let configurationStatus = new ConfigurationStatus(
            newReleaseHttpClientLtpUuid,
            undefined,
            true);

          logicalTerminationPointConfigurationStatus.httpClientConfigurationStatus = configurationStatus;

        }
        if (protocol != currentNewReleaseRemoteProtocol) {
          update.isProtocolUpdated = await tcpClientInterface.setRemoteProtocolAsync(tcpclientUuid, protocol);
        }
        if (JSON.stringify(address) != JSON.stringify(currentNewReleaseRemoteAddress)) {
          update.isAddressUpdated = await tcpClientInterface.setRemoteAddressAsync(tcpclientUuid, address);
        }
        if (port != currentNewReleaseRemotePort) {
          update.isPortUpdated = await tcpClientInterface.setRemotePortAsync(tcpclientUuid, port);
        }      
        let serverAddress = await tcpServerInterface.getLocalAddressOfTheProtocol(protocol);
        let serverPort = await tcpServerInterface.getLocalPortOfTheProtocol(protocol);
        if (address === serverAddress && port === serverPort) {
          isdataTransferRequired = false;
        }

        if (update.isProtocolUpdated || update.isAddressUpdated || update.isPortUpdated) {
          let configurationStatus = new ConfigurationStatus(
            tcpclientUuid,
            undefined,
            true);
          logicalTerminationPointConfigurationStatus.tcpClientConfigurationStatusList = [configurationStatus];
          
        }
        if (logicalTerminationPointConfigurationStatus != undefined) {

          /****************************************************************************************
           * Prepare attributes to automate forwarding-construct
           ****************************************************************************************/
          let forwardingAutomationInputList = await prepareForwardingAutomation.bequeathYourDataAndDie(
            logicalTerminationPointConfigurationStatus
          );
          ForwardingAutomationService.automateForwardingConstructAsync(
            operationServerName,
            forwardingAutomationInputList,
            user,
            xCorrelator,
            traceIndicator,
            customerJourney
          );
        }
      }
      softwareUpgrade.upgradeSoftwareVersion(isdataTransferRequired, user, xCorrelator, traceIndicator, customerJourney)
        .catch(err => console.log(`upgradeSoftwareVersion failed with error: ${err}`));
      resolve();
    } catch (error) {
      reject(error);
    }
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
  return new Promise(async function (resolve, reject) {
    try {
      await checkApplicationExists(originator);

      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let forwardingConstructUuid = body["fc-uuid"];
      let fcPortLocalId = body["fc-port-local-id"];
      let controlConstructUuid = figureOutControlConstructUuid(forwardingConstructUuid);

      /****************************************************************************************
       * Prepare input object to 
       * configure control-construct list
       ****************************************************************************************/
      let forwardingDomainUuid = await getForwardingDomainUuid(controlConstructUuid, forwardingConstructUuid);
      if (forwardingDomainUuid != undefined) {
        let controlConstructPath = onfPaths.NETWORK_DOMAIN_CONTROL_CONSTRUCT + "=" + controlConstructUuid;
        let forwardingDomainPath = controlConstructPath + "/" + onfAttributes.CONTROL_CONSTRUCT.FORWARDING_DOMAIN + "=" + forwardingDomainUuid;
        let forwardingConstructPath = forwardingDomainPath + "/" + onfAttributes.FORWARDING_DOMAIN.FORWARDING_CONSTRUCT + "=" + forwardingConstructUuid;
        let fcPortPath = forwardingConstructPath + "/" + onfAttributes.FORWARDING_CONSTRUCT.FC_PORT + "=" + fcPortLocalId;
        let isFcPortExists = await fileOperation.readFromDatabaseAsync(fcPortPath)
        if (isFcPortExists) {
          await fileOperation.deletefromDatabaseAsync(fcPortPath,
            fcPortPath,
            true);
        }
      }
      resolve();
    } catch (error) {
      reject(error);
    }
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
      await checkApplicationExists(originator);

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
        if (isdeleted && (layerProtocolName == LayerProtocol.layerProtocolNameEnum.OPERATION_CLIENT ||
          layerProtocolName == LayerProtocol.layerProtocolNameEnum.OPERATION_SERVER)) {
          await deleteDependentFcPorts(controlConstructUuid, logicalTerminationPointUuid);
          await deleteDependentLinkPorts(logicalTerminationPointUuid);
        }
      }

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
      let applicationReleaseNumber = body["release-number"];

      /****************************************************************************************
       * Prepare logicalTerminatinPointConfigurationInput object to 
       * configure logical-termination-point
       ****************************************************************************************/
      let ownApplicationName = await httpServerInterface.getApplicationNameAsync();
      let ownApplicationReleaseNumber = await httpServerInterface.getReleaseNumberAsync();
      if (!(applicationName == ownApplicationName && applicationReleaseNumber == ownApplicationReleaseNumber)) {

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
      }
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
  return new Promise(async function (resolve, reject) {
    let response = {};
    try {
      /****************************************************************************************
       * Preparing input from request body
       ****************************************************************************************/
      let linkUuid = body["link-uuid"];

      /****************************************************************************************
       * Preparing response body
       ****************************************************************************************/

      let linkEndPointList = [];
      let link = await NetworkControlDomain.getLinkAsync(linkUuid);
      let linkPortList = link[onfAttributes.LINK.LINK_PORT];
      for (let i = 0; i < linkPortList.length; i++) {
        let linkEndPoint = {};
        let linkPort = linkPortList[i];
        let logicalTerminationPoint = linkPort[onfAttributes.LINK.LOGICAL_TERMINATION_POINT];
        let controlConstructUuid = figureOutControlConstructUuid(logicalTerminationPoint);
        let controlConstruct = (await NetworkControlDomain.getControlConstructAsync(controlConstructUuid))[0];
        linkEndPoint.operationUuid = logicalTerminationPoint;
        if (controlConstruct) {
          linkEndPoint.ltpDirection = getLtpDirection(controlConstruct, logicalTerminationPoint);
          linkEndPoint.applicationName = getApplicationName(controlConstruct);
          linkEndPoint.applicationReleaseNumber = getReleaseNumber(controlConstruct);
        }
        linkEndPointList.push(linkEndPoint);
      }
      linkEndPointList = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(linkEndPointList);
      /****************************************************************************************
       * Setting 'application/json' response body
       ****************************************************************************************/
      response['application/json'] = {
        "link-end-point-list": linkEndPointList
      };
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
  return new Promise(async function (resolve, reject) {
    let response = {};
    try {
      let linkUuidList = [];
      /****************************************************************************************
       * Preparing response body
       ****************************************************************************************/
      let linkList = await NetworkControlDomain.getLinkListAsync();
      for (let i = 0; i < linkList.length; i++) {
        let link = linkList[i];
        let linkUuid = link[onfAttributes.GLOBAL_CLASS.UUID];
        linkUuidList.push(linkUuid);
      }

      /****************************************************************************************
       * Setting 'application/json' response body
       ****************************************************************************************/
      response['application/json'] = {
        "link-uuid-list": linkUuidList
      };
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
  return new Promise(async function (resolve, reject) {
    let response = {};
    let operationServerList = [];
    try {
      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let applicationName = body["application-name"];
      let applicationReleaseNumber = body["release-number"];

      /****************************************************************************************
       * Preparing response body
       ****************************************************************************************/
      let controlConstruct = await NetworkControlDomain.getControlConstructOfTheApplication(
        applicationName,
        applicationReleaseNumber);

      if (controlConstruct) {
        let controlConstructUuid = controlConstruct[onfAttributes.GLOBAL_CLASS.UUID];
        let opertionClientUuidListWithLink = [];
        let linkList = await NetworkControlDomain.getLinkListAsync();
        for (let i = 0; i < linkList.length; i++) {
          let link = linkList[i];
          let linkPortList = link[onfAttributes.LINK.LINK_PORT];
          for (let j = 0; j < linkPortList.length; j++) {
            let linkPort = linkPortList[j];
            let portDirection = linkPort[onfAttributes.LINK.PORT_DIRECTION];
            if (portDirection == LinkPort.portDirectionEnum.INPUT) {
              let logicalTerminationPoint = linkPort[onfAttributes.LINK.LOGICAL_TERMINATION_POINT];
              let controlConstructUuidOfTheLTP = figureOutControlConstructUuid(logicalTerminationPoint);
              if (controlConstructUuidOfTheLTP == controlConstructUuid) {
                opertionClientUuidListWithLink.push(logicalTerminationPoint);
              }
            }
          }
        }

        let operationClientInformationList = getClientsReactingOnOperationServerList(controlConstruct, opertionClientUuidListWithLink);
        for (let i = 0; i < operationClientInformationList.length; i++) {
          let servingApplication = {};
          let operationClientInformation = operationClientInformationList[i];
          servingApplication.servingApplicationName = operationClientInformation.addressedApplicationName;
          servingApplication.servingApplicationReleaseNumber = operationClientInformation.addressedApplicationReleaseNumber;
          servingApplication.operationName = operationClientInformation.addressedOperationName;
          servingApplication = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(servingApplication);
          operationServerList.push(servingApplication);
        }
      }
      /****************************************************************************************
       * Setting 'application/json' response body
       ****************************************************************************************/
      response['application/json'] = {
        "operation-server-list": operationServerList
      };
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
  return new Promise(async function (resolve, reject) {
    let response = {};
    let operationClientList = [];
    try {
      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let applicationName = body["application-name"];
      let applicationReleaseNumber = body["release-number"];

      /****************************************************************************************
       * Preparing response body
       ****************************************************************************************/
      let controlConstruct = await NetworkControlDomain.getControlConstructOfTheApplication(
        applicationName,
        applicationReleaseNumber);

      if (controlConstruct) {
        let logicalTerminationPointList = controlConstruct["logical-termination-point"];

        for (let i = 0; i < logicalTerminationPointList.length; i++) {
          let logicalTerminationPoint = logicalTerminationPointList[i];
          let layerProtocol = logicalTerminationPoint["layer-protocol"][0];
          let layerProtocolName = layerProtocol["layer-protocol-name"];
          if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.HTTP_CLIENT) {
            let clientUuidList = logicalTerminationPoint["client-ltp"];

            let httpClientInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_CLIENT_INTERFACE_PAC];
            let httpClientConfiguration = httpClientInterfacePac[onfAttributes.HTTP_CLIENT.CONFIGURATION];
            let clientApplicationName = httpClientConfiguration[onfAttributes.HTTP_CLIENT.APPLICATION_NAME];
            let clientReleaseNumber = httpClientConfiguration[onfAttributes.HTTP_CLIENT.RELEASE_NUMBER];

            if (clientUuidList) {

              for (let j = 0; j < clientUuidList.length; j++) {
                let clientUuid = clientUuidList[j];

                for (let k = 0; k < logicalTerminationPointList.length; k++) {
                  let clientLogicalTerminationPoint = logicalTerminationPointList[k];
                  let clientlogicalTerminationPointUuid = clientLogicalTerminationPoint["uuid"];

                  if (clientlogicalTerminationPointUuid == clientUuid) {
                    let clientLayerProtocol = clientLogicalTerminationPoint["layer-protocol"][0];
                    let clientLayerProtocolName = clientLayerProtocol["layer-protocol-name"];

                    if (clientLayerProtocolName == LayerProtocol.layerProtocolNameEnum.OPERATION_CLIENT) {
                      let operationClientInterfacePac = clientLayerProtocol[onfAttributes.LAYER_PROTOCOL.OPERATION_CLIENT_INTERFACE_PAC];
                      let operationClientConfiguration = operationClientInterfacePac[onfAttributes.OPERATION_CLIENT.CONFIGURATION];
                      let operationName = operationClientConfiguration[onfAttributes.OPERATION_CLIENT.OPERATION_NAME];

                      let operationClient = {};
                      operationClient.servingApplicationName = clientApplicationName;
                      operationClient.servingApplicationReleaseNumber = clientReleaseNumber;
                      operationClient.operationName = operationName;
                      operationClient = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(operationClient);

                      operationClientList.push(operationClient);
                    }
                  }
                }
              }
            }
          }
        }
      }

      /****************************************************************************************
       * Setting 'application/json' response body
       ****************************************************************************************/
      response['application/json'] = {
        "operation-client-list": operationClientList
      };
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
  return new Promise(async function (resolve, reject) {
    let response = {};
    let operationClientList = [];
    try {
      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let applicationName = body["receiving-application-name"];
      let applicationReleaseNumber = body["receiving-application-release-number"];
      let operationServerName = body["receiving-operation"];

      /****************************************************************************************
       * Preparing response body
       ****************************************************************************************/
      let controlConstruct = await NetworkControlDomain.getControlConstructOfTheApplication(
        applicationName,
        applicationReleaseNumber);
      if (controlConstruct) {
        let operationServerUuid = getOperationServerUuid(controlConstruct, operationServerName);
        if (operationServerUuid) {
          let operationClientsUuidsReactingOnOperationServerList = getOperationClientsUuidsReactingOnOperationServerList(
            controlConstruct,
            operationServerUuid
          );
          if (operationClientsUuidsReactingOnOperationServerList) {
            let clientsReactingOnOperationServerList = getClientsReactingOnOperationServerList(
              controlConstruct,
              operationClientsUuidsReactingOnOperationServerList
            );
            if (clientsReactingOnOperationServerList) {
              operationClientList = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(clientsReactingOnOperationServerList);
            }
          }
        }
      }

      /****************************************************************************************
       * Setting 'application/json' response body
       ****************************************************************************************/
      response['application/json'] = {
        "operation-client-list": operationClientList
      };
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
  return new Promise(async function (resolve, reject) {
    let response = {};
    let operationServerNameList = [];
    try {
      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let applicationName = body["application-name"];
      let applicationReleaseNumber = body["release-number"];

      /****************************************************************************************
       * Preparing response body
       ****************************************************************************************/
      let controlConstruct = await NetworkControlDomain.getControlConstructOfTheApplication(
        applicationName,
        applicationReleaseNumber);
      if (controlConstruct) {
        let logicalTerminationPointList = controlConstruct["logical-termination-point"];
        for (let i = 0; i < logicalTerminationPointList.length; i++) {
          let logicalTerminationPoint = logicalTerminationPointList[i];
          let layerProtocol = logicalTerminationPoint["layer-protocol"][0];
          let layerProtocolName = layerProtocol["layer-protocol-name"];
          if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.OPERATION_SERVER) {
            let operationServerInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.OPERATION_SERVER_INTERFACE_PAC];
            let operationServerCapability = operationServerInterfacePac[onfAttributes.OPERATION_SERVER.CAPABILITY];
            let operationName = operationServerCapability[onfAttributes.OPERATION_SERVER.OPERATION_NAME];
            operationServerNameList.push(operationName);
          }
        }
      }

      /****************************************************************************************
       * Setting 'application/json' response body
       ****************************************************************************************/
      response['application/json'] = {
        "operation-server-name-list": operationServerNameList
      };
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
exports.notifyLinkUpdates = function (body, user, originator, xCorrelator, traceIndicator, customerJourney, operationServerName) {
  return new Promise(async function (resolve, reject) {
    try {

      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let applicationName = body["subscriber-application"];
      let releaseNumber = body["subscriber-release-number"];
      let subscriberOperation = body["subscriber-operation"];

      let tcpServerList = [
        {
          protocol: body["subscriber-protocol"],
          address: body["subscriber-address"],
          port: body["subscriber-port"]
        }
      ];


      let operationNamesByAttributes = new Map();
      operationNamesByAttributes.set("regard-updated-link", subscriberOperation);
      /****************************************************************************************
       * Prepare logicalTerminatinPointConfigurationInput object to 
       * configure logical-termination-point
       ****************************************************************************************/



      let logicalTerminatinPointConfigurationInput = new LogicalTerminatinPointConfigurationInput(
        applicationName,
        releaseNumber,
        tcpServerList,
        operationServerName,
        operationNamesByAttributes,
        individualServicesOperationsMapping.individualServicesOperationsMapping
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
        forwardingConfigurationInputList = await prepareForwardingConfiguration.notifyLinkUpdates(
          operationClientConfigurationStatusList,
          subscriberOperation
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
      let forwardingAutomationInputList = await prepareForwardingAutomation.notifyLinkUpdates(
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
      let releaseNumber = body["release-number"];
      let tcpServerList = [
        {
          protocol: body["protocol"],
          address: body["address"],
          port: body["port"]
        }
      ];


      let redirectTopologyInformationOperation = "/v1/redirect-topology-change-information";

      let operationNamesByAttributes = new Map();

      operationNamesByAttributes.set("redirect-topology-change-information", redirectTopologyInformationOperation);

      /****************************************************************************************
       * Prepare logicalTerminatinPointConfigurationInput object to 
       * configure logical-termination-point
       ****************************************************************************************/

      let logicalTerminatinPointConfigurationInput = new LogicalTerminatinPointConfigurationInput(
        applicationName,
        releaseNumber,
        tcpServerList,
        operationServerName,
        operationNamesByAttributes,
        individualServicesOperationsMapping.individualServicesOperationsMapping
      );
      let logicalTerminationPointconfigurationStatus = await LogicalTerminationPointService.findOrCreateApplicationInformationAsync(
        logicalTerminatinPointConfigurationInput
      );


      /****************************************************************************************
       * Prepare attributes to configure forwarding-construct
       ****************************************************************************************/
      let ownApplicationName = await httpServerInterface.getApplicationNameAsync();
      let ownApplicationReleaseNumber = await httpServerInterface.getReleaseNumberAsync();
      if (!(applicationName == ownApplicationName && releaseNumber == ownApplicationReleaseNumber)) {
        let forwardingConfigurationInputList = [];
        let forwardingConstructConfigurationStatus;
        let operationClientConfigurationStatusList = logicalTerminationPointconfigurationStatus.operationClientConfigurationStatusList;

        if (operationClientConfigurationStatusList) {
          forwardingConfigurationInputList = await prepareForwardingConfiguration.regardApplication(
            operationClientConfigurationStatusList,
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
          releaseNumber
        );
        let response = ForwardingAutomationService.automateForwardingConstructAsync(
          operationServerName,
          forwardingAutomationInputList,
          user,
          xCorrelator,
          traceIndicator,
          customerJourney
        );

        if (response === undefined || Object.keys(response).length === 0) {
          resolve();
        }
        // response is full control construct of regarded application

        await elasticsearchService.createOrUpdateControlConstructInES(response["core-model-1-4:control-construct"]);

        let logicalTerminationPoints = response["core-model-1-4:control-construct"]["logical-termination-point"];
        let operationServerNames = getAllOperationServerNameAsync(logicalTerminationPoints);
        for (let operationServerName of operationServerNames) {
          let endPointDetails = {
            'serving-application-name': applicationName,
            'serving-application-release-number': applicationReleaseNumber,
            'operationServerName': operationServerName,
            'consuming-application-name': ownApplicationName,
            'consuming-application-release-number': ownApplicationReleaseNumber
          }
          await LinkServices.findOrCreateLinkForTheEndPointsAsync(endPointDetails);
        }
      }
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
exports.removeOperationClientFromLink = function (body, user, originator, xCorrelator, traceIndicator, customerJourney, operationServerName) {
  return new Promise(async function (resolve, reject) {
    try {

      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let EndPointDetails = body;

      /****************************************************************************************
       * Prepare logicalTerminatinPointConfigurationInput object to 
       * configure logical-termination-point
       ****************************************************************************************/
      let linkUuid = await LinkServices.deleteOperationClientFromTheEndPointsAsync(EndPointDetails);


      /****************************************************************************************
       * Prepare attributes to automate forwarding-construct
       ****************************************************************************************/
      let forwardingAutomationInputList = await prepareForwardingAutomation.removeOperationClientFromLink(
        linkUuid
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
 * Existing documentation of all interfaces and internal connections will be replaced for the same CcUuid
 *
 * body V1_updateallltpsandfcs_body
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:network-control-domain/control-construct=alt-2-0-1/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-capability/application-name]'
 * no response value expected for this operation
 **/
exports.updateAllLtpsAndFcs = async function (body, originator) {
  await checkApplicationExists(originator);
  await createOrUpdateControlConstructInES(body);
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
  return new Promise(async function (resolve, reject) {
    try {
      await checkApplicationExists(originator);

      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let forwardingConstruct = body;
      let forwardingConstructUuid = forwardingConstruct["uuid"];
      let controlConstructUuid = figureOutControlConstructUuid(forwardingConstructUuid);

      /****************************************************************************************
       * Get the forwarding construct list to be updated
       ****************************************************************************************/
       let forwardingConstructListToBeUpdated = await getForwardingConstructListToUpdateFc(controlConstructUuid, forwardingConstructUuid, forwardingConstruct);
     
       let response = await updateForwardingConstrutList(forwardingConstructListToBeUpdated,forwardingConstructUuid) 
      
      if(response && response.body.result === 'updated') {
        resolve();
      } else {
        throw new Error ('fc is not updated')
      }
    } catch (error) {
      reject(error);
    }
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
  return new Promise(async function (resolve, reject) {
    try {
      await checkApplicationExists(originator);

      /****************************************************************************************
       * Setting up required local variables from the request body
       ****************************************************************************************/
      let forwardingConstructUuid = body["fc-uuid"];
      let fcPort = body["fc-port"];
      let fcPortLocalId = fcPort["local-id"];
      let controlConstructUuid = figureOutControlConstructUuid(forwardingConstructUuid);

      /****************************************************************************************
       * Prepare input object to 
       * configure control-construct list
       ****************************************************************************************/
      let forwardingDomainUuid = await getForwardingDomainUuid(controlConstructUuid, forwardingConstructUuid);
      if (forwardingDomainUuid != undefined) {
        let controlConstructPath = onfPaths.NETWORK_DOMAIN_CONTROL_CONSTRUCT + "=" + controlConstructUuid;
        let forwardingDomainPath = controlConstructPath + "/" + onfAttributes.CONTROL_CONSTRUCT.FORWARDING_DOMAIN + "=" + forwardingDomainUuid;
        let forardingConstructPath = forwardingDomainPath + "/" + onfAttributes.FORWARDING_DOMAIN.FORWARDING_CONSTRUCT;
        let forwardingConstructPathForTheUuid = forardingConstructPath + "=" + forwardingConstructUuid;
        let fcPortPath = forwardingConstructPathForTheUuid + "/fc-port";
        let fcPortPathForTheUuid = fcPortPath + "=" + fcPortLocalId

        let existingFcPort = await fileOperation.readFromDatabaseAsync(fcPortPathForTheUuid);

        if (existingFcPort) {
          let existingFcPortAsAString = JSON.stringify(existingFcPort);
          let newFcPortAsAString = JSON.stringify(fcPort);
          if (existingFcPortAsAString != newFcPortAsAString) {
            await fileOperation.deletefromDatabaseAsync(fcPortPathForTheUuid,
              existingFcPort,
              true);
            await fileOperation.writeToDatabaseAsync(fcPortPath,
              fcPort,
              true);
          }
        } else {
          await fileOperation.writeToDatabaseAsync(fcPortPath,
            fcPort,
            true);
        }
      }
      resolve();
    } catch (error) {
      reject(error);
    }
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
      await checkApplicationExists(originator);

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
    let httpClientUuidList = [];
    let LogicalTerminationPointlist;
    const forwardingName = 'NewApplicationCausesRequestForTopologyChangeInformation';
    try {


      let ForwardConstructName = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName)
      let ForwardConstructUuid = ForwardConstructName[onfAttributes.GLOBAL_CLASS.UUID]

      let ListofUuid = await ForwardingConstruct.getFcPortListAsync(ForwardConstructUuid)
      for (let i = 0; i < ListofUuid.length; i++) {
        let PortDirection = ListofUuid[i][[onfAttributes.FC_PORT.PORT_DIRECTION]]

        if (PortDirection === FcPort.portDirectionEnum.OUTPUT) {
          LogicalTerminationPointlist = ListofUuid[i][onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT]
          let httpClientUuid = await logicalTerminationPoint.getServerLtpListAsync(LogicalTerminationPointlist)
          httpClientUuidList.push(httpClientUuid[0]);
        }
      }
      for (let j = 0; j < httpClientUuidList.length; j++) {
        let httpClientUuid = httpClientUuidList[j];
        let applicationName = await httpClientInterface.getApplicationNameAsync(httpClientUuid);
        let applicationReleaseNumber = await httpClientInterface.getReleaseNumberAsync(httpClientUuid);
        let serverLtp = await logicalTerminationPoint.getServerLtpListAsync(httpClientUuid);
        let tcpClientUuid = serverLtp[0];
        let applicationAddress = await tcpClientInterface.getRemoteAddressAsync(tcpClientUuid);
        let applicationPort = await tcpClientInterface.getRemotePortAsync(tcpClientUuid);
        let applicationProtocol = await tcpClientInterface.getRemoteProtocolAsync(tcpClientUuid);

        let application = {};
        application.applicationName = applicationName,
          application.releaseNumber = applicationReleaseNumber,
          application.protocol = applicationProtocol,
          application.address = applicationAddress,
          application.port = applicationPort,

          clientApplicationList.push(application);
      }
      resolve(clientApplicationList);
    } catch (error) {
      reject();
    }
  });
}

async function updateForwardingConstrutList(forwardingConstructToBeUpdated, forwardingConstructUuid) {
  return new Promise(async function (resolve, reject) {
    try {
    let client = await elasticsearchService.getClient(false, "alt-2-0-1-es-c-es-1-0-0-000");
        let indexAlias = await getIndexAliasAsync("alt-2-0-1-es-c-es-1-0-0-000");
       let response;
        if (Object.keys(forwardingConstructToBeUpdated).length >= 2) {

           response = await client.update({
            index: indexAlias,
            id: forwardingConstructToBeUpdated.documentId,
            body : {
            script: {
                source : "ctx._source['forwarding-domain'][0]['forwarding-construct'] = params['forwardingConstructList']",
                params : {
                  "uuid": forwardingConstructUuid,
                  "forwardingConstructList" : forwardingConstructToBeUpdated.forwardingConstructList
                }
              },
            },
        }); 
      }
      resolve(response);
    } catch (error) {
      reject(error);
    }
  });
}

async function getForwardingDomainFromControlConstruct(controlConstructUuid) {
  return new Promise(async function (resolve, reject) {
    let forwardingDomainOfControlConstruct = {}
    try {
      let client = await elasticsearchService.getClient(false, "alt-2-0-1-es-c-es-1-0-0-000");
      let indexAlias = await getIndexAliasAsync("alt-2-0-1-es-c-es-1-0-0-000");
      let res = await client.search({
        index: indexAlias,
        filter_path : "hits.hits._id,hits.hits._source.forwarding-domain",
        body: {
          "query" : {
              "match":{
                "uuid" : controlConstructUuid
             }
            
           }
          
        }
      
      })
      
      if(Object.keys(res.body).length != 0) {
        forwardingDomainOfControlConstruct.forwardingDomainList = res.body.hits.hits[0]._source['forwarding-domain'];
        forwardingDomainOfControlConstruct.id = res.body.hits.hits[0]._id;
      } 
      resolve(forwardingDomainOfControlConstruct);
    } catch (error) {
      reject(error);
    }
  });
}

async function getForwardingConstructListToUpdateFc(controlConstructUuid, forwardingConstructUuid, forwardingConstructFromRequest) {
  return new Promise(async function (resolve, reject) {
    let forwardingConstruct = {};
    let forwardingConstructList;
    try {  
      
      let forwardingDomainOfControlConstruct = await getForwardingDomainFromControlConstruct(controlConstructUuid);
     
      let forwardingDomainList = forwardingDomainOfControlConstruct.forwardingDomainList;
      let documentId = forwardingDomainOfControlConstruct.id;
      /*************************************************************************************
       * configure forwarding construct list based on the incoming forwardingConstructUuid
       *************************************************************************************/
      if (Object.keys(forwardingDomainOfControlConstruct).length != 0) {
           let forwardingDomain = forwardingDomainList[0];
           forwardingConstructList = forwardingDomain[onfAttributes.FORWARDING_DOMAIN.FORWARDING_CONSTRUCT];
          let indexOfIncomingForwardingConstructUuid = forwardingConstructList.map(forwardingConstruct => forwardingConstruct.uuid).indexOf(forwardingConstructUuid);
          if(indexOfIncomingForwardingConstructUuid == -1){
              forwardingConstructList.push(forwardingConstructFromRequest)
          } else {
             let forwardingConstruct = forwardingConstructList.at(indexOfIncomingForwardingConstructUuid);
              if(JSON.stringify(forwardingConstruct) != JSON.stringify(forwardingConstructFromRequest)){
                forwardingConstructList.splice(indexOfIncomingForwardingConstructUuid,1,forwardingConstructFromRequest)
              }
            }forwardingConstruct.documentId = documentId;
            forwardingConstruct.forwardingConstructList = forwardingConstructList;
          }
      
      resolve(forwardingConstruct);
    } catch (error) {
      reject(error);
    }
  });
}

async function getForwardingDomainUuid(controlConstructUuid, forwardingConstructUuid) {
  return new Promise(async function (resolve, reject) {
    let forwardingDomainUuid;
    try {
      let controlConstructPath = onfPaths.NETWORK_DOMAIN_CONTROL_CONSTRUCT + "=" + controlConstructUuid;
      let forwardingConstructPath = controlConstructPath + "/" + onfAttributes.CONTROL_CONSTRUCT.FORWARDING_DOMAIN;

      let forwardingDomainList = await fileOperation.readFromDatabaseAsync(
        forwardingConstructPath);
      /*************************************************************************************
       ****************delete dependents , if a fc-port exist for them***********************
       *************************************************************************************/
      if (forwardingDomainList != undefined) {
        for (let i = 0; i < forwardingDomainList.length; i++) {
          let forwardingDomain = forwardingDomainList[i];
          let forwardingConstructList = forwardingDomain[onfAttributes.FORWARDING_DOMAIN.FORWARDING_CONSTRUCT];

          for (let j = 0; j < forwardingConstructList.length; j++) {
            let forwardingConstruct = forwardingConstructList[j];
            let _forwardingConstructUuid = forwardingConstruct[onfAttributes.GLOBAL_CLASS.UUID];
            if (_forwardingConstructUuid == forwardingConstructUuid) {
              forwardingDomainUuid = forwardingDomain[onfAttributes.GLOBAL_CLASS.UUID];
            }
          }
        }
      }
      resolve(forwardingDomainUuid);
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
          if (linkPortList) {
            for (let j = 0; j < linkPortList.length; j++) {
              let linkPort = linkPortList[j];
              let linkPortLogicalTerminationPoint = linkPort["logical-termination-point"];
              if (linkPortLogicalTerminationPoint == logicalTerminationPointUuid) {
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

/***************************************************************************************************************
 ****************** Funtions that are specific to the addOperationClientToLink ************
 ***************************************************************************************************************/

 /**
  * Extracts operation server names from given list of LTPs.
  * @param {List} logicalTerminationPoints LTPs from which the operation server names should be extracted
  * @returns {List} of operation server names
  */
function getAllOperationServerNameAsync(logicalTerminationPoints) {
  let operationServerNames = [];
  for (let logicalTerminationPoint of logicalTerminationPoints) {
    let protocols = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL];
    let protocol = protocols[0];
    let protocolName = protocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
    if (LayerProtocol.layerProtocolNameEnum.OPERATION_SERVER === protocolName) {
      let operationServerPac = protocol[onfAttributes.LAYER_PROTOCOL.OPERATION_SERVER_INTERFACE_PAC];
      let operationServerConfiguration = operationServerPac[onfAttributes.OPERATION_SERVER.CONFIGURATION];
      operationServerNames.push(operationServerConfiguration[onfAttributes.OPERATION_SERVER.OPERATION_NAME]);
    }
  }
  return operationServerNames;
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




/***************************************************************************************************************
 ****************** Funtions that are specific to the listOperationClientsReactingOnOperationServer ************
 ***************************************************************************************************************/

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
 * This function gets the operation client uuids reacting on the operation server list
 * @param {*} controlConstruct 
 * @param {*} operationServerUuid 
 * @returns array
 */
function getOperationClientsUuidsReactingOnOperationServerList(controlConstruct, operationServerUuid) {
  let operationClientsUuidsReactingOnOperationServerList = [];
  try {
    let forwardingDomainList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.FORWARDING_DOMAIN];
    for (let i = 0; i < forwardingDomainList.length; i++) {
      let forwardingDomain = forwardingDomainList[i];
      let forwardingConstructList = forwardingDomain[onfAttributes.FORWARDING_DOMAIN.FORWARDING_CONSTRUCT];
      for (let j = 0; j < forwardingConstructList.length; j++) {
        let forwardingConstruct = forwardingConstructList[j];
        let fcOutputUuidList = getFcOutputUuidListforTheInput(forwardingConstruct, operationServerUuid);
        for (let k = 0; k < fcOutputUuidList.length; k++) {
          let fcOutputUuid = fcOutputUuidList[k];
          operationClientsUuidsReactingOnOperationServerList.push(fcOutputUuid);
        }
      }
    }
    return operationClientsUuidsReactingOnOperationServerList;
  } catch (error) {
    console.log(error)
  }
}

/**
 * This function returns the list of output fc-port uuids for the operationServerUuid in the given forwardingConstruct
 * @param {*} forwardingConstruct 
 * @param {*} operationServerUuid 
 * @returns array
 */
function getFcOutputUuidListforTheInput(forwardingConstruct, operationServerUuid) {
  let fcOutputUuidList = [];
  try {
    if (isOperationServerIsInInput(forwardingConstruct, operationServerUuid)) {
      let fcPortList = forwardingConstruct["fc-port"];
      for (let i = 0; i < fcPortList.length; i++) {
        let fcPort = fcPortList[i];
        let fcPortDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
        if (fcPortDirection == FcPort.portDirectionEnum.OUTPUT) {
          let logicalTerminationPoint = fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT];
          fcOutputUuidList.push(logicalTerminationPoint);
        }
      }
    }
    return fcOutputUuidList;
  } catch (error) {
    console.log(error)
  }
}


/**
 * This function returns true if the operation server is listed as a input port in given forwarding construct
 * @param {*} forwardingConstruct 
 * @param {*} operationServerUuid 
 * @returns boolean
 */
function isOperationServerIsInInput(forwardingConstruct, operationServerUuid) {
  let isOperationServerUuidIsAInput = false;
  try {
    let fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
    for (let i = 0; i < fcPortList.length; i++) {
      let fcPort = fcPortList[i];
      let fcPortDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
      if (fcPortDirection == FcPort.portDirectionEnum.INPUT) {
        let logicalTerminationPoint = fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT];
        if (logicalTerminationPoint == operationServerUuid) {
          isOperationServerUuidIsAInput = true;
        }
      }
    }
    return isOperationServerUuidIsAInput;
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
function getClientsReactingOnOperationServerList(controlConstruct,
  operationClientsUuidsReactingOnOperationServerList) {
  let clientsReactingOnOperationServerList = [];
  try {
    let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
    for (let i = 0; i < logicalTerminationPointList.length; i++) {
      let logicalTerminationPoint = logicalTerminationPointList[i];
      let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
      let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
      if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.HTTP_CLIENT) {
        let clientLtpList = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.CLIENT_LTP];
        for (let j = 0; j < clientLtpList.length; j++) {
          let clientLtp = clientLtpList[j];
          if (operationClientsUuidsReactingOnOperationServerList.includes(clientLtp)) {
            let httpClientInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_CLIENT_INTERFACE_PAC];
            let httpClientConfiguration = httpClientInterfacePac[onfAttributes.HTTP_CLIENT.CONFIGURATION];
            let operationName = getOperationNameOfTheOperationClient(logicalTerminationPointList,
              clientLtp);
            let applicationName = httpClientConfiguration[onfAttributes.HTTP_CLIENT.APPLICATION_NAME];
            let releaseNumber = httpClientConfiguration[onfAttributes.HTTP_CLIENT.RELEASE_NUMBER];
            let clientDetails = {};
            clientDetails.addressedApplicationName = applicationName;
            clientDetails.addressedApplicationReleaseNumber = releaseNumber;
            clientDetails.addressedOperationName = operationName;
            clientsReactingOnOperationServerList.push(clientDetails);
          }
        }
      }
    }
    return clientsReactingOnOperationServerList;
  } catch (error) {
    console.log(error)
  }
}


/**
 * This function returns the operation name of the operation client uuid
 * @param {*} uuid 
 * @returns operationName
 */
function getOperationNameOfTheOperationClient(logicalTerminationPointList,
  operationClientsUuid) {
  let operationName;
  try {
    for (let i = 0; i < logicalTerminationPointList.length; i++) {
      let logicalTerminationPoint = logicalTerminationPointList[i];
      let logicalTerminationPointUuid = logicalTerminationPoint[onfAttributes.GLOBAL_CLASS.UUID];
      let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
      let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
      if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.OPERATION_CLIENT &&
        logicalTerminationPointUuid == operationClientsUuid) {
        let operationClientInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.OPERATION_CLIENT_INTERFACE_PAC];
        let operaitonClientConfiguration = operationClientInterfacePac[onfAttributes.OPERATION_CLIENT.CONFIGURATION];
        operationName = operaitonClientConfiguration[onfAttributes.OPERATION_CLIENT.OPERATION_NAME];
      }
    }
    return operationName;
  } catch (error) {
    console.log(error)
  }
}

/***************************************************************************************************************
 * End point details
 **************************************************************************************************************/

/**
 * This function returns the list of clients information reacting on the operation server 
 * @param {*} controlConstruct 
 * @param {*} operationClientsUuidsReactingOnOperationServerList 
 * @returns object in the form of {addressedApplicationName:"name",
 * addressedApplicationReleaseNumber:"0.0.1" ,addressedOperationName:"/v1/service1"}
 */
function getApplicationName(controlConstruct) {
  let applicationName;
  try {
    let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
    for (let i = 0; i < logicalTerminationPointList.length; i++) {
      let logicalTerminationPoint = logicalTerminationPointList[i];
      let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
      let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
      if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.HTTP_SERVER) {
        let httpServerInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_SERVER_INTERFACE_PAC];
        let httpServerCapability = httpServerInterfacePac[onfAttributes.HTTP_SERVER.CAPABILITY];
        applicationName = httpServerCapability[onfAttributes.HTTP_SERVER.APPLICATION_NAME];
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
function getReleaseNumber(controlConstruct) {
  let releaseNumber;
  try {
    let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
    for (let i = 0; i < logicalTerminationPointList.length; i++) {
      let logicalTerminationPoint = logicalTerminationPointList[i];
      let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
      let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
      if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.HTTP_SERVER) {
        let httpServerInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_SERVER_INTERFACE_PAC];
        let httpServerCapability = httpServerInterfacePac[onfAttributes.HTTP_SERVER.CAPABILITY];
        releaseNumber = httpServerCapability[onfAttributes.HTTP_SERVER.RELEASE_NUMBER];
      }
    }
    return releaseNumber;
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
function getLtpDirection(controlConstruct,
  operationServerUuid) {
  let ltpDirection;
  try {
    let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
    for (let i = 0; i < logicalTerminationPointList.length; i++) {
      let logicalTerminationPoint = logicalTerminationPointList[i];
      let logicalTerminationPointuuid = logicalTerminationPoint[onfAttributes.GLOBAL_CLASS.UUID];
      if (logicalTerminationPointuuid == operationServerUuid) {
        ltpDirection = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LTP_DIRECTION];
      }
    }
    return ltpDirection;
  } catch (error) {
    console.log(error)
  }
}
/**********************************************************************************************************
 * Generic functions used across 
 **********************************************************************************************************/

/**
 * This function provides the uuid of the control-construct based on the logical-termination-point (or) 
 * forwarding-domain (or) forwarding-construct uuid
 * @param {*} uuid 
 * @returns controlConstructUuid
 */
function figureOutControlConstructUuid(uuid) {
  let controlConstructUuid = uuid.split('-').slice(0, 4).join("-");
  return controlConstructUuid;
}

/**
 * This function provides the values of the key from the provided nameList
 * @param {*} nameList 
 * @param {*} key 
 * @returns keyValue
 */
function getValueFromKey(nameList, key) {
  for (let i = 0; i < nameList.length; i++) {
    let valueName = nameList[i]["value-name"];
    if (valueName == key) {
      return nameList[i]["value"];
    }
  }
  return undefined;
}

/**
 * Checks if http-client LTP with the given application name exists. Throws Error if not. 
 * @param {string} applicationName
 * @throws {Error} Will throw an error if the application does not exist.
 */
async function checkApplicationExists(applicationName) {
  const applicationExists = await httpClientInterface.isApplicationExists(applicationName);
  if (!applicationExists) {
    throw new Error(`Application ${applicationName} is not in the list of known applications.`);
  }
}


var resolveHttpClient = exports.resolveHttpClientLtpUuidFromForwardingName = function () {
  return new Promise(async function (resolve, reject) {
    try {
      const forwardingName = 'PromptForBequeathingDataCausesTransferOfListOfApplications';
      let uuidlist = {};
      let ForwardConstructName = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName)
      if (ForwardConstructName === undefined) {
        return {};
      }
      let ForwardConstructUuid = ForwardConstructName[onfAttributes.GLOBAL_CLASS.UUID]
      let listofUuid = await ForwardingConstruct.getFcPortListAsync(ForwardConstructUuid)
      let fcPort = listofUuid.find(fcp => fcp[onfAttributes.FC_PORT.PORT_DIRECTION] === FcPort.portDirectionEnum.OUTPUT);
      let operationClientUuid = fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT];
          let httpClientUuid = (await logicalTerminationPoint.getServerLtpListAsync(operationClientUuid))[0]
          let tcpClientUuid = (await logicalTerminationPoint.getServerLtpListAsync(httpClientUuid))[0]
          uuidlist = {
            httpClientUuid, tcpClientUuid
          }
      resolve(uuidlist)
    } catch (error) {
      console.log(error)
    }
  })
}
