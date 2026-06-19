# Request config

The request config is used to configure the request. There is a wide range of options available, but the only required option is `url`. If the configuration object does not contain a `method` field, the default method is `GET`.

::: warning Security: decompression-bomb protection is opt-in
By default `maxContentLength` and `maxBodyLength` are `-1` (unlimited). A malicious or compromised server can return a tiny gzip/deflate/brotli/zstd body that expands to gigabytes and exhaust the Node.js process.

If you call servers you do not fully trust, **set a cap**:

```js
axios.defaults.maxContentLength = 10 * 1024 * 1024; // 10 MB
axios.defaults.maxBodyLength = 10 * 1024 * 1024;
```

See the [security guide](/pages/misc/security) for details.
:::

### `url`

The `url` is the URL to which the request is made. It can be a string or an instance of `URL`.

### `method`

The `method` is the HTTP method to use for the request. The default method is `GET`.

### `baseURL`

The `baseURL` is the base URL to be prepended to the `url` unless the `url` is an absolute URL. This is useful for making requests to the same domain without having to repeat the domain name and any api or version prefix.

### `allowAbsoluteUrls`

The `allowAbsoluteUrls` determines whether or not absolute URLs will override a configured `baseUrl`. When set to true (default), absolute values for `url` will override `baseUrl`. When set to false, absolute values for `url` will always be prepended by `baseUrl`.

### `transformRequest`

The `transformRequest` function allows you to modify the request data before it is sent to the server. This function is called with the request data as its only argument. This is only applicable for request methods `PUT`, `POST`, `PATCH` and `DELETE`. The last function in the array must return a string or an instance of Buffer, ArrayBuffer, FormData or Stream.

### `transformResponse`

The `transformResponse` function allows you to modify the response data before it is passed to the `then` or `catch` functions. This function is called with the response data as its only argument.

### `parseReviver`

The `parseReviver` function allows you to provide a custom "reviver" function directly to the native `JSON.parse()` call used by the default `transformResponse`.

This is particularly useful for performing high-performance type hydration (e.g., converting ISO strings to `Temporal` or `Date` objects) or preventing precision loss during parsing.

In modern environments (ES2023+), the reviver function receives a third `context` argument. This provides access to the raw JSON `source`, allowing for precise conversion of large integers (BigInt) that would otherwise lose precision if parsed as standard JavaScript numbers.

> Note: `Temporal` is not yet available in all environments. Consider using a polyfill if needed.

```js
const client = axios.create({
  parseReviver: (key, value, context) => {
    // Example: Precision-safe BigInt parsing
    if (typeof value === 'number' && context?.source) {
      const isInteger = Number.isInteger(value);
      const isUnsafe = !Number.isSafeInteger(value);
      const isValidIntegerString = /^-?\d+$/.test(context.source);

      if (isInteger && isUnsafe && isValidIntegerString) {
        try {
          return BigInt(context.source);
        } catch {
          // Fallback: return original value if parsing fails
        }
      }
    }

    // Example: Hydrating dates into Temporal objects
    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      typeof Temporal !== 'undefined' &&
      Temporal?.PlainDate
    ) {
      return Temporal.PlainDate.from(value);
    }

    return value;
  },
});
```

### `headers`

The `headers` are the HTTP headers to be sent with the request. The `Content-Type` header is set to `application/json` by default.

### `params`

The `params` are the URL parameters to be sent with the request. This must be a plain object or a URLSearchParams object. If the `url` contains query parameters, they will be merged with the `params` object.

### `paramsSerializer`

The `paramsSerializer` function allows you to serialize the `params` object before it is sent to the server. There are a few options available for this function, so please refer to the full request config example at the end of this page.

#### Strict RFC 3986 percent-encoding

By default, axios decodes `%3A`, `%24`, `%2C` and `%20` back to `:`, `$`, `,` and `+` for readability (the `+` follows the `application/x-www-form-urlencoded` convention for spaces in query strings). These characters are valid in a query component under [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986#section-3.4), so the default output is correct. However, some backends require strict percent-encoding and reject the readable form.

Use the `encode` option to override the default encoder:

```js
// Per-request: emit strict RFC 3986 percent-encoding for query values
axios.get('/foo', {
  params: { filter: JSON.stringify({ startedAt: '2026-01-23' }) },
  paramsSerializer: { encode: encodeURIComponent }
});

// Or set it on the instance defaults
const client = axios.create({
  paramsSerializer: { encode: encodeURIComponent }
});
```

### `data`

The `data` is the data to be sent as the request body. This can be a string, a plain object, a Buffer, ArrayBuffer, FormData, Stream, or URLSearchParams. Only applicable for request methods `PUT`, `POST`, `DELETE` , and `PATCH`. When no `transformRequest` is set, must be of one of the following types:

- string, plain object, ArrayBuffer, ArrayBufferView, URLSearchParams
- Browser only: FormData, File, Blob
- React Native: FormData
- Node only: Stream, Buffer, FormData (form-data package)

For browser, web worker, and React Native `FormData`, do not manually set `Content-Type`; the runtime adds the multipart boundary.

For Node.js `FormData` objects that provide a `getHeaders()` method, axios copies all returned headers by default for v1 compatibility. If the `FormData` object is custom or not fully trusted, set `formDataHeaderPolicy: 'content-only'` to copy only `Content-Type` and `Content-Length`, and set any other request headers explicitly via the request `headers` config.

### `formDataHeaderPolicy` <Badge type="warning" text="Node.js only" />

Controls how axios copies headers returned by Node.js `FormData#getHeaders()`. The default is `'legacy'`, which copies all returned headers to preserve existing v1 behavior. Set `'content-only'` to copy only `Content-Type` and `Content-Length` from `getHeaders()`.

### `timeout`

The `timeout` is the number of milliseconds before the request times out. If the request takes longer than `timeout`, the request will be aborted.

### `withCredentials`

The `withCredentials` property indicates whether or not cross-site Access-Control requests should be made using credentials such as cookies, authorization headers, or TLS client certificates. Setting withCredentials has no effect on same-site requests.

### `adapter`

`adapter` allows custom handling of requests which makes testing easier. Return a promise and supply a valid response see [adapters](/pages/advanced/adapters) for more information. We also provide a number of built-in adapters. The default adapter is `http` for node and `xhr` for browsers. The full list of built-in adapters as follows:

- fetch
- http
- xhr

You may also pass an array of adapters to be used, axios will use the first adapter that is supported by the environment.

### `auth`

`auth` indicates that HTTP Basic auth should be used, and supplies credentials. This will set an `Authorization` header, overwriting any existing `Authorization` custom headers you have set using `headers`. If `auth` is omitted, the Node.js HTTP and fetch adapters can derive Basic auth credentials from the request URL, for example `https://user:pass@example.com`; percent-encoded URL credentials are decoded, and `auth` always takes precedence over URL-embedded credentials. In the Node.js HTTP adapter, Basic auth is preserved on same-origin redirects and stripped on cross-origin redirects. Please note that only HTTP Basic auth is configurable through this parameter. For Bearer tokens and such, use `Authorization` custom headers instead.

### `responseType`

The `responseType` indicates the type of data that the server will respond with. This can be one of the following:

- arraybuffer
- document
- json
- text
- stream
- blob (browser only)
- formdata (fetch adapter only)

### `responseEncoding` <Badge type="warning" text="Node.js only" />

The `responseEncoding` indicates encoding to use for decoding responses. The following options are supported:

- ascii
- ASCII
- ansi
- ANSI
- binary
- BINARY
- base64
- BASE64
- base64url
- BASE64URL
- hex
- HEX
- latin1
- LATIN1
- ucs-2
- UCS-2
- ucs2
- UCS2
- utf-8
- UTF-8
- utf8
- UTF8
- utf16le
- UTF16LE

::: tip
Note: Ignored for `responseType` of `stream` or client-side requests
:::

### `xsrfCookieName`

The `xsrfCookieName` is the name of the cookie to use as a value for `XSRF` token.

### `xsrfHeaderName`

The `xsrfHeaderName` is the name of the header to use as a value for `XSRF` token.

### `withXSRFToken`

`withXSRFToken` controls whether axios reads the XSRF cookie and sets the XSRF header on browser requests. It accepts:

- `undefined` _(default)_ — set the XSRF header only for same-origin requests.
- `true` — always set the XSRF header, including for cross-origin requests.
- `false` — never set the XSRF header.
- `(config: InternalAxiosRequestConfig) => boolean | undefined` — a callback that decides per-request, receiving the internal config object.

```ts
withXSRFToken: boolean | undefined | ((config: InternalAxiosRequestConfig) => boolean | undefined);
```

::: warning Cross-origin XSRF and `withCredentials`
`withCredentials` controls whether cross-site requests include credentials (cookies, HTTP auth). `withXSRFToken` controls whether axios sets the XSRF header. For cross-origin requests, set `withXSRFToken: true` to force the header; additionally set `withCredentials: true` only when the request also needs credentials/cookies.

```js
axios.get('/user', { withCredentials: true, withXSRFToken: true });
```
:::

### `onUploadProgress`

The `onUploadProgress` function allows you to listen to the progress of an upload.

### `onDownloadProgress`

The `onDownloadProgress` function allows you to listen to the progress of a download.

### `maxContentLength` <Badge type="warning" text="Node.js HTTP/fetch adapter" />

The `maxContentLength` property defines the maximum response size in bytes. The Node.js HTTP adapter enforces it for buffered and streamed responses. The fetch adapter enforces it when the response length is declared, the response stream can be tracked, or the response size can otherwise be determined.

> ⚠️ **Security:** defaults to `-1` (unlimited). Unbounded responses combined with gzip/deflate/brotli/zstd decompression allow decompression-bomb DoS.
> Set an explicit limit when requesting servers you do not fully trust.

### `maxBodyLength` <Badge type="warning" text="Node.js HTTP/fetch adapter" />

The `maxBodyLength` property defines the maximum request body size in bytes. The Node.js HTTP adapter enforces it, and the fetch adapter enforces it when the request body length can be determined.

### `redact`

The `redact` property is an optional array of config key names to mask when an `AxiosError` is serialized with `toJSON()`. Matching is case-insensitive and recursive across the serialized request config. Matching values are replaced with `[REDACTED ****]`.

`redact` only affects error serialization. It does not change request data, headers, or the original config object.

```js
axios.get('/user/12345', {
  headers: { Authorization: 'Bearer token' },
  auth: { username: 'me', password: 'secret' },
  redact: ['authorization', 'password']
}).catch((error) => {
  console.log(error.toJSON().config);
});
```

### `validateStatus`

The `validateStatus` function allows you to override the default status code validation. By default, axios will reject the promise if the status code is not in the range of 200-299. You can override this behavior by providing a custom `validateStatus` function. The function should return `true` if the status code is within the range you want to accept.

By default, explicit `validateStatus: undefined` keeps legacy behavior and resolves every response status because `transitional.validateStatusUndefinedResolves` defaults to `true`. Set `transitional.validateStatusUndefinedResolves` to `false` when you want an explicit `validateStatus: undefined` to behave as if `validateStatus` was omitted, so axios uses the configured/default validator and rejects non-2xx responses by default.

`validateStatus: null` still accepts every response status. If you disable the transitional behavior and intentionally want all statuses to resolve, use `validateStatus: null` or a validator that returns `true`.

```js
axios.get('/user/12345', {
  validateStatus: undefined,
  transitional: {
    validateStatusUndefinedResolves: false
  }
});
```

### `maxRedirects` <Badge type="warning" text="Node.js only" />

The `maxRedirects` property defines the maximum number of redirects to follow. If set to 0, no redirects will be followed.

### `sensitiveHeaders` <Badge type="warning" text="Node.js only" />

The `sensitiveHeaders` property is an optional array of custom secret-bearing header names, such as `X-API-Key`, that the Node.js HTTP adapter removes when following a redirect to a different origin. Matching is case-insensitive. Same-origin redirects keep these headers. If `maxRedirects` is `0`, axios does not follow redirects and `sensitiveHeaders` is not used.

```js
axios.get('https://api.example.com/users', {
  headers: { 'X-API-Key': 'secret' },
  sensitiveHeaders: ['X-API-Key']
});
```

### `beforeRedirect`

The `beforeRedirect` function allows you to modify the request before it is redirected. Use this to adjust the request options upon redirecting, to inspect the latest response headers, or to cancel the request by throwing an error. If maxRedirects is set to 0, `beforeRedirect` is not used.

```js
beforeRedirect: (options, { headers }) => {
  if (
    options.hostname === "example.com" &&
    options.protocol === "https:"
  ) {
    options.auth = "user:password";
  }
}
```

::: warning Security: re-injecting credentials on redirect
The `beforeRedirect` hook runs **after** sensitive headers are stripped during redirects. The `follow-redirects` library removes credentials on protocol downgrade (HTTPS → HTTP) for security. Since `beforeRedirect` runs after this, re-injecting credentials without checking the destination protocol can expose sensitive data. Only re-add credentials for trusted HTTPS destinations, and avoid re-adding them on downgraded redirects.
:::

### `socketPath` <Badge type="warning" text="Node.js only" />

The `socketPath` property defines a UNIX socket to use instead of a TCP connection. e.g. `/var/run/docker.sock` to send requests to the docker daemon. Only `socketPath` or `proxy` can be specified. If both are specified, `socketPath` is used.

:::warning Security
When `socketPath` is set, the hostname and port of the request URL are ignored and axios communicates directly with the specified Unix domain socket. If any part of the request config is derived from user input (for example, when forwarding or merging request options in a proxy/webhook handler), an attacker can inject `socketPath` to redirect traffic to privileged local sockets such as `/var/run/docker.sock`, `/run/containerd/containerd.sock`, or `/run/systemd/private` — bypassing hostname-based SSRF protections entirely (CWE-918). Strip or allowlist config keys from untrusted input, and/or restrict accepted socket paths with `allowedSocketPaths` (see below).
:::

### `allowedSocketPaths` <Badge type="warning" text="Node.js only" />

Restricts which socket paths may be used via `socketPath`. Accepts a string or an array of strings. When set, axios resolves the `socketPath` and compares it against each entry (also resolved); the request is rejected with `AxiosError` code `ERR_BAD_OPTION_VALUE` when there is no match. When unset (default), `socketPath` behaves as before.

```js
const client = axios.create({
  allowedSocketPaths: ['/var/run/docker.sock'],
});

// allowed
await client.get('http://localhost/v1.45/info', { socketPath: '/var/run/docker.sock' });

// rejected — not in allowlist
await client.get('http://localhost/pods', { socketPath: '/var/run/kubelet.sock' });
```

An empty array (`allowedSocketPaths: []`) blocks all socket paths.

### `transport`

The `transport` property defines the transport to use for the request. This is useful for making requests over a different protocol, such as `http2`.

### `httpAgent` and `httpsAgent`

The `httpAgent` and `httpsAgent` define a custom agent to be used when performing http and https requests, respectively, in node.js. This allows options to be added like `keepAlive` that are not enabled by default.

### `proxy` <Badge type="warning" text="Node.js only" />

The `proxy` defines the hostname, port, and protocol of a proxy server you would like to use. You can also define your proxy using the conventional `http_proxy` and `https_proxy` environment variables.

If you are using environment variables for your proxy configuration, you can also define a `no_proxy` environment variable as a comma-separated list of domains that should not be proxied.

Use `false` to disable proxies, ignoring environment variables. `auth` indicates that HTTP Basic auth should be used to connect to the proxy, and supplies credentials. This will set an `Proxy-Authorization` header, overwriting any existing `Proxy-Authorization` custom headers you have set using `headers`. If the proxy server uses HTTPS, then you must set the protocol to `https`.

A user-supplied `Host` header in `headers` is preserved when forwarding through a proxy (case-insensitive match on `host` / `Host` / `HOST`). This lets you target a virtual host that differs from the request URL — for example, hitting `127.0.0.1:4000` while having the proxy treat the request as `example.com`. If no `Host` header is supplied, axios defaults it to the request URL's `hostname:port` as before.

For `https://` targets, axios establishes a CONNECT tunnel through the proxy and performs TLS end-to-end with the origin. `Proxy-Authorization` is sent only on the CONNECT request, never on the wrapped TLS request. `httpsAgent` TLS options such as `ca`, `cert`, `key`, and `rejectUnauthorized` are forwarded to the generated tunneling agent so they still apply to the origin TLS connection. If you supply an `HttpsProxyAgent`, axios leaves tunneling to that agent.

```js
proxy: {
  protocol: "https",
  host: "127.0.0.1",
  hostname: "localhost", // Takes precedence over "host" if both are defined
  port: 9000,
  auth: {
    username: "mikeymike",
    password: "rapunz3l"
  }
},
```

### `cancelToken`

The `cancelToken` property allows you to create a cancel token that can be used to cancel the request. For more information, see the [cancellation](/pages/advanced/cancellation) documentation.

### `signal`

The `signal` property allows you to pass an instance of `AbortSignal` to the request. This allows you to cancel the request using the `AbortController` API.

### `decompress` <Badge type="warning" text="Node.js only" />

The `decompress` property indicates whether or not to automatically decompress the response data. The default value is `true`. The Node.js HTTP adapter supports gzip, deflate, brotli, and zstd when the current Node.js runtime provides the corresponding zlib decompressor.

### `insecureHTTPParser`

Indicates where to use an insecure HTTP parser that accepts invalid HTTP headers. This may allow interoperability with non-conformant HTTP implementations. Using the insecure parser should be avoided.

Please note that the `insecureHTTPParser` option is only available in Node.js 12.10.0 and later. Please read the [Node.js documentation](https://nodejs.org/en/blog/vulnerability/february-2020-security-releases/#strict-http-header-parsing-none) for more information. See the full set of options [here](https://nodejs.org/dist/latest-v12.x/docs/api/http.html#http_http_request_url_options_callback)

### `transitional`

The `transitional` property allows you to enable or disable certain transitional features. The following options are available:

- `silentJSONParsing`: If set to `true` _(default)_, axios silently ignores JSON parsing errors and sets `response.data` to `null` when parsing fails. Set to `false` to throw `SyntaxError` instead.

  ::: tip Important
  This option only takes effect when `responseType` is **explicitly** set to `'json'`. When `responseType` is omitted, axios uses `forcedJSONParsing` to attempt JSON parsing and silently returns the raw string on failure regardless of this setting. To make invalid JSON throw, set both:

  ```js
  { responseType: 'json', transitional: { silentJSONParsing: false } }
  ```
  :::

- `forcedJSONParsing`: Forces axios to parse the response string as JSON even if `responseType` is not `'json'`.
- `clarifyTimeoutError`: Clarifies the error message when a request times out. This is useful when you are debugging timeout issues.
- `validateStatusUndefinedResolves`: If set to `true` _(default)_, explicit `validateStatus: undefined` resolves every response status for backward compatibility. Set to `false` to treat explicit `undefined` as if `validateStatus` was omitted, so axios uses the configured/default validator. Use `validateStatus: null` or a validator that returns `true` when you intentionally want all statuses to resolve.
- `advertiseZstdAcceptEncoding`: When set to `true`, axios adds `zstd` to the default `Accept-Encoding` request header when the current Node.js runtime supports zstd decompression. zstd responses are still decompressed automatically when supported and `decompress` is `true`.
- `legacyInterceptorReqResOrdering`: When set to true we will use the legacy interceptor request/response ordering.

### `env`

The `env` property allows you to set some configuration options. For example the FormData class which is used to automatically serialize the payload into a FormData object.

- FormData: window?.FormData || global?.FormData

### `formSerializer`

The `formSerializer` option allows you to configure how plain objects are serialized to `multipart/form-data` when used as request `data`. Available options:

- `visitor` — custom visitor function called recursively for each value
- `dots` — use dot notation instead of bracket notation
- `metaTokens` — preserve special key endings such as `{}`
- `indexes` — control bracket format for array keys (`null` / `false` / `true`)
- `maxDepth` _(default: `100`)_ — maximum nesting depth before throwing `AxiosError` with code `ERR_FORM_DATA_DEPTH_EXCEEDED`. Set to `Infinity` to disable.

See the [multipart/form-data](/pages/advanced/multipart-form-data-format) page for full details, and the full request config example at the end of this page.

### `maxRate` <Badge type="warning" text="Node.js only" />

The `maxRate` property defines the maximum **bandwidth** (in bytes per second) for upload and/or download. It accepts either a single number (applied to both directions) or a two-element array `[uploadRate, downloadRate]` where each element is a byte-per-second limit. For example, `100 * 1024` means 100 KB/s. See [Rate limiting](/pages/advanced/rate-limiting) for examples.

## Full request config example

```js
{
  url: "/posts",
  method: "get",
  baseURL: "https://jsonplaceholder.typicode.com",
  allowAbsoluteUrls: true,
  transformRequest: [function (data, headers) {
    return data;
  }],
  transformResponse: [function (data) {
    return data;
  }],
  headers: {"X-Requested-With": "XMLHttpRequest"},
  params: {
    postId: 5
  },
  paramsSerializer: {
    // Custom encoder function which sends key/value pairs in an iterative fashion.
    encode?: (param: string): string => { /* Do custom operations here and return transformed string */ },

    // Custom serializer function for the entire parameter. Allows user to mimic pre 1.x behaviour.
    serialize?: (params: Record<string, any>, options?: ParamsSerializerOptions ),

    // Configuration for formatting array indexes in the params.
    // Three available options:
      // (1) indexes: null (leads to no brackets)
      // (2) (default) indexes: false (leads to empty brackets)
      // (3) indexes: true (leads to brackets with indexes).
    indexes: false,

    // Maximum object nesting depth when serializing params. Throws AxiosError
    // (ERR_FORM_DATA_DEPTH_EXCEEDED) if exceeded. Default: 100. Set to Infinity to disable.
    maxDepth: 100

  },
  data: {
    firstName: "Fred"
  },

  // `data` is request-specific: axios does not inherit or deep-merge it from defaults.
  // To add shared body fields, use a request interceptor or transformRequest.
  formDataHeaderPolicy: "legacy",
  // Syntax alternative to send data into the body method post only the value is sent, not the key
  data: "Country=Brasil&City=Belo Horizonte",
  timeout: 1000,
  withCredentials: false,
  adapter: function (config) {
    // Do whatever you want
  },
  adapter: "xhr",
  auth: {
    username: "janedoe",
    password: "s00pers3cret"
  },
  responseType: "json",
  responseEncoding: "utf8",
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  withXSRFToken: boolean | undefined | ((config: InternalAxiosRequestConfig) => boolean | undefined),
  onUploadProgress: function ({loaded, total, progress, bytes, estimated, rate, upload = true}) {
    // Do whatever you want with the Axios progress event
  },
  onDownloadProgress: function ({loaded, total, progress, bytes, estimated, rate, download = true}) {
    // Do whatever you want with the Axios progress event
  },
  maxContentLength: 2000,
  maxBodyLength: 2000,
  redact: ['authorization', 'password'],
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  },
  maxRedirects: 21,
  sensitiveHeaders: ['X-API-Key'],
  beforeRedirect: (options, { headers }) => {
    if (options.hostname === "typicode.com") {
      options.auth = "user:password";
    }
  },
  socketPath: null,
  allowedSocketPaths: null,
  transport: undefined,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  proxy: {
    protocol: "https",
    host: "127.0.0.1",
    // hostname: "127.0.0.1" // Takes precedence over "host" if both are defined
    port: 9000,
    auth: {
      username: "mikeymike",
      password: "rapunz3l"
    }
  },
  cancelToken: new CancelToken(function (cancel) {
    cancel("Operation has been canceled.");
  }),
  signal: new AbortController().signal,
  decompress: true,
  insecureHTTPParser: undefined,
  transitional: {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false,
    validateStatusUndefinedResolves: true,
    advertiseZstdAcceptEncoding: false,
    legacyInterceptorReqResOrdering: true,
  },
  env: {
    FormData: window?.FormData || global?.FormData
  },
  formSerializer: {
      // Custom visitor function to serialize form values
      visitor: (value, key, path, helpers) => {};

      // Use dots instead of brackets format
      dots: boolean;

      // Keep special endings like {} in parameter key
      metaTokens: boolean;

      // Use array indexes format:
        // null - no brackets
        // false - empty brackets
        // true - brackets with indexes
      indexes: boolean;

      // Maximum object nesting depth. Throws AxiosError (ERR_FORM_DATA_DEPTH_EXCEEDED)
      // if exceeded. Default: 100. Set to Infinity to disable.
      maxDepth: 100;
  },
  maxRate: [
    100 * 1024, // 100KB/s upload limit,
    100 * 1024  // 100KB/s download limit
  ]
}
```
