'use strict';

const LogicalTerminatinPointConfigurationInput = require('../applicationPattern/onfModel/services/models/logicalTerminationPoint/ConfigurationInput');
const LogicalTerminationPointService = require('../applicationPattern/onfModel/services/LogicalTerminationPointServices');
const LogicalTerminationPointConfigurationStatus = require('../applicationPattern/onfModel/services/models/logicalTerminationPoint/ConfigurationStatus');
const layerProtocol = require('../applicationPattern/onfModel/models/LayerProtocol');

const LinkServices = require('../applicationPattern/onfModel/services/LinkServices');

const ForwardingConfigurationService = require('../applicationPattern/onfModel/services/ForwardingConstructConfigurationServices');
const ForwardingAutomationService = require('../applicationPattern/onfModel/services/ForwardingConstructAutomationServices');
const prepareForwardingConfiguration = require('./individualServices/PrepareForwardingConfiguration');
const prepareForwardingAutomation = require('./individualServices/PrepareForwardingAutomation');
const softwareUpgrade = require('./individualServices/SoftwareUpgrade');
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
const LinkPort = require('../applicationPattern/onfModel/models/LinkPort');
const Link = require('../applicationPattern/onfModel/models/Link');
const TcpServerInterface = require('../applicationPattern/onfModel/models/layerProtocols/TcpServerInterface');
const { elasticsearchService, getIndexAliasAsync } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');

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
      let applicationAddress = body["new-application-address"];
      let applicationPort = body["new-application-port"];

      /****************************************************************************************
       * Prepare logicalTerminatinPointConfigurationInput object to 
       * configure logical-termination-point
       ****************************************************************************************/
      let isdataTransferRequired = true;
      let newReleaseUuid = await httpClientInterface.getHttpClientUuidAsync("NewRelease");
      let currentApplicationName = await httpServerInterface.getApplicationNameAsync();
      if (currentApplicationName == applicationName) {
        let isUpdated = await httpClientInterface.setReleaseNumberAsync(newReleaseUuid, releaseNumber);
        let currentApplicationRemoteAddress = await TcpServerInterface.getLocalAddress();
        let currentApplicationRemotePort = await TcpServerInterface.getLocalPort();
        if ((applicationAddress == currentApplicationRemoteAddress) &&
          (applicationPort == currentApplicationRemotePort)) {
          isdataTransferRequired = false;
        }
        if (isUpdated) {
          applicationName = await httpClientInterface.getApplicationNameAsync(newReleaseUuid);
          let operationList = [];
          let logicalTerminatinPointConfigurationInput = new LogicalTerminatinPointConfigurationInput(
            applicationName,
            releaseNumber,
            applicationAddress,
            applicationPort,
            operationList
          );
          let logicalTerminationPointconfigurationStatus = await LogicalTerminationPointService.createOrUpdateApplicationInformationAsync(
            logicalTerminatinPointConfigurationInput
          );

          /****************************************************************************************
           * Prepare attributes to automate forwarding-construct
           ****************************************************************************************/
          let forwardingAutomationInputList = await prepareForwardingAutomation.bequeathYourDataAndDie(
            logicalTerminationPointconfigurationStatus
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
      let applicationReleaseNumber = body["application-release-number"];

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
        let controlConstruct = await NetworkControlDomain.getControlConstructAsync(controlConstructUuid);
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
      let applicationReleaseNumber = body["application-release-number"];

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
      let applicationReleaseNumber = body["application-release-number"];

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
            let httpClientCapability = httpClientInterfacePac[onfAttributes.HTTP_CLIENT.CAPABILITY];
            let httpClientConfiguration = httpClientInterfacePac[onfAttributes.HTTP_CLIENT.CONFIGURATION];
            let clientApplicationName = httpClientCapability[onfAttributes.HTTP_CLIENT.APPLICATION_NAME];
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
      let applicationReleaseNumber = body["application-release-number"];

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
      let applicationAddress = body["subscriber-address"];
      let applicationPort = body["subscriber-port"];
      let subscriberOperation = body["subscriber-operation"];

      /****************************************************************************************
       * Prepare logicalTerminatinPointConfigurationInput object to 
       * configure logical-termination-point
       ****************************************************************************************/

      let operationList = [
        subscriberOperation
      ];
      let logicalTerminatinPointConfigurationInput = new LogicalTerminatinPointConfigurationInput(
        applicationName,
        releaseNumber,
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
      let ownApplicationName = await httpServerInterface.getApplicationNameAsync();
      let ownApplicationReleaseNumber = await httpServerInterface.getReleaseNumberAsync();
      if (!(applicationName == ownApplicationName && applicationReleaseNumber == ownApplicationReleaseNumber)) {
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
        await createOrUpdateControlConstructInES(response);

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
  return new Promise(async function (resolve, reject) {
    let response = {};
    try {
      /****************************************************************************************
       * Preparing consequent-action-list for response body
       ****************************************************************************************/
      let consequentActionList = [];
      let protocol = "http";

      let localAddress = await tcpServerInterface.getLocalAddress();
      let localPort = await tcpServerInterface.getLocalPort();
      let baseUrl = protocol + "://" + localAddress + ":" + localPort

      let informAboutApplicationOperationServerUuid = "alt-0-0-1-op-s-2002";
      let informAboutApplicationOperationName = await operationServerInterface.getOperationNameAsync(
        informAboutApplicationOperationServerUuid);

      let LabelForInformAboutApplication = "Inform about Application";
      let requestForInformAboutApplication = baseUrl + informAboutApplicationOperationName;
      let consequentActionForInformAboutApplication = new consequentAction(
        LabelForInformAboutApplication,
        requestForInformAboutApplication,
        false
      );
      consequentActionList.push(consequentActionForInformAboutApplication);
      /****************************************************************************************
       * Preparing response-value-list for response body
       ****************************************************************************************/
      let responseValueList = [];
      let applicationName = await httpServerInterface.getApplicationNameAsync();
      let reponseValue = new responseValue(
        "applicationName",
        applicationName,
        typeof applicationName
      );

      responseValueList.push(reponseValue);

      /****************************************************************************************
       * Setting 'application/json' response body
       ****************************************************************************************/
      response['application/json'] = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase({
        consequentActionList,
        responseValueList
      });
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
      await checkApplicationExists(originator);

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
       * Prepare input object to 
       * configure control-construct list
       ****************************************************************************************/
      let forwardingDomainUuid = await getForwardingDomainUuid(controlConstructUuid, forwardingConstructUuid);
      if (forwardingDomainUuid != undefined) {
        let controlConstructPath = onfPaths.NETWORK_DOMAIN_CONTROL_CONSTRUCT + "=" + controlConstructUuid;
        let forwardingDomainPath = controlConstructPath + "/" + onfAttributes.CONTROL_CONSTRUCT.FORWARDING_DOMAIN + "=" + forwardingDomainUuid;
        let forardingConstructPath = forwardingDomainPath + "/" + onfAttributes.FORWARDING_DOMAIN.FORWARDING_CONSTRUCT;
        let forwardingConstructPathForTheUuid = forardingConstructPath + "=" + forwardingConstructUuid;

        let existingForwardingConstruct = await fileOperation.readFromDatabaseAsync(forwardingConstructPathForTheUuid);

        if (existingForwardingConstruct) {
          let existingForwardingConstructAsAString = JSON.stringify(existingForwardingConstruct);
          let newForwardingConstructAsAString = JSON.stringify(forwardingConstruct);
          if (existingForwardingConstructAsAString != newForwardingConstructAsAString) {
            await fileOperation.deletefromDatabaseAsync(forwardingConstructPathForTheUuid,
              existingForwardingConstruct,
              true);
            await fileOperation.writeToDatabaseAsync(forardingConstructPath,
              forwardingConstruct,
              true);
          }
        } else {
          await fileOperation.writeToDatabaseAsync(forardingConstructPath,
            forwardingConstruct,
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
 * Creates or updates control-construct document in ES.
 *
 * The existence of document is determined by control-construct UUID.
 * If a document with such UUID already exists under configured index alias,
 * it will be replaced, otherwise, it will be inserted as a new document.
 *
 * @param {Object} construct Full control-construct
 * @returns response from Elasticsearch index operation
 */
async function createOrUpdateControlConstructInES(construct) {
  let uuid = construct["core-model-1-4:control-construct"]["uuid"];

  let client = await elasticsearchService.getClient();
  let indexAlias = await getIndexAliasAsync();
  let res = await client.search({
    index: indexAlias,
    filter_path: 'hits.hits._id',
    body: {
      "query": {
        "term": {
          "uuid": uuid
        }
      }
    }
  });
  let response = {};
  if (Object.keys(res.body).length === 0) {
    response = await client.index({
      index: indexAlias,
      body: construct["core-model-1-4:control-construct"]
    });
  } else {
    let documentId = res.body.hits.hits[0]._id;
    response = await client.index({
      index: indexAlias,
      id: documentId,
      body: construct["core-model-1-4:control-construct"]
    });
  }
  return response;
}

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
      let controlConstructList = await NetworkControlDomain.getControlConstructListAsync();
      for (let i = 0; i < controlConstructList.length; i++) {
        let controlConstruct = controlConstructList[i];
        try {
          let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
          for (let i = 0; i < logicalTerminationPointList.length; i++) {
            let logicalTerminationPoint = logicalTerminationPointList[i];
            let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
            let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
            if (layerProtocolName == LayerProtocol.layerProtocolNameEnum.HTTP_SERVER) {
              let httpServerInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_SERVER_INTERFACE_PAC];
              let httpServerCapability = httpServerInterfacePac[onfAttributes.HTTP_SERVER.CAPABILITY];
              let applicationName = httpServerCapability[onfAttributes.HTTP_SERVER.APPLICATION_NAME];
              let applicationReleaseNumber = httpServerCapability[onfAttributes.HTTP_SERVER.RELEASE_NUMBER];
              let clientApplication = new clientApplicationInformation(applicationName, applicationReleaseNumber);
              clientApplicationList.push(clientApplication);
            }
          }
        } catch (error) {
          console.log(error)
        }
      }
      resolve(clientApplicationList);
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
      let operationServerCapability = operationServerPac[onfAttributes.OPERATION_SERVER.CAPABILITY];
      operationServerNames.push(operationServerCapability[onfAttributes.OPERATION_SERVER.OPERATION_NAME]);
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
            let httpClientCapability = httpClientInterfacePac[onfAttributes.HTTP_CLIENT.CAPABILITY];
            let httpClientConfiguration = httpClientInterfacePac[onfAttributes.HTTP_CLIENT.CONFIGURATION];
            let operationName = getOperationNameOfTheOperationClient(logicalTerminationPointList,
              clientLtp);
            let applicationName = httpClientCapability[onfAttributes.HTTP_CLIENT.APPLICATION_NAME];
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