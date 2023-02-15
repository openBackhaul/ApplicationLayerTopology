const { elasticsearchService, getIndexAliasAsync, operationalStateEnum } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');

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
    let ping = await elasticsearchService.getElasticsearchClientOperationalStateAsync();
    if (ping === operationalStateEnum.UNAVAILABLE) {
        console.error(`Elasticsearch unavailable. Skipping Elasticsearch configuration.`);
        return;
    }
    await createIndexTemplate();
    await createAlias();
    console.log('Elasticsearch is properly configured!');
}

/**
 * @description Creates/updates index-template.
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
 * This template serves as binding between service policy and index.
 * If index-alias is changed, this index-template will be rewritten to reflect
 * the change, as we do not wish to continue applying service policy on an
 * index-alias that does not exist.
 *
 * Service policy is not set at this point in the index-template.
 * 
 * @returns {Promise<void>}
 */
async function createIndexTemplate() {
    let indexAlias = await getIndexAliasAsync();
    let client = await elasticsearchService.getClient(false);
    let found = await elasticsearchService.getExistingIndexTemplate();
    let iTemplate = found ? found : {
        name: 'alt-index-template',
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
        name: 'alt-mappings',
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
    iTemplate.body.composed_of = ['alt-mappings'];
    await client.indices.putIndexTemplate(iTemplate);
}

/**
 * @description Creates index-alias with first index serving
 * as write_index (if such alias does not exist yet). Such
 * index will always end with '-000001' to allow for automated
 * rollover.
 */
async function createAlias() {
    let indexAlias = await getIndexAliasAsync();
    let client = await elasticsearchService.getClient(false);
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
