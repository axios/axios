# Response schema

Below is the standard axios response schema that will be returned from an HTTP request. The response schema is the same for both the browser and node.js environments.

### `data`

The response data from the server. When using `transformResponse`, this will be the result of the last transform.

### `status`

The HTTP status code from the server response.

### `statusText`

The HTTP status message from the server response.

### `headers`

The headers that the server responded with. All header names are lower cased.

### `config`

The config that was provided to `axios` for the request.

### `request`

The request that generated this response. It is the last `ClientRequest` instance in node.js (in redirects) and an `XMLHttpRequest` instance in the browser.

```js
{
  data: {},
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
  request: {}
}
```
