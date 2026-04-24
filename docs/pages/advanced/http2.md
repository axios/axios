# HTTP2 <Badge type="warning" text="Experimental" /> <Badge type="tip" text="v1.13.0+" />

Experimental HTTP/2 support was added to the `http` adapter in version `1.13.0`. It is available in Node.js environments only.

## Basic usage

Use the `httpVersion` option to select the protocol version for a request. Setting it to `2` enables HTTP/2.

```js
const { data, headers, status } = await axios.post(
  "https://httpbin.org/post",
  form,
  {
    httpVersion: 2,
  },
);
```

## `http2Options`

Additional native options for the internal `session.request()` call can be passed via the `http2Options` config object. This also includes the custom `sessionTimeout` parameter, which controls how long (in milliseconds) an idle HTTP/2 session is kept alive before being closed. It defaults to `1000ms`.

```js
{
  httpVersion: 2,
  http2Options: {
    rejectUnauthorized: false, // accept self-signed certificates (dev only)
    sessionTimeout: 5000,      // keep idle session alive for 5 seconds
  },
}
```

::: warning
HTTP/2 support is currently experimental. The API may change in future minor or patch releases.
:::

## Full example

The example below sends a `multipart/form-data` POST request over HTTP/2 and tracks both upload and download progress.

```js
const form = new FormData();
form.append("foo", "123");

const { data, headers, status } = await axios.post(
  "https://httpbin.org/post",
  form,
  {
    httpVersion: 2,
    http2Options: {
      // rejectUnauthorized: false,
      // sessionTimeout: 1000
    },
    onUploadProgress(e) {
      console.log("upload progress", e);
    },
    onDownloadProgress(e) {
      console.log("download progress", e);
    },
    responseType: "arraybuffer",
  },
);
```

## Config reference

| Option | Type | Default | Description |
|---|---|---|---|
| `httpVersion` | `number` | `1` | HTTP protocol version to use. Set to `2` to enable HTTP/2. |
| `http2Options.sessionTimeout` | `number` | `1000` | Time in milliseconds before an idle HTTP/2 session is closed. |

All other native `session.request()` options supported by Node.js's built-in `http2` module can also be passed inside `http2Options`.
