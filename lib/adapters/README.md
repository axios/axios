# axios // adapters

The modules under `adapters/` are modules that handle dispatching a request and settling a `Promise` once a response is received.

## Example

```js
var settle = require('../helpers/settle');
var transformData = require('./../helpers/transformData');

module.exports myAdapter(resolve, reject, config) {
  // At this point:
  //  - config has been merged with defaults
  //  - request transformers have already run
  //  - request interceptors have already run
  
  // Make the request using config provided/
  // Upon response settle the Promise
  
  var response = {
    data: transformData(
      responseData,
      responseHeaders,
      config.transformResponse
    ),
    status: request.status,
    statusText: request.statusText,
    headers: responseHeaders,
    config: config,
    request: request
  };

  settle(resolve, reject, response);

  // From here:
  //  - response interceptors will run
}
```
