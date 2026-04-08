# Adapters

Adapters allow you to customize the way axios handles the request data. By default, axios uses an ordered priority list of `['xhr', 'http', 'fetch']` and selects the first adapter that is supported by the current environment. In practice this means `xhr` is used in browsers, `http` in Node.js, and `fetch` in environments where neither is available (such as Cloudflare Workers or Deno).

Writing your own adapter lets you fully control how axios makes a request and processes the response — useful for testing, custom transports, or non-standard environments.

## Built-in adapters

You can select a built-in adapter by name using the `adapter` config option:

```js
// Use the fetch adapter
const instance = axios.create({ adapter: "fetch" });

// Use the XHR adapter (browser default)
const instance = axios.create({ adapter: "xhr" });

// Use the HTTP adapter (Node.js default)
const instance = axios.create({ adapter: "http" });
```

You can also pass an array of adapter names. axios will use the first one supported by the current environment:

```js
const instance = axios.create({ adapter: ["fetch", "xhr", "http"] });
```

For more details on the `fetch` adapter, see the [Fetch adapter](/pages/advanced/fetch-adapter) page.

## Creating a custom adapter

To create a custom adapter, write a function that accepts a `config` object and returns a Promise that resolves to a valid axios response object.

```js
import axios from "axios";
import { settle } from "axios/unsafe/core/settle.js";

function myAdapter(config) {
  /**
   * At this point:
   * - config has been merged with defaults
   * - request transformers have run
   * - request interceptors have run
   *
   * The adapter is now responsible for making the request
   * and returning a valid response object.
   */

  return new Promise((resolve, reject) => {
    // Perform your custom request logic here.
    // This example uses the native fetch API as a starting point.
    fetch(config.url, {
      method: config.method?.toUpperCase() ?? "GET",
      headers: config.headers?.toJSON() ?? {},
      body: config.data,
      signal: config.signal,
    })
      .then(async (fetchResponse) => {
        const responseData = await fetchResponse.text();

        const response = {
          data: responseData,
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          headers: Object.fromEntries(fetchResponse.headers.entries()),
          config,
          request: null,
        };

        // settle resolves or rejects the promise based on the HTTP status
        settle(resolve, reject, response);

        /**
         * After this point:
         * - response transformers will run
         * - response interceptors will run
         */
      })
      .catch(reject);
  });
}

const instance = axios.create({ adapter: myAdapter });
```

::: tip
The `settle` helper resolves the promise for 2xx status codes and rejects it for everything else, matching axios's default behaviour. If you want custom status validation, use the `validateStatus` config option instead.
:::
