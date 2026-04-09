# Headers <Badge type="tip" text="New" />

Axios exposes its own AxiosHeaders class to manipulate headers using a Map-like API that guarantees case-insensitive keys. This class is used internally by Axios to manage headers, but it's also exposed to the user for convenience. Although HTTP headers are case-insensitive, Axios will retain the case of the original header for stylistic reasons and for a workaround when servers mistakenly consider the header's case. The old method of directly manipulating the headers object is still available, but deprecated and not recommended for future usage.

## Working with headers

The AxiosHeaders object instance can contain different types of internal values that control the setting and merging logic. The final headers object is obtained by Axios by calling the toJSON method. The AxiosHeaders object is also iterable, so you can use it in loops or convert it to an array or object.

The header values can be one of the following types:

- `string` - normal string value that will be sent to the server
- `null` - skip header when converting to JSON
- `false` - skip header when converting to JSON, additionally indicates that set method must be called with rewrite option set to true to overwrite this value (Axios uses this internally to allow users to opt out of installing certain headers like User-Agent or Content-Type)
- `undefined` - value is not set

::: warning
The header value is considered set if it is not undefined.
:::

The headers object is always initialized inside interceptors and transformers as seen in the following example:

```js
axios.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  request.headers.set("My-header", "value");

  request.headers.set({
    "My-set-header1": "my-set-value1",
    "My-set-header2": "my-set-value2",
  });

  // Disable subsequent setting of this header by Axios
  request.headers.set("User-Agent", false);

  request.headers.setContentType("text/plain");

  // Direct access like this is deprecated
  request.headers["My-set-header2"] = "newValue";

  return request;
});
```

You can iterate over an AxiosHeaders using any iterable method, like for-of loop, forEach, or spread operator:

```js
const headers = new AxiosHeaders({
  foo: '1',
  bar: '2',
  baz: '3',
});

for (const [header, value] of headers) {
  console.log(header, value);
}

// foo 1
// bar 2
// baz 3
```

## Setting headers on a request

The most common place to set headers is the `headers` option in your request config or instance config:

```js
// On a single request
await axios.get('/api/data', {
  headers: {
    'Accept-Language': 'en-US',
    'X-Request-ID': 'abc123',
  },
});

// On an instance (applied to every request)
const api = axios.create({
  headers: {
    'X-App-Version': '2.0.0',
  },
});
```

## Preserving a specific header case

Axios header names are case-insensitive, but `AxiosHeaders` keeps the case of the first matching key it sees. If you need a specific case for a server with non-standard case-sensitive behavior, define a case preset in defaults and then set values as usual.

```js
const api = axios.create();

api.defaults.headers.common = {
  'content-type': undefined,
  accept: undefined,
};

await api.put(url, data, {
  headers: {
    'Content-Type': 'application/octet-stream',
    Accept: 'application/json',
  },
});
```

You can also do this with `AxiosHeaders` directly when composing headers:

```js
import axios, { AxiosHeaders } from 'axios';

const headers = AxiosHeaders.concat(
  { 'content-type': undefined },
  { 'Content-Type': 'application/octet-stream' }
);

await axios.put(url, data, { headers });
```

## Setting headers in an interceptor

Interceptors are the right place to attach dynamic headers like auth tokens, because the token may not be available when the instance is first created:

```js
api.interceptors.request.use((config) => {
  const token = getAuthToken(); // read at request time
  config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});
```

## Reading response headers

Response headers are available on `response.headers` as an `AxiosHeaders` instance. All header names are lower-cased:

```js
const response = await axios.get('/api/data');

console.log(response.headers['content-type']);
// application/json; charset=utf-8

console.log(response.headers.get('x-request-id'));
// abc123
```

## Removing a default header

To opt out of a header that axios sets by default (such as `Content-Type` or `User-Agent`), set its value to `false`:

```js
await axios.post('/api/data', payload, {
  headers: {
    'Content-Type': false, // let the browser set it automatically (e.g. for FormData)
  },
});
```

For more detail on the full `AxiosHeaders` method API, see the [Header methods](/pages/advanced/header-methods) page.
