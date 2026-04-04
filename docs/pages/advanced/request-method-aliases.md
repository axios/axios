# Request aliases

axios provides a set of aliases for making HTTP requests. These aliases are shortcuts for making requests using the `request` method. The aliases are designed to be easy to use and to provide a more convenient way to make requests.

axios endeavours to follow RFC 7231 and RFC 5789, as closely as possible. The aliases are designed to be consistent with the HTTP methods defined in these RFCs.

### `axios`

axios can be used to make HTTP request by passing only the config object. The full config object is documented [here](/pages/advanced/request-config)

```ts
axios(url: string | AxiosRequestConfig, config?: AxiosRequestConfig);
```

## Method aliases

The following aliases are available for making requests:

### `request`

The `request` method is the main method that you will use to make HTTP requests. It takes a configuration object as an argument and returns a promise that resolves to the response object. The `request` method is a generic method that can be used to make any type of HTTP request.

```ts
axios.request(config: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `get`

The `get` method is used to make a GET request. It takes a URL and an optional configuration object as arguments and returns a promise that resolves to the response object.

```ts
axios.get(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `delete`

The `delete` method is used to make a DELETE request. It takes a URL and an optional configuration object as arguments and returns a promise that resolves to the response object.

```ts
axios.delete(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `head`

The `head` method is used to make a HEAD request. It takes a URL and an optional configuration object as arguments and returns a promise that resolves to the response object.

```ts
axios.head(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `options`

The `options` method is used to make an OPTIONS request. It takes a URL and an optional configuration object as arguments and returns a promise that resolves to the response object.

```ts
axios.options(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `post`

The `post` method is used to make a POST request. It takes a URL, an optional data object, and an optional configuration object as arguments and returns a promise that resolves to the response object.

```ts
axios.post(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `put`

The `put` method is used to make a PUT request. It takes a URL, an optional data object, and an optional configuration object as arguments and returns a promise that resolves to the response object.

```ts
axios.put(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `patch`

The `patch` method is used to make a PATCH request. It takes a URL, an optional data object, and an optional configuration object as arguments and returns a promise that resolves to the response object.

```ts
axios.patch(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

## Form data shorthand methods

These methods are equivalent to their counterparts above, but preset `Content-Type` to `multipart/form-data`. They are the recommended way to upload files or submit HTML forms.

### `postForm`

```ts
axios.postForm(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

```js
// Upload a file from a browser file input
await axios.postForm("/api/upload", {
  file: document.querySelector("#fileInput").files[0],
  description: "Profile photo",
});
```

### `putForm`

```ts
axios.putForm(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

```js
// Replace a resource with form data
await axios.putForm("/api/users/1/avatar", {
  avatar: document.querySelector("#avatarInput").files[0],
});
```

### `patchForm`

```ts
axios.patchForm(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

```js
// Update specific fields using form data
await axios.patchForm("/api/users/1", {
  displayName: "New Name",
  avatar: document.querySelector("#avatarInput").files[0],
});
```

::: tip
`postForm`, `putForm`, and `patchForm` accept all the same data types as their base methods — plain objects, `FormData`, `FileList`, and `HTMLFormElement`. See [File posting](/pages/advanced/file-posting) for more examples.
:::
