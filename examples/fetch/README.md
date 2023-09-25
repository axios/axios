# axios + fetch

This directory provides sample code for using Axios with the [Fetch API][1]. As of version `1.2.1`, Axios has a built-in
adapter for using `fetch` in environments that support it, and additionally supports use with Fetch API objects like
[`URL`][2], [`Request`][3], and [`Response`][4].

Fetch is supported in many modern JS environments, including [browsers][5], [Node.js][6] (experimental as of [v18][7]
and stable as of [v19][8]), [Deno][9], [Bun][10], and [CloudFlare Workers][11].

The Fetch adapter is available in every distribution of Axios. The `general` distribution ships with only the fetch
adapter built-in, which is ideal for pure-JS environments (see _Using the generic bundle_ below for more information).

### Using the Fetch adapter

To use the Fetch adapter, simply pass `fetch` as the `adapter` option to Axios:

```js
axios('https://...', {adapter: 'fetch'});
```

Or:
```js
axios({
    url: 'https://...',
    adapter: 'fetch'
});
```

Or:
```js
axios.get('https://...', {adapter: 'fetch'});
```

Just like the Fetch API itself, Axios supports [`URL`][2] and [`Request`][3] objects as inputs:

```js
axios(new URL('https://...'), {adapter: 'fetch'});
```

Or:
```js
axios({
    url: new URL('https://...'),
    adapter: 'fetch'
});
```

Or:
```js
axios(new Request(new URL('https://...')), {adapter: 'fetch'});
```

#### Passing options to the Fetch adapter

The Fetch adapter supports an Axios configuration parameter called `fetchOptions`. You can pass any of the supported
[options for `fetch`][22] for your environment.

```js
axios('https://...', {
  adapter: 'fetch',
  fetchOptions: {
    credentials: 'include',
    mode: 'cors',
  },
});
```

Options are sometimes customized by each environment:
- [Browser options for fetch][22]
- [Node.js options for fetch][23]
- [Deno options for fetch][24]
- [CloudFlare Workers options for fetch][25]


### Using the generic bundle (Deno, Workers, etc.)

Many environments support the Fetch API, beyond just browsers and Node.js. Because of this, there is a distribution of
Axios called `generic`, which is tuned for pure-JS environments. This distribution includes the Fetch adapter as the
default adapter.

High-level details about the `generic` bundle:
- Ships with only the `fetch` adapter
- Assumes support for `Promise`, `URL`, `FormData`, `ReadableStream`, and the Fetch API
- Structured as an JavaScript module (ESM)

Using the ESM bundle is easy. For example:

**Environments that support remote ESM bundles (e.g. Deno):**
```js
import axios from 'https://axios.elide.dev/axios/1.2.1-fetch/beta2/generic/axios.min.mjs';

// use axios as normal
```

**Environments that support local ESM bundles (e.g. CloudFlare Workers):**
```js
// first: `npm install axios@github:sgammon/axios`

import axios from "axios/dist/generic/axios.mjs";

// ... use axios as normal ...
```

#### Environments supported by the `generic` bundle

See below. If your environment is not listed, you can still use Axios with Fetch, but you will need to use one of the
other bundle types (`browser`, `node`, `esm`, etc).

| Environment          | Supported?                 | Notes                                                 |
|----------------------|----------------------------|-------------------------------------------------------|
| Modern browsers      | ✅ Tested continuously      | **Note:** Generic bundle does not ship an XHR adapter |
| Node `v18.x+`        | ✅ Tested continuously      |                                                       |
| Deno `v1.x`          | ✅ Tested continuously      |                                                       |
| CloudFlare Workers   | ✅ Tested locally           |                                                       |
| Bun                  | ⚠️ Not tested              |                                                       |
| Node `v17.x`         | ⚠️ Behind a flag           |                                                       |
| Node `v12.x`-`v17.x` | ⛔️ Use the Node bundle[^1] |                                                       |
| Node pre-`v12.x`     | ⛔ No support for ESM       |                                                       |

## Available samples

Samples are available for:

- [Browser](./browser) ([ESM](./browser/minimal.esm.html) + [non-ESM](./browser/minimal.html))
- [Node](./node)
- [Deno](./deno)
- [CloudFlare Workers](./workers)

### Running the examples

To run the Fetch examples:

1. `git clone https://github.com/axios/axios.git`
2. `cd axios/examples/fetch`
3. Enter the directory for the samples you wish to run
4. Follow directions in the sample's README


### Further reading about the Fetch API

- [WhatWG Fetch Standard][19]
- MDN is a great source for docs about the [Fetch API][1], including:
    - [`fetch`][12]: the main entrypoint to the Fetch API
    - [`Request`][3]: the object used to configure a request
    - [`Response`][4]: the object returned by a `fetch`
    - [`Headers`][13]: the object used to express request and response headers
- CanIUse has great [stats on browser support][12] about Fetch and the features it depends on
    - **97.08%**: Fetch standard as of Dec 2022 ([link][13])
    - **97.67%**: [Promises][20] as of Dec 2022 ([link][21])
    - **96.07%**: [`AbortController`][14] & [`AbortSignal`][15] as of Dec 2022 ([link][16])
    - **95.98%**: Web Streams ([`ReadableStream`][17]) as of Dec 2022 ([link][18])


[1]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
[2]: https://developer.mozilla.org/en-US/docs/Web/API/URL
[3]: https://developer.mozilla.org/en-US/docs/Web/API/Request
[4]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[5]: https://caniuse.com/#feat=fetch
[6]: https://nodejs.org/api/fetch.html
[7]: https://nodejs.org/api/fetch.html#fetch_fetch_url_options
[8]: https://github.com/nodejs/node/blob/main/doc/changelogs/CHANGELOG_V19.md#other-notable-changes-2
[9]: https://deno.land/manual/examples/fetch
[10]: https://github.com/oven-sh/bun/blob/main/test/bun.js/fetch.test.js
[11]: https://developers.cloudflare.com/workers/runtime-apis/fetch
[12]: https://caniuse.com/?search=fetch
[13]: https://caniuse.com/fetch
[14]: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
[15]: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
[16]: https://caniuse.com/abortcontroller
[17]: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
[18]: https://caniuse.com/mdn-api_readablestream
[19]: https://fetch.spec.whatwg.org/
[20]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[21]: https://caniuse.com/promises
[22]: https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#parameters
[23]: https://nodejs.org/dist/latest-v19.x/docs/api/globals.html#fetch
[24]: https://deno.land/api@v1.29.1?s=RequestInit
[25]: https://developers.cloudflare.com/workers//runtime-apis/request#requestinit

[^1]: Node JS before `v18.x` considers `fetch` experimental. Node before `v17.x` does not have a native `fetch`
      implementation. Without a native implementation, the regular `node` bundle should be used instead of the generic
      bundle, which ships support for Node's [`http`](https://nodejs.org/dist/latest-v12.x/docs/api/http.html) API.
