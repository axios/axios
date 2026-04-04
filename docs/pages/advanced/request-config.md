# Request config

The request config is used to configure the request. There is a wide range of options available, but the only required option is `url`. If the configuration object does not contain a `method` field, the default method is `GET`.

### `url`

The `url` is the URL to which the request is made. It can be a string or an instance of `URL`.

### `method`

The `method` is the HTTP method to use for the request. The default method is `GET`.

### `baseURL`

The `baseURL` is the base URL to be prepended to the `url` unless the `url` is an absolute URL. This is useful for making requests to the same domain without having to repeat the domain name and any api or version prefix.

### `transformRequest`

The `transformRequest` function allows you to modify the request data before it is sent to the server. This function is called with the request data as its only argument. This is only applicable for request methods `PUT`, `POST`, `PATCH` and `DELETE`. The last function in the array must return a string or an instance of Buffer, ArrayBuffer FormData or Stream.

### `transformResponse`

The `transformResponse` function allows you to modify the response data before it is passed to the `then` or `catch` functions. This function is called with the response data as its only argument.

### `headers`

The `headers` are the HTTP headers to be sent with the request. The `Content-Type` header is set to `application/json` by default.

### `params`

The `params` are the URL parameters to be sent with the request. This must be a plain object or a URLSearchParams object. If the `url` contains query parameters, they will be merged with the `params` object.

### `paramsSerializer`

The `paramsSerializer` function allows you to serialize the `params` object before it is sent to the server. There are a few options available for this function, so please refer to the full request config example at the end of this page.

### `data`

The `data` is the data to be sent as the request body. This can be a string, a plain object, a Buffer, ArrayBuffer, FormData, Stream, or URLSearchParams. Only applicable for request methods `PUT`, `POST`, `DELETE` , and `PATCH`. When no `transformRequest` is set, must be of one of the following types:

- string, plain object, ArrayBuffer, ArrayBufferView, URLSearchParams
- Browser only: FormData, File, Blob
- Node only: Stream, Buffer, FormData (form-data package)

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

`auth` indicates that HTTP Basic auth should be used, and supplies credentials. This will set an `Authorization` header, overwriting any existing `Authorization` custom headers you have set using `headers`. Please note that only HTTP Basic auth is configurable through this parameter. For Bearer tokens and such, use `Authorization` custom headers instead.

### `responseType`

The `responseType` indicates the type of data that the server will respond with. This can be one of the following:

- arraybuffer
- document
- json
- text
- stream
- blob (browser only)

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

The `withXSRFToken` property indicates whether or not to send the `XSRF` token with the request. This is only applicable for client-side requests. The default value is undefined.

### `onUploadProgress`

The `onUploadProgress` function allows you to listen to the progress of an upload.

### `onDownloadProgress`

The `onDownloadProgress` function allows you to listen to the progress of a download.

### `maxContentLength` <Badge type="warning" text="Node.js only" />

The `maxContentLength` property defines the maximum number of bytes that the server will accept in the response.

### `maxBodyLength` <Badge type="warning" text="Node.js only" />

The `maxBodyLength` property defines the maximum number of bytes that the server will accept in the request.

### `validateStatus`

The `validateStatus` function allows you to override the default status code validation. By default, axios will reject the promise if the status code is not in the range of 200-299. You can override this behavior by providing a custom `validateStatus` function. The function should return `true` if the status code is within the range you want to accept.

### `maxRedirects` <Badge type="warning" text="Node.js only" />

The `maxRedirects` property defines the maximum number of redirects to follow. If set to 0, no redirects will be followed.

### `beforeRedirect`

The `beforeRedirect` function allows you to modify the request before it is redirected. Use this to adjust the request options upon redirecting, to inspect the latest response headers, or to cancel the request by throwing an error. If maxRedirects is set to 0, `beforeRedirect` is not used.

### `socketPath` <Badge type="warning" text="Node.js only" />

The `socketPath` property defines a UNIX socket to use instead of a TCP connection. e.g. `/var/run/docker.sock` to send requests to the docker daemon. Only `socketPath` or `proxy` can be specified. If both are specified, `socketPath` is used.

### `transport`

The `transport` property defines the transport to use for the request. This is useful for making requests over a different protocol, such as `http2`.

### `httpAgent` and `httpsAgent`

The `httpAgent` and `httpsAgent` define a custom agent to be used when performing http and https requests, respectively, in node.js. This allows options to be added like `keepAlive` that are not enabled by default.

### `proxy`

The `proxy` defines the hostname, port, and protocol of a proxy server you would like to use. You can also define your proxy using the conventional `http_proxy` and `https_proxy` environment variables.

If you are using environment variables for your proxy configuration, you can also define a `no_proxy` environment variable as a comma-separated list of domains that should not be proxied.

Use `false` to disable proxies, ignoring environment variables. `auth` indicates that HTTP Basic auth should be used to connect to the proxy, and supplies credentials. This will set an `Proxy-Authorization` header, overwriting any existing `Proxy-Authorization` custom headers you have set using `headers`. If the proxy server uses HTTPS, then you must set the protocol to `https`.

```js
proxy: {
  protocol: "https",
  host: "127.0.0.1",
  hostname: "localhost" // Takes precedence over "host" if both are defined
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

The `decompress` property indicates whether or not to automatically decompress the response data. The default value is `true`.

### `insecureHTTPParser`

Indicates where to use an insecure HTTP parser that accepts invalid HTTP headers. This may allow interoperability with non-conformant HTTP implementations. Using the insecure parser should be avoided.

Please note that the `insecureHTTPParser` option is only available in Node.js 12.10.0 and later. Please read the [Node.js documentation](https://nodejs.org/en/blog/vulnerability/february-2020-security-releases/#strict-http-header-parsing-none) for more information. See the full set of options [here](https://nodejs.org/dist/latest-v12.x/docs/api/http.html#http_http_request_url_options_callback)

### `transitional`

The `transitional` property allows you to enable or disable certain transitional features. The following options are available:

- `silentJSONParsing`: If set to `true`, axios will not log a warning when it encounters invalid JSON responses, setting the return value to null. This is useful when you are working with APIs that return invalid JSON.
- `forcedJSONParsing`: Forces axios to parse JSON responses as JSON, even if the response is not valid JSON. This is useful when you are working with APIs that return invalid JSON.
- `clarifyTimeoutError`: Clarifies the error message when a request times out. This is useful when you are debugging timeout issues.

### `env`

The `env` property allows you to set some configuration options. For example the FormData class which is used to automatically serialize the payload into a FormData object.

- FormData: window?.FormData || global?.FormData

### `formSerializer`

The `formSerializer` function allows you to serialize the `data` object before it is sent to the server. There are a few options available for this function, so please refer to the full request config example at the end of this page.

### `maxRate` <Badge type="warning" text="Node.js only" />

The `maxRate` property defines the maximum number of requests that can be made per second. This is useful for rate limiting requests. This is passed in the form of an array with the first element being upload rate and the second element being download rate.

## Full request config example

```js
{
  url: "/posts",
  method: "get",
  baseURL: "https://jsonplaceholder.typicode.com",
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
    indexes: false

  },
  data: {
    firstName: "Fred"
  },
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
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  },
  maxRedirects: 21,
  beforeRedirect: (options, { headers }) => {
    if (options.hostname === "typicode.com") {
      options.auth = "user:password";
    }
  },
  socketPath: null,
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
  },
  maxRate: [
    100 * 1024, // 100KB/s upload limit,
    100 * 1024  // 100KB/s download limit
  ]
}
```
