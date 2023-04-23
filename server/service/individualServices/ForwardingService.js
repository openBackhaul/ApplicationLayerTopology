const {
    elasticsearchService,
    getIndexAliasAsync
} = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const ElasticsearchPreparation = require('./ElasticsearchPreparation');

exports.updateForwardingConstruct = async function (controlConstructUuid, newForwardingConstruct) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let response = await client.updateByQuery({
        index: indexAlias,
        body: {
            script: {
                source: `ctx._source['forwarding-domain'][0]['forwarding-construct'].removeIf(fc -> fc['uuid'] == params['uuid']);
                    ctx._source['forwarding-domain'][0]['forwarding-construct'].add(params['newForwardingConstruct'])`,
                params: {
                    "newForwardingConstruct": newForwardingConstruct,
                    "uuid": newForwardingConstruct[onfAttributes.GLOBAL_CLASS.UUID]
                }
            },
            query: {
                term: {
                    "uuid": controlConstructUuid
                }
            }
        },
    });
    if (response.body.updated === 1) {
        return { "took": response.body.took };
    } else {
        throw new Error("Forwarding Construct was not updated")
    }
}

exports.updateFCPort = async function (controlConstructUuid, fcUuid, newFCPort) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let response = await client.updateByQuery({
        index: indexAlias,
        body: {
            script: {
              source: `def fwDomain = ctx._source['forwarding-domain'];
                  for (domain in fwDomain) {
                    def fcs = domain['forwarding-construct'];
                    for (fc in fcs) {
                      if (fc['uuid'] == params['fc-uuid']) {
                        def ports = fc['fc-port'];
                        ports.removeIf(port -> port['local-id'] == params['local-id']);
                        ports.add(params['new-fc-port']);
                      }
                    }
                  }`,
                params: {
                    "new-fc-port": newFCPort,
                    "local-id": newFCPort[onfAttributes.LOCAL_CLASS.LOCAL_ID],
                    "fc-uuid": fcUuid
                }
            },
            query: {
                term: {
                    "uuid": controlConstructUuid
                }
            }
          }
    });
    if (response.body.updated === 1) {
        return { "took": response.body.took };
    } else {
        throw new Error("FCPort was not updated")
    }
}

/**
 * @description Removes fcPort from forwarding-construct
 * @param {String} fcPortLocalId Local ID of fcPort that should be deleted
 * @param {String} forwardingConstructUuid UUID of forwarding-construct containing fc-port to be deleted
 * @param {String} controlConstructUuid UUID of affected control construct
 * @returns {Promise<Object>} { took }
 */
exports.deleteFcPort = async function(fcPortLocalId, forwardingConstructUuid, controlConstructUuid) {
    let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
    let client = await elasticsearchService.getClient(false, esUuid);
    let indexAlias = await getIndexAliasAsync(esUuid);
    let response = await client.updateByQuery(
        {
        index: indexAlias,
        body: {
            "script": {
            "source": `def fwDomain = ctx._source['forwarding-domain'];
                for (domain in fwDomain) {
                    def fcs = domain['forwarding-construct'];
                    for (fc in fcs) {
                    if (fc['uuid'] == params['fc-uuid']) {
                        def ports = fc['fc-port'];
                        ports.removeIf(port -> port['local-id'] == params['local-id'])
                    }
                    }
                }
                `,
                "params": {
                    "local-id": fcPortLocalId,
                    "fc-uuid": forwardingConstructUuid
                }
            },
            "query": {
                "term": {
                    "uuid": controlConstructUuid
                }
            }
        }
        }
    );
    if (response && response.body.updated === 1) {
        return { "took" : response.body.took };
    } else {
        throw new Error ('fc-port was not deleted');
    }
}
