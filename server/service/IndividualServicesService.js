'use strict';


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
exports.addOperationClientToLink = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
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
exports.bequeathYourDataAndDie = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
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
exports.deleteFcPort = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
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
exports.deleteLtpAndDependents = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    resolve();
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
exports.disregardApplication = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    resolve();
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
exports.listApplications = function(user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "application-name" : "RegistryOffice",
  "application-release-number" : "0.0.1"
}, {
  "application-name" : "TypeApprovalRegister",
  "application-release-number" : "0.0.1"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
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
exports.listEndPointsOfLink = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "link-end-point-list" : [ {
    "application-name" : "RegistryOffice",
    "application-release-number" : "0.0.1",
    "operation-uuid" : "ro-0-0-1-op-c-2070",
    "ltp-direction" : "core-model-1-4:TERMINATION_DIRECTION_SINK"
  }, {
    "application-name" : "ApplicationLayerTopology",
    "application-release-number" : "0.0.1",
    "operation-uuid" : "alt-0-0-1-op-s-0001",
    "ltp-direction" : "core-model-1-4:TERMINATION_DIRECTION_SOURCE"
  } ]
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
exports.listLinkUuids = function(user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "link-uuid-list" : [ "alt-0-0-1-op-link-0001", "alt-0-0-1-op-link-0002" ]
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
exports.listLinksToOperationClientsOfApplication = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "operation-server-list" : [ {
    "serving-application-name" : "TypeApprovalRegister",
    "serving-application-release-number" : "0.0.1",
    "operation-name" : "/v1/embed-yourself"
  }, {
    "serving-application-name" : "TypeApprovalRegister",
    "serving-application-release-number" : "0.0.1",
    "operation-name" : "/v1/update-client"
  } ]
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
exports.listOperationClientsAtApplication = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "operation-client-list" : [ {
    "serving-application-name" : "TypeApprovalRegister",
    "serving-application-release-number" : "0.0.1",
    "operation-name" : "/v1/embed-yourself"
  }, {
    "serving-application-name" : "TypeApprovalRegister",
    "serving-application-release-number" : "0.0.1",
    "operation-name" : "/v1/update-client"
  } ]
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
exports.listOperationClientsReactingOnOperationServer = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "operation-client-list" : [ {
    "addressed-application-name" : "RegistryOffice",
    "addressed-application-release-number" : "0.0.1",
    "addressed-operation-name" : "/v1/register-application"
  }, {
    "addressed-application-name" : "ExecutionAndTraceLog",
    "addressed-application-release-number" : "0.0.1",
    "addressed-operation-name" : "/v1/record-service-request"
  } ]
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
exports.listOperationServersAtApplication = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "operation-server-name-list" : [ "/v1/register-yourself", "/v1/embed-yourself" ]
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
exports.notifyLinkUpdates = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
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
exports.provideCurrentOperationKey = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "operation-key" : "Operation key not yet provided."
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
exports.regardApplication = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    resolve();
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
exports.removeOperationClientFromLink = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
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
exports.startApplicationInGenericRepresentation = function(user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "consequent-action-list" : [ {
    "label" : "Inform about Application",
    "request" : "https://10.118.125.157:1005/v1/inform-about-application-in-generic-representation"
  } ],
  "response-value-list" : [ {
    "field-name" : "applicationName",
    "value" : "OwnApplicationName",
    "datatype" : "String"
  } ]
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
exports.updateAllLtpsAndFcs = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    resolve();
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
exports.updateFc = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
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
exports.updateFcPort = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
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
exports.updateLtp = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}

