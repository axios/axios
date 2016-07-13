# Upgrade Guide

### 0.12.x -> 0.13.0

The `0.13.0` release contains several changes to custom adapters and error handling.

#### Error Handling

Previous to this release an error could either be a server response with bad status code or an actual `Error`. With this release Promise will always reject with an `Error`. In the case that a response was received, the `Error` will also include the response.

```js
axios.get('/user/12345')
  .catch((error) => {
    console.log(error.message);
    console.log(error.code); // Not always specified
    console.log(error.config); // The config that was used to make the request
    console.log(error.response); // Only available if response was received from the server
  });
```

#### Request Adapters

This release changes a few things about how request adapters work. Please take note if you are using your own custom adapter.

1. Response transformer is now called outside of adapter.
2. Request adapter returns a `Promise`.

This means that you no longer need to invoke `transformData` on response data. You will also no longer receive `resolve` and `reject` as arguments in your adapter.

Previous code:

```js
function myAdapter(resolve, reject, config) {
  var response = {
    data: transformData(
      responseData,
      responseHeaders,
      config.transformResponse
    ),
    status: request.status,
    statusText: request.statusText,
    headers: responseHeaders
  };
  settle(resolve, reject, response);
}
```

New code:

```js
function myAdapter(config) {
  return new Promise(function (resolve, reject) {
    var response = {
      data: responseData,
      status: request.status,
      statusText: request.statusText,
      headers: responseHeaders
    };
    settle(resolve, reject, response);
  });
}
```

See the related commits for more details:
- [Response transformers](https://github.com/mzabriskie/axios/commit/10eb23865101f9347570552c04e9d6211376e25e)
- [Request adapter Promise](https://github.com/mzabriskie/axios/commit/157efd5615890301824e3121cc6c9d2f9b21f94a)

### 0.5.x -> 0.6.0

The `0.6.0` release contains mostly bug fixes, but there are a couple things to be aware of when upgrading.

#### ES6 Promise Polyfill

Up until the `0.6.0` release ES6 `Promise` was being polyfilled using [es6-promise](https://github.com/jakearchibald/es6-promise). With this release, the polyfill has been removed, and you will need to supply it yourself if your environment needs it.

```js
require('es6-promise').polyfill();
var axios = require('axios');
```

This will polyfill the global environment, and only needs to be done once.

#### `axios.success`/`axios.error`

The `success`, and `error` aliases were deprectated in [0.4.0](https://github.com/mzabriskie/axios/blob/master/CHANGELOG.md#040-oct-03-2014). As of this release they have been removed entirely. Instead please use `axios.then`, and `axios.catch` respectively.

```js
axios.get('some/url')
  .then(function (res) {
    /* ... */
  })
  .catch(function (err) {
    /* ... */
  });
```

#### UMD

Previous versions of axios shipped with an AMD, CommonJS, and Global build. This has all been rolled into a single UMD build.

```js
// AMD
require(['bower_components/axios/dist/axios'], function (axios) {
  /* ... */
});

// CommonJS
var axios = require('axios/dist/axios');
```
