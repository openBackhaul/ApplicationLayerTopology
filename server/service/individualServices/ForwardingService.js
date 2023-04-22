const {
    elasticsearchService,
    getIndexAliasAsync
} = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const ElasticsearchPreparation = require('./ElasticsearchPreparation');

exports.updateForwardingConstructList = function (forwardingConstructListToBeUpdated) {
    return new Promise(async function (resolve, reject) {
        try {
            let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
            let client = await elasticsearchService.getClient(false, esUuid);
            let indexAlias = await getIndexAliasAsync(false, esUuid);
            let response;
            if (Object.keys(forwardingConstructListToBeUpdated).length >= 2) {

                response = await client.update({
                    index: indexAlias,
                    id: forwardingConstructListToBeUpdated.documentId,
                    body: {
                        script: {
                            source: "ctx._source['forwarding-domain'][0]['forwarding-construct'] = params['forwardingConstructList']",
                            params: {
                                "forwardingConstructList": forwardingConstructListToBeUpdated.forwardingConstructList
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
            let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
            let client = await elasticsearchService.getClient(false, esUuid);
            let indexAlias = await getIndexAliasAsync(esUuid);
            let res = await client.search({
                index: indexAlias,
                filter_path: "hits.hits._id,hits.hits._source.forwarding-domain",
                body: {
                    "query": {
                        "match": {
                            "uuid": controlConstructUuid
                        }

                    }

                }

            })

            if (Object.keys(res.body).length != 0) {
                forwardingDomainOfControlConstruct.forwardingDomainList = res.body.hits.hits[0]._source['forwarding-domain'];
                forwardingDomainOfControlConstruct.id = res.body.hits.hits[0]._id;
            } else {
                throw new Error('constrol construct is not present in Elastic Search')
            }
            resolve(forwardingDomainOfControlConstruct);
        } catch (error) {
            reject(error);
        }
    });
}

async function getForwardingConstructList(forwardingDomainOfControlConstruct, forwardingConstructUuid) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructList = {}
        try {
            let forwardingDomainList = forwardingDomainOfControlConstruct.forwardingDomainList;

            if (Object.keys(forwardingDomainOfControlConstruct).length != 0) {
                let forwardingDomain = forwardingDomainList[0];
                forwardingConstructList.forwardingConstruct = forwardingDomain[onfAttributes.FORWARDING_DOMAIN.FORWARDING_CONSTRUCT];
                forwardingConstructList.indexOfIncomingForwardingConstructUuid = forwardingConstructList.forwardingConstruct.map(forwardingConstruct => forwardingConstruct.uuid).indexOf(forwardingConstructUuid);
            }
            resolve(forwardingConstructList);
        } catch (error) {
            reject(error);
        }
    });
}

exports.getForwardingConstructListToUpdateFc = function (controlConstructUuid, forwardingConstructUuid, forwardingConstructFromRequest) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstruct = {};
        let forwardingConstructList;
        try {

            let forwardingDomainOfControlConstruct = await getForwardingDomainFromControlConstruct(controlConstructUuid);
            let documentId = forwardingDomainOfControlConstruct.id;

            let forwardingControlConstructList = await getForwardingConstructList(forwardingDomainOfControlConstruct, forwardingConstructUuid);
            let indexOfIncomingForwardingConstructUuid = forwardingControlConstructList.indexOfIncomingForwardingConstructUuid;
            forwardingConstructList = forwardingControlConstructList.forwardingConstruct

            if (forwardingConstructList) {
                if (indexOfIncomingForwardingConstructUuid == -1) {
                    forwardingConstructList.push(forwardingConstructFromRequest)
                } else {
                    let forwardingConstruct = forwardingConstructList.at(indexOfIncomingForwardingConstructUuid);
                    if (JSON.stringify(forwardingConstruct) != JSON.stringify(forwardingConstructFromRequest)) {
                        forwardingConstructList.splice(indexOfIncomingForwardingConstructUuid, 1, forwardingConstructFromRequest)
                    }
                }
                forwardingConstruct.documentId = documentId;
                forwardingConstruct.forwardingConstructList = forwardingConstructList;
            }

            resolve(forwardingConstruct);
        } catch (error) {
            reject(error);
        }
    });
}

async function getFcPortList(forwardingConstructList, fcPortLocalId) {
    return new Promise(async function (resolve, reject) {
        let fcPortListToBeUpdated = {}
        try {
            let indexOfIncomingFcPortLocalId;
            let fcPortList;
            let forwardingConstruct;
            let listOfForwardingConstruct = forwardingConstructList.forwardingConstruct
            let indexOfIncomingForwardingConstructUuid = forwardingConstructList.indexOfIncomingForwardingConstructUuid
            if (listOfForwardingConstruct) {
                if (indexOfIncomingForwardingConstructUuid != -1) {
                    forwardingConstruct = listOfForwardingConstruct.at(indexOfIncomingForwardingConstructUuid);
                    fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT]
                    indexOfIncomingFcPortLocalId = fcPortList.map(fcPort => fcPort["local-id"]).indexOf(fcPortLocalId);

                    fcPortListToBeUpdated.indexOfIncomingFcPortLocalId = indexOfIncomingFcPortLocalId;
                    fcPortListToBeUpdated.fcPortList = fcPortList;
                    fcPortListToBeUpdated.forwardingConstruct = forwardingConstruct
                }
            }
            resolve(fcPortListToBeUpdated);
        } catch (error) {
            reject(error);
        }
    });
}

async function getUpdatedForwardingConstructList(forwardingConstructList, fcPort, documentId) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructListToBeUpdated = {}
        try {
            let fcPortList = fcPort.fcPortList
            let forwardingConstruct = fcPort.forwardingConstruct;

            let listOfForwardingConstruct = forwardingConstructList.forwardingConstruct
            let indexOfIncomingForwardingConstructUuid = forwardingConstructList.indexOfIncomingForwardingConstructUuid

            forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT] = fcPortList;
            listOfForwardingConstruct.splice(indexOfIncomingForwardingConstructUuid, 1, forwardingConstruct);
            forwardingConstructListToBeUpdated.documentId = documentId;
            forwardingConstructListToBeUpdated.forwardingConstructList = listOfForwardingConstruct;

            resolve(forwardingConstructListToBeUpdated);
        } catch (error) {
            reject(error);
        }
    });
}

exports.getForwardingConstructListToUpdateFcPort = function (controlConstructUuid, forwardingConstructUuid, fcPortFromRequest) {
    return new Promise(async function (resolve, reject) {
        try {

            let forwardingDomainOfControlConstruct = await getForwardingDomainFromControlConstruct(controlConstructUuid);
            let documentId = forwardingDomainOfControlConstruct.id;

            let forwardingConstructList = await getForwardingConstructList(forwardingDomainOfControlConstruct, forwardingConstructUuid);
            let fcPortLocalId = fcPortFromRequest['local-id']
            let fcPort = await getFcPortList(forwardingConstructList, fcPortLocalId);
            let indexOfIncomingFcPortLocalId = fcPort.indexOfIncomingFcPortLocalId;

            if (indexOfIncomingFcPortLocalId != -1) {
                let existingFcPort = fcPort.fcPortList.at(indexOfIncomingFcPortLocalId);
                if (JSON.stringify(existingFcPort) != JSON.stringify(fcPortFromRequest)) {
                    fcPort.fcPortList.splice(indexOfIncomingFcPortLocalId, 1, fcPortFromRequest)
                }
            } else {
                fcPort.fcPortList.push(fcPortFromRequest);
            }

            let forwardingConstructListToBeUpdated = await getUpdatedForwardingConstructList(forwardingConstructList, fcPort, documentId);


            resolve(forwardingConstructListToBeUpdated);
        } catch (error) {
            reject(error);
        }
    });
}
