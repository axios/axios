# Upgrade Guide

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
