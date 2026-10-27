# Fetch adapter <Badge type="tip" text="New" />

The `fetch` adapter is a new adapter that we have introduced as of version 1.7.0. This provides a way to use axios with the `fetch` API thus giving you the best of both worlds. By default, `fetch` will be used if `xhr` and `http` adapters are not available in the build, or not supported by the environment. To use it by default, it must be selected explicitly by setting the `adapter` option to `fetch` when creating an instance of axios.

```js
import axios from 'axios';

const instance = axios.create({
  adapter: 'fetch',
});
```

The adapter supports the same functionality as the `xhr` adapter, including upload and download progress capturing. It also supports additional response types such as `stream` and `formdata` (if supported by the environment).

When `auth` is omitted, the fetch adapter can read HTTP Basic auth credentials from the request URL, for example `https://user:pass@example.com`. Percent-encoded URL credentials are decoded before the `Authorization` header is generated, and `auth` takes precedence over URL-embedded credentials.

## Response size limits

When `maxContentLength` is set, the fetch adapter rejects with `ERR_BAD_RESPONSE` if the response exceeds the limit, including while the body is being read. The error keeps the current `config` and `request` even when the runtime wraps or drops the original stream error, so it is not reported as a network error. Unlike an `ERR_BAD_RESPONSE` caused by a 5xx status, a size-limit error has no `error.response`.

```js
try {
  await axios.get('https://example.com/large-file', {
    adapter: 'fetch',
    maxContentLength: 10 * 1024 * 1024, // 10 MB
  });
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_BAD_RESPONSE' && !error.response) {
      console.error('Response too large:', error.message);
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Network failure');
    }
  }
}
```

With `responseType: 'stream'` or `'response'`, the request resolves as soon as the response stream is available. axios rejects the request early only when a declared `Content-Length` already exceeds the limit. Otherwise the size check runs as you read the stream, and an oversized body makes the read fail with the same `ERR_BAD_RESPONSE` after the request promise has resolved. Handle errors while consuming the stream as well:

```js
const response = await axios.get('https://example.com/large-file', {
  adapter: 'fetch',
  responseType: 'stream',
  maxContentLength: 10 * 1024 * 1024, // 10 MB
});

const reader = response.data.getReader();

try {
  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    // process chunk.value
  }
} catch (error) {
  if (axios.isAxiosError(error) && error.code === 'ERR_BAD_RESPONSE') {
    console.error('Response too large:', error.message);
  }
}
```

## Redirects

By default the fetch adapter lets the runtime follow redirects. Setting `maxRedirects: 0` requests the platform's manual redirect mode (`redirect: 'manual'`). What you receive then depends on the fetch runtime:

- Node.js may expose the `3xx` status and its `Location` header. With the default `validateStatus`, this response rejects; accept `3xx` statuses to handle it yourself.
- Browsers return an opaque redirect with status `0` and inaccessible headers, so the target location cannot be read.

```js
const response = await axios.get('https://example.com/old-path', {
  adapter: 'fetch',
  maxRedirects: 0,
  validateStatus: (status) => status < 400,
});

// In Node.js, for example: 301 'https://example.com/new-path'
console.log(response.status, response.headers.get('location'));
```

Do not rely on the Node.js behavior in browser code. Positive `maxRedirects` values do not limit the number of redirects in the fetch adapter; only `0` changes its behavior.

## Custom fetch <Badge type="tip" text="v1.12.0+" />

Starting from `v1.12.0`, you can customise the fetch adapter to use a custom `fetch` function instead of the environment global. You can pass a custom `fetch` function, `Request`, and `Response` constructors via the `env` config option. This is useful when working with custom environments or app frameworks that provide their own `fetch` implementation.

::: info
When using a custom `fetch` function, you may also need to supply matching `Request` and `Response` constructors. If you omit them, the global constructors will be used. If your custom `fetch` is incompatible with the globals, pass `null` to disable them.

**Note:** Setting `Request` and `Response` to `null` will make it impossible for the fetch adapter to capture upload and download progress.
:::

### Arguments passed to a custom fetch

When a `Request` constructor is available, axios calls your `fetch` with the fully resolved `Request` as the first argument and a filtered copy of `fetchOptions` as the second. The second argument keeps your own custom fields, but omits the fields axios manages through the `Request`: `method`, `headers`, `body`, `signal`, `duplex`, and `credentials`. Read those values from the `Request`:

```js
const instance = axios.create({
  adapter: 'fetch',
  fetchOptions: { cache: 'no-store', tag: 'reports' },
  env: {
    fetch: (request, options) => {
      console.log(request.method, request.headers.get('content-type'));
      console.log(options.cache, options.tag); // 'no-store' 'reports'
      return fetch(request, options);
    },
  },
});
```

When `Request` is disabled (`Request: null`), axios calls `fetch(url, options)` with the complete resolved options instead.

### Custom `Response` constructors

axios wraps the response body in a tracked `ReadableStream<Uint8Array>` and passes it to `env.Response` when the runtime supports response streams, the response has a body, and any of the following apply:

- `maxContentLength` is enabled (a number greater than `-1`), even without a progress callback;
- `onDownloadProgress` is set;
- `responseType` is `'stream'` or `'response'` and the request uses a `signal`, `cancelToken`, or `timeout`.

A custom `Response` constructor must accept that stream and forward it unchanged; otherwise size limits, progress, and cancellation tracking cannot work. The TypeScript signature of `env.Response` keeps its legacy body type for compatibility, so a constructor that type-checks is not guaranteed to support stream bodies at runtime.

```js
class CustomResponse extends Response {
  constructor(body, init) {
    // `body` may be a tracked ReadableStream: pass it through as-is
    super(body, init);
  }
}

const instance = axios.create({
  adapter: 'fetch',
  maxContentLength: 10 * 1024 * 1024,
  onDownloadProgress: (e) => console.log(e.loaded),
  env: { fetch: customFetch, Response: CustomResponse },
});
```

### Basic example

```js
import customFetchFunction from 'customFetchModule';

const instance = axios.create({
  adapter: 'fetch',
  onDownloadProgress(e) {
    console.log('downloadProgress', e);
  },
  env: {
    fetch: customFetchFunction,
    Request: null, // null -> disable the constructor
    Response: null,
  },
});
```

### Using with Tauri

[Tauri](https://tauri.app/plugin/http-client/) provides a platform `fetch` function that bypasses browser CORS restrictions for requests made from the native layer. The example below shows a minimal setup for using axios inside a Tauri app with that custom fetch.

```js
import { fetch } from '@tauri-apps/plugin-http';
import axios from 'axios';

const instance = axios.create({
  adapter: 'fetch',
  onDownloadProgress(e) {
    console.log('downloadProgress', e);
  },
  env: {
    fetch,
  },
});

const { data } = await instance.get('https://google.com');
```

### Using with SvelteKit

[SvelteKit](https://svelte.dev/docs/kit/web-standards#Fetch-APIs) provides a custom `fetch` implementation for server-side `load` functions that handles cookie forwarding and relative URLs. Because its `fetch` is incompatible with the standard `URL` API, axios must be configured to use it explicitly, and the global `Request` and `Response` constructors must be disabled.

```js
export async function load({ fetch }) {
  const { data: post } = await axios.get('https://jsonplaceholder.typicode.com/posts/1', {
    adapter: 'fetch',
    env: {
      fetch,
      Request: null,
      Response: null,
    },
  });

  return { post };
}
```
