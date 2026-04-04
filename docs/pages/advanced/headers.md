# Headers <Badge type="tip" text="New" />

Axios exposes it's own AxiosHeaders class to manipulate headers using a Map-like API that guarantees case-insensitive keys. This class is used internally by Axios to manage headers, but it's also exposed to the user for convenience. Although HTTP headers are case-insensitive, Axios will retain the case of the original header for stylistic reasons and for a workaround when servers mistakenly consider the header's case. The old method of directly manipulating the headers object is still available, but deprecated and not recommended for future usage.

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
  foo: "1",
  bar: "2",
  baz: "3",
});

for (const [header, value] of headers) {
  console.log(header, value);
}

// foo 1
// bar 2
// baz 3
```
