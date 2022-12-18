
## axios + fetch: deno

This directory contains examples of using Axios with the Fetch Adapter with Deno. There is a sample and a Deno benchmark
which measures overhead of the Axios fetch adapter.

On Deno, it is best to use the [`generic` bundle](../README.md), which avoids the overhead of polyfills for features
natively supported in pure-JS environments like Deno.


### Full example

> **Full sample code:** [./axios-deno-sample.js](./axios-deno-sample.js)

Simply import Axios from GitHub, NPM, or wherever you have it installed, then use it as normal. If you are using the
`generic` bundle, the Fetch adapter is used by default:

```js
import axios from "https://axios.elide.dev/axios/1.2.1-fetch/beta2/generic/axios.mjs";

axios.get('https://...').then(/* ... */);
```

#### Extra reference: Tests

If you want to see extra use examples with Deno, check out the unit tests, at `test/fetch/deno`. The abstract testsuite
for the Fetch adapter (`test/fetch/fetch_abstract.js`) is also very similar to a Deno test-suite.
