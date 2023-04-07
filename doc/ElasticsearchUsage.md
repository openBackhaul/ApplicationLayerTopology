## Using Elasticsearch in ApplicationLayerTopology Application

Unlike other applications using ES, ALT uses 2 index aliases, that are configured in config file. One index alias is used for storing control-constructs of regarded application, other is used to store links between applications.

The implicit rule, even if an index alias changes, is that the index alias covering links would end it's UUID with numbers `001`, whereas the control-construct index alias would end it's UUID with numbers `000`.

### controllers/ElasticsearchClient.js

All the REST API methods are implemented using the same standard as any other application/controller methods, except for following:

```
module.exports.getElasticsearchClientServiceRecordsPolicy = function getElasticsearchClientServiceRecordsPolicy (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.METHOD_NOT_ALLOWED;
  responseBuilder.buildResponse(res, responseCode, {});
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};
```
```
module.exports.putElasticsearchClientServiceRecordsPolicy = function putElasticsearchClientServiceRecordsPolicy (req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.METHOD_NOT_ALLOWED;
  responseBuilder.buildResponse(res, responseCode, {});
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};
```

The methods dealing with ServiceRecordsPolicy are **not** used in ALT and should return HTTP status `405 Method not Allowed`.

### service/individualService/ElasticsearchPreparation.js

Since ALT uses 2 index aliases, ElasticsearchPreparation contains a method (`getCorrectEsUuid`) that returns correct ES client UUID (this is to avoid using UUIDs directly) based on whether the user wants control-construct index alias or links index alias.

**Control-construct index template configuration**

Although no policy is used with this index, some explicit mapping needs to be set. The control-construct as object was omitted, since each ES document represents one control-construct and the mapping is following:
```
template: {
    mappings: {
        properties: {
            'uuid': { type: 'keyword' },
            'logical-termination-point': { type: 'flattened' },
            'forwarding-domain': { type: 'flattened' }
        }
    }
}
```

**Links index template configuration**

Each link represents one document in ES and the explicit mapping is following:
```
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
```
The usage of ES within these indexes is the same as for other applications with one index.