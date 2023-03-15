const {
    elasticsearchService,
    getIndexAliasAsync
} = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');

const ELASTICSEARCH_CLIENT_CC_UUID = "alt-2-0-1-es-c-es-1-0-0-000";

exports.updateForwardingConstructList = function (forwardingConstructListToBeUpdated) {
    return new Promise(async function (resolve, reject) {
        try {
            let client = await elasticsearchService.getClient(false, ELASTICSEARCH_CLIENT_CC_UUID);
            let indexAlias = await getIndexAliasAsync(ELASTICSEARCH_CLIENT_CC_UUID);
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
            let client = await elasticsearchService.getClient(false, ELASTICSEARCH_CLIENT_CC_UUID);
            let indexAlias = await getIndexAliasAsync(ELASTICSEARCH_CLIENT_CC_UUID);
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


exports.getForwardingConstructListToUpdateFcPort = function (controlConstructUuid, forwardingConstructUuid, fcPortFromRequest) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructListToBeUpdated = {};
        let forwardingConstructList;
        try {

            let forwardingDomainOfControlConstruct = await getForwardingDomainFromControlConstruct(controlConstructUuid);
            let documentId = forwardingDomainOfControlConstruct.id;

            let forwardingControlConstructList = await getForwardingConstructList(forwardingDomainOfControlConstruct, forwardingConstructUuid);
            let indexOfIncomingForwardingConstructUuid = forwardingControlConstructList.indexOfIncomingForwardingConstructUuid;
            forwardingConstructList = forwardingControlConstructList.forwardingConstruct

            if (forwardingConstructList) {
                if (indexOfIncomingForwardingConstructUuid != -1) {
                    let forwardingConstruct = forwardingConstructList.at(indexOfIncomingForwardingConstructUuid);
                    let fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT]
                    let fcPortLocalId = fcPortFromRequest["local-id"];
                    let indexOfIncomingFcPortLocalId = fcPortList.map(fcPort => fcPort["local-id"]).indexOf(fcPortLocalId);
                    if (indexOfIncomingFcPortLocalId != -1) {
                        let existingFcPort = fcPortList.at(indexOfIncomingFcPortLocalId);
                        if (JSON.stringify(existingFcPort) != JSON.stringify(fcPortFromRequest)) {
                            fcPortList.splice(indexOfIncomingFcPortLocalId, 1, fcPortFromRequest)
                        }
                    } else {
                        fcPortList.push(fcPortFromRequest);
                    }
                    forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT] = fcPortList;
                    forwardingConstructList.splice(indexOfIncomingForwardingConstructUuid, 1, forwardingConstruct);
                    forwardingConstructListToBeUpdated.documentId = documentId;
                    forwardingConstructListToBeUpdated.forwardingConstructList = forwardingConstructList;
                }
            }
            resolve(forwardingConstructListToBeUpdated);
        } catch (error) {
            reject(error);
        }
    });
}