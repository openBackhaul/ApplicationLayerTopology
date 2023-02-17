const { elasticsearchService, getIndexAliasAsync, operationalStateEnum } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');

const ELASTICSEARCH_CLIENT_CC_UUID = "alt-2-0-1-es-c-es-1-0-0-000";
const ELASTICSEARCH_CLIENT_LINKS_UUID = "alt-2-0-1-es-c-es-1-0-0-001";

const ELASTICSEARCH_CLIENT_UUIDS = [ELASTICSEARCH_CLIENT_CC_UUID, ELASTICSEARCH_CLIENT_LINKS_UUID];

/**
 * @description Elasticsearch preparation. Checks if ES instance is configured properly.
 * As first step, tries pinging the ES instance. If this doesn't work, ES
 * is considered not reachable or configured with wrong connection parameters.
 *
 * ALT application will still run and allow the operator to properly configure
 * ES connection parameters through REST API.
 *
 * If the ES instance is reachable, as next steps it will try to find existing or
 * configure index-pattern and index-alias, based on index-alias in CONFIG file.
 *
 * @returns {Promise<void>}
 */
module.exports = async function prepareElasticsearch() {
    console.log("Configuring Elasticsearch...");
    for (let uuid of ELASTICSEARCH_CLIENT_UUIDS) {
        let ping = await elasticsearchService.getElasticsearchClientOperationalStateAsync(uuid);
        if (ping === operationalStateEnum.UNAVAILABLE) {
            console.error(`Elasticsearch unavailable. Skipping Elasticsearch configuration.`);
            return;
        }
        if (uuid === ELASTICSEARCH_CLIENT_CC_UUID) {
            await configureControlConstructIndexTemplate(uuid);
        } else if (uuid === ELASTICSEARCH_CLIENT_LINKS_UUID) {
            await configureLinksIndexTemplate(uuid);
        }
        await createAlias(uuid);
    }
    console.log('Elasticsearch is properly configured!');
}

/**
 * @description Creates/updates index-template for control-construct index.
 *
 * ALT stores entire control-construct objects for all applications. The design
 * here is to have one document (control-construct) per application. The top
 * level fields should be uuid, logical-termination-point, profile-collection
 * and forwarding-domain.
 *
 * UUID field is a structured one and ES would split it by '-' if stored
 * as text, therefore we will store it as keyword.
 * The rest of the fields will ES store as objects by default, but objects are
 * not searchable, therefore 'flattened' will be used as type. This allows for
 * nested UUID search, which will return the entire control-construct.
 *
 * If index-alias is changed, this index-template will be rewritten to reflect
 * the change.
 *
 * @returns {Promise<void>}
 */
async function configureControlConstructIndexTemplate(uuid) {
    let indexAlias = await getIndexAliasAsync(uuid);
    let client = await elasticsearchService.getClient(false, uuid);
    let found = await elasticsearchService.getExistingIndexTemplate(uuid);
    let iTemplate = found ? found : {
        name: 'alt-cc-index-template',
        body: {
            index_patterns: `${indexAlias}-*`,
            template: {
                settings: {
                    'index.lifecycle.rollover_alias': indexAlias
                }
            }
        }
    }
    await client.cluster.putComponentTemplate({
        name: 'alt-cc-mappings',
        body: {
            template: {
                mappings: {
                    properties: {
                        'uuid': { type: 'keyword' },
                        'profile-collection': { type: 'flattened' },
                        'logical-termination-point': { type: 'flattened' },
                        'forwarding-domain': { type: 'flattened' }
                    }
                }
            }
        }
    });
    iTemplate.body.composed_of = ['alt-cc-mappings'];
    await client.indices.putIndexTemplate(iTemplate);
}

/**
 * @description Creates/updates index-template for links index.
 *
 * In this index ALT will store links (point to multi-point). The design
 * here is to have one document per link.
 *
 * UUID field is a structured one and ES would split it by '-' if stored
 * as text, therefore we will store it as keyword.
 * The 'link-port' field will ES store as object by default, but object is
 * not searchable and the inner relationship could be lost, therefore 'nested'
 * will be used as type. This allows for nested UUID search, which will return
 * the entire link. Also all inner fields are mapped explicitly, since we also
 * need logical-termination-point to be mapped as keyword too.
 *
 * If index-alias is changed, this index-template will be rewritten to reflect
 * the change.
 *
 * @returns {Promise<void>}
 */
async function configureLinksIndexTemplate(uuid) {
    let indexAlias = await getIndexAliasAsync(uuid);
    let client = await elasticsearchService.getClient(false, uuid);
    let found = await elasticsearchService.getExistingIndexTemplate(uuid);
    let iTemplate = found ? found : {
        name: 'alt-links-index-template',
        body: {
            index_patterns: `${indexAlias}-*`,
            template: {
                settings: {
                    'index.lifecycle.rollover_alias': indexAlias
                }
            }
        }
    }
    await client.cluster.putComponentTemplate({
        name: 'alt-links-mappings',
        body: {
            template: {
                mappings: {
                    properties: {
                        uuid: { type: 'keyword' },
                        'link-port': {
                            type: 'nested',
                            properties: {
                                'local-id': { type: 'short' },
                                'port-direction': { type: 'keyword' },
                                'logical-termination-point': { type: 'keyword' }
                              }
                        }
                    }
                }
            }
        }
    });
    iTemplate.body.composed_of = ['alt-links-mappings'];
    await client.indices.putIndexTemplate(iTemplate);
}

/**
 * @description Creates index-alias with first index serving
 * as write_index (if such alias does not exist yet).
 */
async function createAlias(uuid) {
    let indexAlias = await getIndexAliasAsync(uuid);
    let client = await elasticsearchService.getClient(false, uuid);
    let alias = await client.indices.existsAlias({
        name: indexAlias
    });
    if (!alias.body) {
        await client.indices.create({
            index: `${indexAlias}-000001`,
            body: {
                aliases: {
                    [indexAlias]: {
                        is_write_index: true
                    }
                }
            }
        });
    }
}
