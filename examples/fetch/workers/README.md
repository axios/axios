
## axios + fetch: CloudFlare Workers

This directory contains examples of using Axios with the Fetch Adapter in a CloudFlare Worker.

When running in Workers, one must use the [`generic` bundle](../README.md), which avoids the overhead of polyfills in
environments like Workers that natively support `fetch`.


### Full example

> **Full sample code:** [./axios-worker.mjs](./axios-worker.mjs)

Simply import Axios from GitHub, NPM, or wherever you have it installed, then use it as normal. If you are using the
`generic` bundle, the Fetch adapter is used by default:

```js
import axios from "axios/generic";

async function handler(request) {
    // use axios
    return await axios({
        url: 'https://...'
    }).then(response => {
        // if you are returning directly from Axios, make sure to translate the response into a standard Fetch
        // `Response`. here's an example:
        return new Response(response.data, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
    });
}

export default {
    async fetch(request) {
        return await handler(request);
    },
};
```

In your `wrangler.toml`:
```toml
name = "<some-worker-name>"
workers_dev = true
compatibility_date = "2022-12-17"
main = "axios-worker.mjs"
```

Install `axios`, and `wrangler` (version 2) if needed:
```sh
npm install axios@github:sgammon
npm install -g wrangler
```

Try it out:
```sh
wrangler dev
```
