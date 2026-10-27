# Response schema

Every axios request resolves to a response object with the following shape. The schema is consistent across both browser and Node.js environments.

```js
{
  // The response data provided by the server.
  // When using `transformResponse`, this will be the result of the last transform.
  data: {},

  // The HTTP status code from the server response (e.g. 200, 404, 500).
  status: 200,

  // The HTTP status message matching the status code (e.g. "OK", "Not Found").
  statusText: "OK",

  // The response headers sent by the server.
  // Header names are lower-cased. You can access them using bracket or dot notation.
  headers: {},

  // The axios config that was used for this request, including baseURL,
  // headers, timeout, params, and any other options you provided.
  config: {},

  // The underlying request object.
  // In Node.js: the last `http.ClientRequest` instance (after any redirects).
  // In the browser: the `XMLHttpRequest` instance.
  request: {},

  // Approximate time in milliseconds that the adapter took to settle the request.
  // Set by axios for built-in and custom adapters; see "Response duration" below.
  duration: 42,
}
```

In TypeScript, `AxiosResponse<T, D, H, P>` types the response data (`T`), request data (`D`), response headers (`H`), and query params (`P`). The config retains both request-side types:

```ts
interface AxiosResponse<T = any, D = any, H = {}, P = any> {
  data: T;
  status: number;
  statusText: string;
  duration?: number;
  headers: (H & RawAxiosResponseHeaders) | AxiosResponseHeaders;
  config: InternalAxiosRequestConfig<D, P>;
  request?: any;
}
```

## Accessing response fields

In practice you will usually destructure just the parts you need:

```js
const { data, status, headers } = await axios.get("/api/users/1");

console.log(status);          // 200
console.log(headers["content-type"]); // "application/json; charset=utf-8"
console.log(data);            // { id: 1, name: "Jay", email: "jay@example.com" }
```

## Response duration

`response.duration` is the elapsed adapter time in milliseconds:

```js
const response = await axios.get('/users');

console.log(response.duration); // e.g. 128
```

Timing starts immediately before axios invokes the adapter, after request interceptors and `transformRequest` have run. It stops when the adapter settles, before `transformResponse` and response interceptors run. It therefore includes adapter work such as connection queuing and following redirects.

- For buffered responses, the value includes receiving the response body.
- For streamed responses (`responseType: "stream"` in the HTTP and fetch adapters), it measures only the time until the stream is available. Consuming the stream later, or the stream failing, does not update the value.
- It is not a DNS, TCP, TLS, or time-to-first-byte breakdown, and it is not server processing time.
- The value is approximate wall-clock time measured with `Date.now()`. Backward clock adjustments are clamped to `0`, but forward adjustments can inflate the value.

axios sets `duration` on every response produced by an adapter, overwriting any `duration` property a custom adapter already set. The property is optional in the TypeScript declarations so custom adapters and manually constructed responses do not need to provide it. Errors that have no response, such as network errors, timeouts, and cancellations, have no duration; see [Error handling](/pages/advanced/error-handling#response-duration-on-errors).

## Checking the status code

axios resolves the promise for any 2xx response and rejects for anything outside that range by default. You can customise this with the `validateStatus` config option:

```js
const response = await axios.get("/api/resource", {
  validateStatus: (status) => status < 500, // resolve for anything below 500
});
```

## Accessing response headers

All response header names are lower-cased, regardless of how the server sent them:

```js
const response = await axios.get("/api/resource");

// These are equivalent
const contentType = response.headers["content-type"];
const contentType2 = response.headers.get("content-type");
```
