# Adapters

Adapters allow you to customize the way axios handles the request data. By default, axios uses the `xhr` adapter, in a browser environment, and the `http` adapter in a Node.js environment. Recently we added the new `fetch` adapter that allows you to use the `fetch` API.

Writing your own adapter allows you to control how axios makes a request and how it receives a response. This can be useful if you need to modify the request or response in some way.

## Creating an adapter

To create an adapter, you can use the following template:

```js
var settle = require("./../core/settle");

module.exports = function myAdapter(config) {
  /**
   * At this point the following is true:
   *
   * - specified config has been merged with defaults
   * - request transformers have run
   * - request interceptors have run
   *
   * It is now the adapter's responsibility to provide a valid response.
   */

  return new Promise(function (resolve, reject) {
    var response = {
      data: responseData,
      status: request.status,
      statusText: request.statusText,
      headers: responseHeaders,
      config: config,
      request: request,
    };

    settle(resolve, reject, response);

    /**
     * From here the following will happen:
     * - response transformers will run
     * - response interceptors will run
     */
  });
};
```
