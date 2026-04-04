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
