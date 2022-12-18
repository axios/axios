
## axios + fetch: node

This directory contains examples of using Axios with the Fetch Adapter with Node JS. There are three samples:

- Sample for use with CommonJS, which works in nearly every Node environment (but has the largest bundle size)
- Sample for use with ESM, which works in Node `v12.x+` (and significantly improves bundle size / performance)
- Sample for use with ESM and native Fetch, which works in:
  - Node `v17.x` behind the `--experimental-fetch` flag
  - Node `v18.x+` without any special flags (where it should be used by default)

To summarize, that means:

| Node version       | Code sample | Bundle to use                | Notes                                                                           |
|:-------------------|:------------|:-----------------------------|:--------------------------------------------------------------------------------|
| `v18.x` or newer   | `native`    | `generic`                    | No flag needed! Native fetch go brrr 🚀                                         |
| `v17.x`            |             | `esm` or `generic` with flag | Pass the `--experimental-fetch` flag on `v17.x` if you use the `generic` bundle |
| `v12.x` to `v17.x` | `esm`       | `esm`                        |                                                                                 |
| Older than `v12.x` | `commonjs`  | `node`                       |                                                                                 |


### Native ESM example

> **Full sample code:** [./axios-node-native-sample.mjs](./axios-node-native-sample.mjs)

Specify the `generic` bundle when importing via ESM. Then, use `axios` as normal. When using the `generic` bundle, there
is no need to specify the `adapter` option; `fetch` is the only adapter which ships built-in:

```js
import axios from "axios/generic";

axios.get('https://...').then(/* ... */);
```


### ESM example

> **Full sample code:** [./axios-node-sample.mjs](./axios-node-sample.mjs)

Simply import Axios and use it as normal. When using the `esm` bundle, make sure to pass `{adapter: 'fetch'}` if you
want to use the Fetch adapter:

```js
import axios from "axios";

axios.get('https://...', {adapter: 'fetch'}).then(/* ... */);
```


### CommonJS example

> **Full sample code:** [./axios-node-sample.cjs](./axios-node-sample.cjs)

Simply require Axios and use it as normal. When using the `esm` or `node` bundle, make sure to pass `{adapter: 'fetch'}`
if you want to use the Fetch adapter:

```js
const axios = require("axios");

axios.get('https://...', {adapter: 'fetch'}).then(/* ... */);
```

#### Extra reference: Tests

If you want to see extra use examples with Deno, check out the unit tests, at `test/fetch/deno`. The abstract testsuite
for the Fetch adapter (`test/fetch/fetch_abstract.js`) is also very similar to a Deno test-suite.
