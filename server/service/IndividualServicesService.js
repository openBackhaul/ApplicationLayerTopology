'use strict';

const LogicalTerminationPointConfigurationInput = require('onf-core-model-ap/applicationPattern/onfModel/services/models/logicalTerminationPoint/ConfigurationInput');
const LogicalTerminationPointService = require('onf-core-model-ap/applicationPattern/onfModel/services/LogicalTerminationPointServices');
const prepareALTForwardingAutomation = require('onf-core-model-ap-bs/basicServices/services/PrepareALTForwardingAutomation');

const LinkServices = require('./individualServices/LinkServices');
const LogicalTerminationPointServiceOfUtility = require('onf-core-model-ap-bs/basicServices/utility/LogicalTerminationPoint');
const individualServicesOperationsMapping = require('./individualServices/IndividualServicesOperationsMapping');
const ForwardingConfigurationService = require('onf-core-model-ap/applicationPattern/onfModel/services/ForwardingConstructConfigurationServices');
const ForwardingAutomationService = require('onf-core-model-ap/applicationPattern/onfModel/services/ForwardingConstructAutomationServices');
const ForwardingAutomationServiceWithResponse = require('./individualServices/ForwardingAutomationServiceWithResponse');
const FcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');

const prepareForwardingConfiguration = require('./individualServices/PrepareForwardingConfiguration');
const prepareForwardingAutomation = require('./individualServices/PrepareForwardingAutomation');
const softwareUpgrade = require('./individualServices/SoftwareUpgrade');
const ConfigurationStatus = require('onf-core-model-ap/applicationPattern/onfModel/services/models/ConfigurationStatus');
const httpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const httpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');
const onfAttributeFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');

const tcpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const LogicalTerminationPointConfigurationStatus = require('onf-core-model-ap/applicationPattern/onfModel/services/models/logicalTerminationPoint/ConfigurationStatus');
const LayerProtocol = require('onf-core-model-ap/applicationPattern/onfModel/models/LayerProtocol');
const LinkPort = require('./models/LinkPort');
const ControlConstructService = require('./individualServices/ControlConstructService');
const isEqual = require('lodash.isequal');
const createHttpError = require('http-errors');
const TcpObject = require('onf-core-model-ap/applicationPattern/onfModel/services/models/TcpObject');

const NEW_RELEASE_FORWARDING_NAME = 'PromptForBequeathingDataCausesTransferOfListOfApplications';

/**
 * Connects an OperationClient to an OperationServer
 *
 * body V1_addoperationclienttolink_body 
 * user String User identifier from the system starting the service call
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.addOperationClientToLink = async function (body, user, xCorrelator, traceIndicator, customerJourney, operationServerName) {
  let response = await LinkServices.findOrCreateLinkForTheEndPointsAsync(body);
  let linkUuid = response.linkUuid;
  let forwardingAutomationInput = prepareForwardingAutomation.createLinkChangeNotificationForwardings(
    linkUuid
  );
  ForwardingAutomationService.automateForwardingConstructAsync(
    operationServerName,
    [forwardingAutomationInput],
    user,
    xCorrelator,
    traceIndicator,
    customerJourney
  );
  return {
    "took": response.took
  };
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
      let httpClientUuidList = await LogicalTerminationPointServiceOfUtility.resolveHttpTcpAndOperationClientUuidOfNewRelease()
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

        if (protocol != currentNewReleaseRemoteProtocol) {
          update.isProtocolUpdated = await tcpClientInterface.setRemoteProtocolAsync(tcpclientUuid, protocol);
        }
        if (JSON.stringify(address) != JSON.stringify(currentNewReleaseRemoteAddress)) {
          update.isAddressUpdated = await tcpClientInterface.setRemoteAddressAsync(tcpclientUuid, address);
        }
        if (port != currentNewReleaseRemotePort) {
          update.isPortUpdated = await tcpClientInterface.setRemotePortAsync(tcpclientUuid, port);
        }

        let tcpClientConfigurationStatus = new ConfigurationStatus(
          tcpclientUuid,
          '',
          (update.isProtocolUpdated || update.isAddressUpdated || update.isPortUpdated)
        );
        let httpClientConfigurationStatus = new ConfigurationStatus(
          newReleaseHttpClientLtpUuid,
          '',
          (update.isReleaseUpdated || update.isApplicationNameUpdated)
        );
        logicalTerminationPointConfigurationStatus = new LogicalTerminationPointConfigurationStatus(
          false,
          httpClientConfigurationStatus,
          [tcpClientConfigurationStatus]
        );

        let forwardingAutomationInputList = [];
        if (logicalTerminationPointConfigurationStatus != undefined) {

          /****************************************************************************************
           * Prepare attributes to automate forwarding-construct
           ****************************************************************************************/
          forwardingAutomationInputList = await prepareForwardingAutomation.bequeathYourDataAndDie(
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
        softwareUpgrade.upgradeSoftwareVersion(user, xCorrelator, traceIndicator, customerJourney, forwardingAutomationInputList.length)
          .catch(err => console.log(`upgradeSoftwareVersion failed with error: ${err}`));
      }
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
 * no response value expected for this operation
 **/
exports.deleteFcPort = async function (body) {
  let forwardingConstructUuid = body["fc-uuid"];
  let fcPortLocalId = body["fc-port-local-id"];
  let controlConstructUuid = figureOutControlConstructUuid(forwardingConstructUuid);
  return await ControlConstructService.deleteFcPort(fcPortLocalId, forwardingConstructUuid, controlConstructUuid);
}

/**
 * Removes LTP and all it's data from corresponding control-construct and links.
 *
 * body V1_deleteltpanddependents_body 
 * no response value expected for this operation
 **/
exports.deleteLtpAndDependents = async function (body) {
  let ltpToBeRemovedUuid = body[onfAttributes.GLOBAL_CLASS.UUID];
  let controlConstructResponse = await ControlConstructService.getControlConstructFromLtpUuidAsync(ltpToBeRemovedUuid);
  let controlConstruct = controlConstructResponse.controlConstruct;
  let took = controlConstructResponse.took;
  if (!controlConstruct) {
    return {
      "took": took
    }
  }
  let controlConstructUuid = controlConstruct[onfAttributes.GLOBAL_CLASS.UUID];
  let ltps = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
  let ltpToBeRemoved = ltps.find(ltp => ltp[onfAttributes.GLOBAL_CLASS.UUID] === ltpToBeRemovedUuid);
  if (!ltpToBeRemoved) {
    console.log(`LTP with UUID ${ltpToBeRemovedUuid} could not be found.`);
    return {
      "took": took
    };
  }

  // do removal based on layerProtocol
  let layerProtocol = ltpToBeRemoved[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
  let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
  switch (layerProtocolName) {
    case LayerProtocol.layerProtocolNameEnum.OPERATION_CLIENT: {
      let delFcResponse = await ControlConstructService.deleteDependentFcPorts(controlConstructUuid, ltpToBeRemovedUuid);
      took += delFcResponse.took;
      let delLPResponse = await LinkServices.deleteDependentLinkPortsAsync(ltpToBeRemovedUuid);
      took += delLPResponse.took;
      break;
    } 
    case LayerProtocol.layerProtocolNameEnum.HTTP_CLIENT: {
      for (let clientUUID of ltpToBeRemoved[onfAttributes.LOGICAL_TERMINATION_POINT.CLIENT_LTP]) {
        let delFcResponse = await ControlConstructService.deleteDependentFcPorts(controlConstructUuid, clientUUID);
        took += delFcResponse.took;
        let delLPResponse = await LinkServices.deleteDependentLinkPortsAsync(clientUUID);
        took += delLPResponse.took;
        ControlConstructService.deleteLtpFromCCObject(ltps, clientUUID);
      }
      for (let serverUUID of ltpToBeRemoved[onfAttributes.LOGICAL_TERMINATION_POINT.SERVER_LTP]) {
        ControlConstructService.deleteLtpFromCCObject(ltps, serverUUID);
      }
      break;
    }
    case LayerProtocol.layerProtocolNameEnum.TCP_CLIENT: {
      let httpClientUuid = ltpToBeRemoved[onfAttributes.LOGICAL_TERMINATION_POINT.CLIENT_LTP][0];
      let httpClient = ltps.find(ltp => ltp[onfAttributes.GLOBAL_CLASS.UUID] === httpClientUuid);
      if (httpClient[onfAttributes.LOGICAL_TERMINATION_POINT.SERVER_LTP].length === 1) {
        for (let clientUUID of httpClient[onfAttributes.LOGICAL_TERMINATION_POINT.CLIENT_LTP]) {
          let delFcResponse = await ControlConstructService.deleteDependentFcPorts(controlConstructUuid, clientUUID);
          took += delFcResponse.took;
          let delLPResponse = await LinkServices.deleteDependentLinkPortsAsync(clientUUID);
          took += delLPResponse.took;
          ControlConstructService.deleteLtpFromCCObject(ltps, clientUUID);
        }
        ControlConstructService.deleteLtpFromCCObject(ltps, httpClientUuid);
      }
      break;
    }
    default:
      // don't do anything if LTP is of type http-s, tcp-s or op-s
      return;
  }
  // update control-construct with removed LTP/FC
  ltps = ControlConstructService.deleteLtpFromCCObject(ltps, ltpToBeRemovedUuid);
  let res = await ControlConstructService.updateLtpsAsync(controlConstructUuid, ltps);
  took += res.took;
  return {
    "took": took
  };
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
exports.disregardApplication = async function (body, user, originator, xCorrelator, traceIndicator, customerJourney, operationServerName) {
  let applicationName = body["application-name"];
  let applicationReleaseNumber = body["release-number"];

  /****************************************************************************************
   * Prepare logicalTerminatinPointConfigurationInput object to 
   * configure logical-termination-point
   ****************************************************************************************/
  let ownApplicationName = await httpServerInterface.getApplicationNameAsync();
  let ownApplicationReleaseNumber = await httpServerInterface.getReleaseNumberAsync();
  if (!(applicationName == ownApplicationName && applicationReleaseNumber == ownApplicationReleaseNumber)) {
    let httpClientUuid = await httpClientInterface.getHttpClientUuidExcludingOldReleaseAndNewRelease(
      applicationName, applicationReleaseNumber, NEW_RELEASE_FORWARDING_NAME
    )
    let logicalTerminationPointconfigurationStatus = await LogicalTerminationPointService.deleteApplicationLtpsAsync(
      httpClientUuid
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
}

/**
 * Provides list of applications that are part of the application layer topology representation
 *
 * returns List
 **/
exports.listApplications = async function () {
  const forwardingName = 'NewApplicationCausesRequestForTopologyChangeInformation';
  let applicationList = await LogicalTerminationPointServiceOfUtility.getAllApplicationList(forwardingName);
  return onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(applicationList);
}

/**
 * Provides list of operation UUIDs belonging to link identified by UUID
 *
 * returns inline_response_200_6
 **/
exports.listEndPointsOfLink = async function (body) {
  let linkUuid = body["link-uuid"];
  let linkEndPointList = [];
  let took = 0;
  let linkResult = await LinkServices.getLinkAsync(linkUuid);
  let link = linkResult.link;
  took += linkResult.took;
  if (!link) {
    console.log(`Link with UUID ${linkUuid} could not be found.`);
    return {
      "took": took
    }
  }
  for (let linkPort of link[onfAttributes.LINK.LINK_PORT]) {
    let linkEndPoint = {};
    let logicalTerminationPoint = linkPort[onfAttributes.LINK.LOGICAL_TERMINATION_POINT];
    let controlConstructUuid = figureOutControlConstructUuid(logicalTerminationPoint);
    let controlConstructResponse = await ControlConstructService.getControlConstructAsync(controlConstructUuid);
    took += controlConstructResponse.took;
    let controlConstruct = controlConstructResponse.controlConstruct;
    linkEndPoint.operationUuid = logicalTerminationPoint;
    if (controlConstruct) {
      let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
      let found = logicalTerminationPointList.find(ltp => ltp[onfAttributes.GLOBAL_CLASS.UUID] === logicalTerminationPoint);
      linkEndPoint.ltpDirection = found[onfAttributes.LOGICAL_TERMINATION_POINT.LTP_DIRECTION];
      linkEndPoint.applicationName = ControlConstructService.getApplicationName(controlConstruct);
      linkEndPoint.releaseNumber = ControlConstructService.getReleaseNumber(controlConstruct);
    }
    linkEndPointList.push(linkEndPoint);
  }
  linkEndPointList = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(linkEndPointList);
  return {
    "body": {
      "link-end-point-list": linkEndPointList
    },
    "took": took
  };
}

/**
 * Provides list of UUIDs of Links
 *
 * returns inline_response_200_5
 **/
exports.listLinkUuids = async function () {
  let linksResponse = await LinkServices.getLinkListAsync();
  let linkList = linksResponse.links;
  const linkUuidList = linkList.flatMap(link => link[onfAttributes.GLOBAL_CLASS.UUID]);
  return {
    "body": {
      "link-uuid-list": linkUuidList
    },
    "took": linksResponse.took
  };
}

/**
 * Provides list of applications and names of operations that are connected by links to an application
 * 'Browses list of links for UUIDs of OperationClients at (application-name,application-release-number) as INPUT and  returns (serving-application-name,serving-application-release-number,operation-name) for OperationServers of UUIDs that are stated as OUTPUT.' 
 *
 * body V1_listlinkstooperationclientsofapplication_body 
 * returns inline_response_200_7
 **/
exports.listLinksToOperationClientsOfApplication = async function (body) {
  let operationServerList = [];
  let took = 0;
  let applicationName = body["application-name"];
  let applicationReleaseNumber = body["release-number"];

  let controlConstructResponse = await ControlConstructService.getControlConstructOfTheApplicationAsync(
    applicationName,
    applicationReleaseNumber);
  let controlConstruct = controlConstructResponse.controlConstruct;
  if (controlConstruct) {
    took += controlConstructResponse.took;

    let controlConstructUuid = controlConstruct[onfAttributes.GLOBAL_CLASS.UUID];
    let opertionClientUuidListWithLink = [];
    let linkListResponse = await LinkServices.getLinkListAsync();
    let linkList = linkListResponse.links;
    took += linkListResponse.took;
    for (let link of linkList) {
      let linkPortList = link[onfAttributes.LINK.LINK_PORT];
      for (let linkPort of linkPortList) {
        let portDirection = linkPort[onfAttributes.LINK.PORT_DIRECTION];
        if (portDirection === LinkPort.portDirectionEnum.INPUT) {
          let logicalTerminationPoint = linkPort[onfAttributes.LINK.LOGICAL_TERMINATION_POINT];
          let controlConstructUuidOfTheLTP = figureOutControlConstructUuid(logicalTerminationPoint);
          if (controlConstructUuidOfTheLTP === controlConstructUuid) {
            opertionClientUuidListWithLink.push(logicalTerminationPoint);
          }
        }
      }
    }

    let operationClientInformationList = getClientsReactingOnOperationServerList(controlConstruct, opertionClientUuidListWithLink);
    for (let operationClientInformation of operationClientInformationList) {
      let servingApplication = {};
      servingApplication.servingApplicationName = operationClientInformation.addressedApplicationName;
      servingApplication.servingApplicationReleaseNumber = operationClientInformation.addressedApplicationReleaseNumber;
      servingApplication.operationName = operationClientInformation.addressedOperationName;
      servingApplication = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(servingApplication);
      operationServerList.push(servingApplication);
    }
  }
  return {
    "body": {
      "operation-server-list": operationServerList
    },
    "took": took
  };
}


/**
 * Provides list of applications and names of operations that are consumed by an application
 * Returns information about targets of OperationClients.
 *
 * body V1_listoperationclientsatapplication_body 
 * returns inline_response_200_3
 **/
exports.listOperationClientsAtApplication = async function (body) {
  let operationClientList = [];
  let took = 0;
  let applicationName = body["application-name"];
  let applicationReleaseNumber = body["release-number"];

  let controlConstructResponse = await ControlConstructService.getControlConstructOfTheApplicationAsync(
    applicationName,
    applicationReleaseNumber);
  let controlConstruct = controlConstructResponse.controlConstruct;
  if (controlConstruct) {
    took += controlConstructResponse.took;

    let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];

    for (let logicalTerminationPoint of logicalTerminationPointList) {
      let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
      let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
      if (layerProtocolName === LayerProtocol.layerProtocolNameEnum.HTTP_CLIENT) {
        let clientUuidList = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.CLIENT_LTP];

        let httpClientInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_CLIENT_INTERFACE_PAC];
        let httpClientConfiguration = httpClientInterfacePac[onfAttributes.HTTP_CLIENT.CONFIGURATION];
        let clientApplicationName = httpClientConfiguration[onfAttributes.HTTP_CLIENT.APPLICATION_NAME];
        let clientReleaseNumber = httpClientConfiguration[onfAttributes.HTTP_CLIENT.RELEASE_NUMBER];

        if (clientUuidList) {

          for (let clientUuid of clientUuidList) {

            for (let clientLogicalTerminationPoint of logicalTerminationPointList) {
              let clientlogicalTerminationPointUuid = clientLogicalTerminationPoint[onfAttributes.GLOBAL_CLASS.UUID];

              if (clientlogicalTerminationPointUuid === clientUuid) {
                let clientLayerProtocol = clientLogicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
                let clientLayerProtocolName = clientLayerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];

                if (clientLayerProtocolName === LayerProtocol.layerProtocolNameEnum.OPERATION_CLIENT) {
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
  return {
    "body": {
      "operation-client-list": operationClientList
    },
    "took": took
  };
}


/**
 * Provides list of applications and names of operations that are addressed in case of an incomming request
 * Informs about the internal forwarding (FCs).
 *
 * body V1_listoperationclientsreactingonoperationserver_body 
 * returns inline_response_200_4
 **/
exports.listOperationClientsReactingOnOperationServer = async function (body) {
  let operationClientList = [];
  let took = 0;
  let applicationName = body["receiving-application-name"];
  let applicationReleaseNumber = body["receiving-application-release-number"];
  let operationServerName = body["receiving-operation"];

  let controlConstructResponse = await ControlConstructService.getControlConstructOfTheApplicationAsync(
    applicationName,
    applicationReleaseNumber);
  let controlConstruct = controlConstructResponse.controlConstruct;
  if (controlConstruct) {
    took += controlConstructResponse.took;

    let operationServerUuid = ControlConstructService.getOperationServerUuid(controlConstruct, operationServerName);
    if (operationServerUuid) {
      let operationClientsUuidsReactingOnOperationServerList = getOperationClientsUuidsReactingOnOperationServerList(
        controlConstruct,
        operationServerUuid
      );
      let clientsReactingOnOperationServerList = getClientsReactingOnOperationServerList(
        controlConstruct,
        operationClientsUuidsReactingOnOperationServerList
      );
      operationClientList = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(clientsReactingOnOperationServerList);
    }
  }
  return {
    "body": {
      "operation-client-list": operationClientList
    },
    "took": took
  };
}

/**
 * Provides list of names of operations that are supported by an application
 *
 * body V1_listoperationserversatapplication_body 
 * returns inline_response_200_2
 **/
exports.listOperationServersAtApplication = async function (body) {
  let operationServerNameList = [];
  let took = 0;
  let applicationName = body["application-name"];
  let applicationReleaseNumber = body["release-number"];

  let controlConstructResponse = await ControlConstructService.getControlConstructOfTheApplicationAsync(
    applicationName,
    applicationReleaseNumber);
  let controlConstruct = controlConstructResponse.controlConstruct;
  if (controlConstruct) {
    took += controlConstructResponse.took;

    let logicalTerminationPointFullList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
    let logicalTerminationPointList = logicalTerminationPointFullList.filter(ltp => {
      let name = ltp[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0][onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
      return name === LayerProtocol.layerProtocolNameEnum.OPERATION_SERVER;
    });
    for (let logicalTerminationPoint of logicalTerminationPointList) {
      let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
      let operationServerInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.OPERATION_SERVER_INTERFACE_PAC];
      let operationServerCapability = operationServerInterfacePac[onfAttributes.OPERATION_SERVER.CAPABILITY];
      let operationName = operationServerCapability[onfAttributes.OPERATION_SERVER.OPERATION_NAME];
      operationServerNameList.push(operationName);
    }
  }
  return {
    "body": {
      "operation-server-name-list": operationServerNameList
    },
    "took": took
  };
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
exports.notifyLinkUpdates = async function (body, user, originator, xCorrelator, traceIndicator, customerJourney, operationServerName) {
  let applicationName = body["subscriber-application"];
  let releaseNumber = body["subscriber-release-number"];
  let subscriberOperation = body["subscriber-operation"];

  let tcpServerList = [new TcpObject(body["subscriber-protocol"], body["subscriber-address"], body["subscriber-port"])];

  let operationNamesByAttributes = new Map();
  operationNamesByAttributes.set("regard-updated-link", subscriberOperation);
  let httpClientUuid = await httpClientInterface.getHttpClientUuidAsync(applicationName);
  let ltpConfigurationInput = new LogicalTerminationPointConfigurationInput(
    httpClientUuid,
    applicationName,
    releaseNumber,
    tcpServerList,
    operationServerName,
    operationNamesByAttributes,
    individualServicesOperationsMapping.individualServicesOperationsMapping
  );
  let logicalTerminationPointconfigurationStatus = await LogicalTerminationPointService.createOrUpdateApplicationLtpsAsync(
    ltpConfigurationInput
  );

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
}

/**
 * Adds to the list of applications
 *
 * body V1_regardapplication_body 
 * user String User identifier from the system starting the service call
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.regardApplication = async function (body, user, xCorrelator, traceIndicator, customerJourney, operationServerName) {
  let applicationName = body["application-name"];
  let releaseNumber = body["release-number"];
  let tcpServerList = [{
    protocol: body["protocol"],
    address: body["address"],
    port: body["port"]
  }];

  let redirectTopologyInformationOperation = "/v1/redirect-topology-change-information";

  let operationNamesByAttributes = new Map();
  operationNamesByAttributes.set("redirect-topology-change-information", redirectTopologyInformationOperation);

  let httpClientUuid = await httpClientInterface.getHttpClientUuidExcludingOldReleaseAndNewRelease(
    applicationName, releaseNumber, NEW_RELEASE_FORWARDING_NAME
  )
  let logicalTerminatinPointConfigurationInput = new LogicalTerminationPointConfigurationInput(
    httpClientUuid,
    applicationName,
    releaseNumber,
    tcpServerList,
    operationServerName,
    operationNamesByAttributes,
    individualServicesOperationsMapping.individualServicesOperationsMapping
  );
  let ltpConfigurationStatus = await LogicalTerminationPointService.createOrUpdateApplicationLtpsAsync(
    logicalTerminatinPointConfigurationInput
  );

  let forwardingConfigurationInputList = [];
  let forwardingConstructConfigurationStatus;
  let operationClientConfigurationStatusList = ltpConfigurationStatus.operationClientConfigurationStatusList;

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

  let forwardingAutomationInputList = await prepareForwardingAutomation.regardApplication(
    ltpConfigurationStatus,
    forwardingConstructConfigurationStatus,
    applicationName,
    releaseNumber
  );

  let headers = {
    user,
    xCorrelator,
    traceIndicator,
    customerJourney
  }

  automateForwarding(forwardingAutomationInputList[0], headers, applicationName, releaseNumber);

  /***********************************************************************************
   * forwardings for application layer topology
   ************************************************************************************/
  let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputAsync(
    ltpConfigurationStatus,
    forwardingConstructConfigurationStatus
  );

  ForwardingAutomationService.automateForwardingConstructAsync(
    operationServerName,
    applicationLayerTopologyForwardingInputList,
    user,
    xCorrelator,
    traceIndicator,
    customerJourney
  );
}

async function automateForwarding(forwardingAutomationInput, headers, applicationName, releaseNumber) {
  let response = await ForwardingAutomationServiceWithResponse.automateForwardingConstructAsync(
    forwardingAutomationInput,
    headers
  );
  if (response === undefined || response.data === undefined || Object.keys(response).length === 0) {
    return;
  }
  // response is full control construct of regarded application
  let cc = response["data"]["core-model-1-4:control-construct"];
  await ControlConstructService.createOrUpdateControlConstructAsync(cc);
  let logicalTerminationPoints = cc[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
  let operationServerNames = getAllOperationServerNameAsync(logicalTerminationPoints);
  let forwardings = [];
  for (let operationServerName of operationServerNames) {
    let endPointDetails = {
      'serving-application-name': applicationName,
      'serving-application-release-number': releaseNumber,
      'operation-name': operationServerName
    }
    let servingOperationResponse = await LinkServices.getServingOperationUuidAsync(endPointDetails);
    let servingOperationUuid = servingOperationResponse.servingOperationUuid;
    let forwarding = await LinkServices.prepareLinkChangeNotificationForwardingsAsync(servingOperationUuid, []);
    if (forwarding) {
      forwardings.push(forwarding);
    }
  }
  ForwardingAutomationService.automateForwardingConstructAsync(
    "/v1/add-operation-client-to-link",
    forwardings,
    headers.user,
    headers.xCorrelator,
    headers.traceIndicator,
    headers.customerJourney
  );
}

/**
 * Disconnects an OperationClient
 *
 * body V1_removeoperationclientfromlink_body 
 * user String User identifier from the system starting the service call
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.removeOperationClientFromLink = async function (body, user, xCorrelator, traceIndicator, customerJourney, operationServerName) {
  let response = await LinkServices.deleteOperationClientFromTheEndPointsAsync(body);
  let linkUuid = response.linkUuid;
  if (linkUuid) {
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
  }
  return {
    "took": response.took
  };
}


/**
 * Existing documentation of all interfaces and internal connections will be replaced for the same CcUuid
 *
 * body V1_updateallltpsandfcs_body
 * no response value expected for this operation
 **/
exports.updateAllLtpsAndFcs = async function (body) {
  let controlConstruct = body["core-model-1-4:control-construct"];
  await checkIfApplicationExists(controlConstruct);
  return await ControlConstructService.createOrUpdateControlConstructAsync(controlConstruct);
}

/**
 * Existing documentation of an FC identified by FcUuid will be replaced
 *
 * body V1_updatefc_body 
 * no response value expected for this operation
 **/
exports.updateFc = async function (body) {
  let forwardingConstructUuid = body[onfAttributes.GLOBAL_CLASS.UUID];
  let controlConstructUuid = figureOutControlConstructUuid(forwardingConstructUuid);
  let response = await ControlConstructService.updateForwardingConstruct(controlConstructUuid, body)
  if (response) {
    return response;
  } else {
    throw new Error('fc is not updated')
  }
}

/**
 * Existing documentation of an FcPort identified by FcUuid and FcPortLid will be replaced
 *
 * body V1_updatefcport_body 
 * no response value expected for this operation
 **/
exports.updateFcPort = async function (body) {
  let forwardingConstructUuid = body["fc-uuid"];
  let fcPort = body["fc-port"];
  let controlConstructUuid = figureOutControlConstructUuid(forwardingConstructUuid);
  let response = await ControlConstructService.updateFCPort(controlConstructUuid, forwardingConstructUuid, fcPort);
  if (response) {
    return response;
  } else {
    throw new Error('fc-port is not updated')
  }
}

/**
 * Existing documentation of the interface identified by LtpUuid will be replaced
 *
 * body V1_updateltp_body 
 * no response value expected for this operation
 **/
exports.updateLtp = async function (body, user, xCorrelator, traceIndicator,customerJourney, operationServerName) {
  let logicalTerminationPointUuid = body[onfAttributes.GLOBAL_CLASS.UUID];
  let existingLtps = [];
  let forwardingAutomationInputList = [];
  let controlConstructResponse = await ControlConstructService.getControlConstructFromLtpUuidAsync(logicalTerminationPointUuid);
  let controlConstruct = controlConstructResponse.controlConstruct;
  let took = controlConstructResponse.took;
  if (controlConstruct) {
    existingLtps = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
    let existingIndex = existingLtps.findIndex(item => item[onfAttributes.GLOBAL_CLASS.UUID] === logicalTerminationPointUuid);
    let existingLtp = existingLtps[existingIndex];
    if (!existingLtp) {
      throw new createHttpError.BadRequest(`LTP with UUID ${logicalTerminationPointUuid} could not be found.`);
    }
    if (isEqual(existingLtp, body)) {
      console.log(`LTP with UUID ${logicalTerminationPointUuid} is already in database.`);
      return {
        "took": took
      };
    }
    // deal with forwardings
    let forwardingAutomationInputListResponse = await prepareForwardingAutomation.updateLtp(existingLtp, body);
    forwardingAutomationInputList = forwardingAutomationInputListResponse.forwardingAutomationInputList;
    took += forwardingAutomationInputListResponse.took;
  } else {
    // we did not find existing LTP with this name, figure out CC by UUID
    let controlConstructUuid = figureOutControlConstructUuid(logicalTerminationPointUuid);
    controlConstructResponse = await ControlConstructService.getControlConstructAsync(controlConstructUuid);
    controlConstruct = controlConstructResponse.controlConstruct;
    took += controlConstructResponse.took;
    if (!controlConstruct) {
      throw new createHttpError.BadRequest(`CC with UUID ${controlConstructUuid} could not be found.`)
    }
  }
  // update LTP in control construct
  let controlConstructUpdateResponse = await ControlConstructService.updateControlConstructLtp(
    controlConstruct[onfAttributes.GLOBAL_CLASS.UUID],
    body
  );
  took += controlConstructUpdateResponse.took;

  // forwardings
  if (forwardingAutomationInputList.length !== 0) {
    ForwardingAutomationService.automateForwardingConstructAsync(
      operationServerName,
      forwardingAutomationInputList,
      user,
      xCorrelator,
      traceIndicator,
      customerJourney
    );
  }
  return {
    "took": took
  };
}

/****************************************************************************************
 * Functions utilized by individual services
 ****************************************************************************************/


/***************************************************************************************************************
 ****************** Funtions that are specific to the addOperationClientToLink ************
 ***************************************************************************************************************/

/**
 * Extracts operation server names from given list of LTPs.
 * @param {Array} logicalTerminationPoints LTPs from which the operation server names should be extracted
 * @returns {Array} of operation server names
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

/***************************************************************************************************************
 ****************** Funtions that are specific to the listOperationClientsReactingOnOperationServer ************
 ***************************************************************************************************************/

/**
 * This function gets the operation client uuids reacting on the operation server list
 * @param {*} controlConstruct 
 * @param {*} operationServerUuid 
 * @returns array
 */
function getOperationClientsUuidsReactingOnOperationServerList(controlConstruct, operationServerUuid) {
  let operationClientsUuids = [];
  let forwardingDomainList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.FORWARDING_DOMAIN];
  for (let forwardingDomain of forwardingDomainList) {
    let forwardingConstructList = forwardingDomain[onfAttributes.FORWARDING_DOMAIN.FORWARDING_CONSTRUCT];
    for (let forwardingConstruct of forwardingConstructList) {
      let fcOutputUuidList = getFcOutputUuidListforTheInput(forwardingConstruct, operationServerUuid)
      for (let fcOutputUuid of fcOutputUuidList) {
        operationClientsUuids.push(fcOutputUuid);
      }
    }
  }
  return operationClientsUuids;
}

/**
 * This function returns the list of output fc-port uuids for the operationServerUuid in the given forwardingConstruct
 * @param {Object} forwardingConstruct
 * @param {String} operationServerUuid
 * @returns {Array}
 */
function getFcOutputUuidListforTheInput(forwardingConstruct, operationServerUuid) {
  let fcOutputUuidList = [];
  if (isOperationServerIsInInput(forwardingConstruct, operationServerUuid)) {
    let fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
    for (let fcPort of fcPortList) {
      let fcPortDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
      if (fcPortDirection === FcPort.portDirectionEnum.OUTPUT) {
        let logicalTerminationPoint = fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT];
        fcOutputUuidList.push(logicalTerminationPoint);
      }
    }
  }
  return fcOutputUuidList;
}


/**
 * This function returns true if the operation server is listed as a input port in given forwarding construct
 * @param {Object} forwardingConstruct
 * @param {String} operationServerUuid
 * @returns {boolean}
 */
function isOperationServerIsInInput(forwardingConstruct, operationServerUuid) {
  let fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
  for (let fcPort of fcPortList) {
    let fcPortDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
    if (fcPortDirection === FcPort.portDirectionEnum.INPUT) {
      let logicalTerminationPoint = fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT];
      if (logicalTerminationPoint === operationServerUuid) {
        return true;
      }
    }
  }
  return false;
}

/**
 * This function returns the list of clients information reacting on the operation server 
 * @param {Object} controlConstruct
 * @param {Array} operationClientsUuids
 * @returns {Object} { addressedApplicationName,
 * addressedApplicationReleaseNumber, addressedOperationName }
 */
function getClientsReactingOnOperationServerList(controlConstruct, operationClientsUuids) {
  let clientsReactingOnOperationServerList = [];
  let logicalTerminationPointList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
  for (let logicalTerminationPoint of logicalTerminationPointList) {
    let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
    let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
    if (layerProtocolName === LayerProtocol.layerProtocolNameEnum.HTTP_CLIENT) {
      let clientLtpList = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.CLIENT_LTP];
      for (let clientLtp of clientLtpList) {
        if (operationClientsUuids.includes(clientLtp)) {
          let httpClientInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.HTTP_CLIENT_INTERFACE_PAC];
          let httpClientConfiguration = httpClientInterfacePac[onfAttributes.HTTP_CLIENT.CONFIGURATION];
          let operationName = getOperationName(logicalTerminationPointList, clientLtp);
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
}


/**
 * This function returns the operation name of the operation client uuid
 * @param {Array} logicalTerminationPointList
 * @param {String} operationClientUuid
 * @returns {String|undefined} operationName
 */
function getOperationName(logicalTerminationPointList,
  operationClientUuid) {
  for (let logicalTerminationPoint of logicalTerminationPointList) {
    let logicalTerminationPointUuid = logicalTerminationPoint[onfAttributes.GLOBAL_CLASS.UUID];
    let layerProtocol = logicalTerminationPoint[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
    let layerProtocolName = layerProtocol[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
    if (layerProtocolName === LayerProtocol.layerProtocolNameEnum.OPERATION_CLIENT &&
      logicalTerminationPointUuid === operationClientUuid) {
      let operationClientInterfacePac = layerProtocol[onfAttributes.LAYER_PROTOCOL.OPERATION_CLIENT_INTERFACE_PAC];
      let operationClientConfiguration = operationClientInterfacePac[onfAttributes.OPERATION_CLIENT.CONFIGURATION];
      return operationClientConfiguration[onfAttributes.OPERATION_CLIENT.OPERATION_NAME];
    }
  }
  return undefined;
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
 * Checks if http-c ltp exists by fetching applicationName and releaseNumber from given controlConstruc. Throws Error if not. 
 * @param {Object} controlConstruct
 * @throws {Error} Will throw an error if the application does not exist.
 */
async function checkIfApplicationExists(controlConstruct) {
  let applicationName = ControlConstructService.getApplicationName(controlConstruct);
  let releaseNumber = ControlConstructService.getReleaseNumber(controlConstruct);
  let httpClientUuid = await httpClientInterface.getHttpClientUuidAsync(applicationName, releaseNumber);
  if (httpClientUuid === undefined) {
    throw new Error(`Application ${applicationName} is not in the list of known applications.`);
  }
}
