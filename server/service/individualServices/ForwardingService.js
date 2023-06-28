const {
    elasticsearchService,
    getIndexAliasAsync
} = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const ElasticsearchPreparation = require('./ElasticsearchPreparation');
const createHttpError = require('http-errors');
class ForwardingService {

    static async updateForwardingConstruct(controlConstructUuid, newForwardingConstruct) {
        let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
        let client = await elasticsearchService.getClient(false, esUuid);
        let indexAlias = await getIndexAliasAsync(esUuid);
        let response = await client.updateByQuery({
            index: indexAlias,
            refresh: true,
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
            if (response.body.total === 0) {
                throw new createHttpError.BadRequest(`CC with uuid ${controlConstructUuid} does not exist.`)
            }
            throw new Error("Forwarding Construct was not updated")
        }
    }

    static async updateFCPort(controlConstructUuid, fcUuid, newFCPort) {
        let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
        let client = await elasticsearchService.getClient(false, esUuid);
        let indexAlias = await getIndexAliasAsync(esUuid);
        let response = await client.updateByQuery({
            index: indexAlias,
            refresh: true,
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
            if (response.body.total === 0) {
                throw new createHttpError.BadRequest(`CC with uuid ${controlConstructUuid} does not exist.`)
            }
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
    static async deleteFcPort(fcPortLocalId, forwardingConstructUuid, controlConstructUuid) {
        let esUuid = await ElasticsearchPreparation.getCorrectEsUuid(false);
        let client = await elasticsearchService.getClient(false, esUuid);
        let indexAlias = await getIndexAliasAsync(esUuid);
        let response = await client.updateByQuery(
            {
                index: indexAlias,
                refresh: true,
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
        return { "took": response.body.took };
    }

    /**
     * @description Finds and deletes fc-ports where INPUT ports match given ltpUUID.
     * @param {Object} controlConstruct
     * @param {String} ltpUuid
     * @returns {Promise<Object>} { took }
     */
    static async deleteDependentFcPorts(controlConstruct, ltpUuid) {
        let forwardingDomainList = controlConstruct[onfAttributes.CONTROL_CONSTRUCT.FORWARDING_DOMAIN];
        let took = 0;
        for (let forwardingDomain of forwardingDomainList) {
            let fcList = forwardingDomain[onfAttributes.FORWARDING_DOMAIN.FORWARDING_CONSTRUCT];
            for (let fc of fcList) {
                let fcUuid = fc[onfAttributes.GLOBAL_CLASS.UUID];
                let fcPortList = fc[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
                for (let fcPort of fcPortList) {
                    let fcPortLocalId = fcPort[onfAttributes.LOCAL_CLASS.LOCAL_ID];
                    let fcPortlogicalTerminationPoint = fcPort[onfAttributes.CONTROL_CONSTRUCT.LOGICAL_TERMINATION_POINT];
                    if (fcPortlogicalTerminationPoint === ltpUuid) {
                        let deleteResponse = this.deleteFcPort(
                            fcPortLocalId,
                            fcUuid,
                            controlConstruct[onfAttributes.GLOBAL_CLASS.UUID]
                        );
                        took += deleteResponse.took;
                    }
                }
            }
        }
        return { "took": took };
    }
}

module.exports = ForwardingService;
