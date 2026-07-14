# 请求别名

axios 提供了一组发起 HTTP 请求的别名方法，这些别名是 `request` 方法的快捷方式，设计简洁、使用方便。

axios 尽量遵循 RFC 7231 和 RFC 5789 规范，别名方法与这些规范中定义的 HTTP 方法保持一致。

### `axios`

axios 可以通过仅传入配置对象来发起 HTTP 请求，完整的配置对象文档见[此处](/pages/advanced/request-config)。

```ts
axios(url: string | AxiosRequestConfig, config?: AxiosRequestConfig);
```

## 方法别名

以下是可用的请求别名方法：

### `request`

`request` 方法是发起 HTTP 请求的主方法，接受一个配置对象并返回解析为响应对象的 Promise，可用于发起任意类型的 HTTP 请求。

```ts
axios.request(config: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `get`

`get` 方法用于发起 GET 请求，接受 URL 和可选配置对象，返回解析为响应对象的 Promise。

```ts
axios.get(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `delete`

`delete` 方法用于发起 DELETE 请求，接受 URL 和可选配置对象，返回解析为响应对象的 Promise。

```ts
axios.delete(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `head`

`head` 方法用于发起 HEAD 请求，接受 URL 和可选配置对象，返回解析为响应对象的 Promise。

```ts
axios.head(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `options`

`options` 方法用于发起 OPTIONS 请求，接受 URL 和可选配置对象，返回解析为响应对象的 Promise。

```ts
axios.options(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `post`

`post` 方法用于发起 POST 请求，接受 URL、可选数据对象和可选配置对象，返回解析为响应对象的 Promise。

```ts
axios.post(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `put`

`put` 方法用于发起 PUT 请求，接受 URL、可选数据对象和可选配置对象，返回解析为响应对象的 Promise。

```ts
axios.put(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `patch`

`patch` 方法用于发起 PATCH 请求，接受 URL、可选数据对象和可选配置对象，返回解析为响应对象的 Promise。

```ts
axios.patch(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `query`

`query` 方法用于发起 QUERY 请求，这是一种安全且幂等的、可以携带请求体的方法。它接受 URL、可选数据对象和可选配置对象，返回解析为响应对象的 Promise。当读取类操作的参数过于复杂或敏感、不适合放在 URL 中时，可以使用该方法。

```ts
axios.query(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

```js
// 将复杂的搜索条件作为请求体发送
const { data } = await axios.query("/api/search", {
  selector: ["name", "email"],
  filter: { active: true, role: "admin" },
});
```

::: warning 草案规范
QUERY 方法目前由 IETF 的 [Internet-Draft](https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/) 定义，尚未成为正式标准。其语义乃至方法名称都可能在最终发布前发生变化，并且服务器、代理和 CDN 的支持情况参差不齐。在用于生产环境之前，请确认你的整个链路都能够正确处理 `QUERY` 请求。
:::

### `getUri`

`getUri` 方法返回给定配置在不实际发起请求的情况下会发送的 URL。它会应用 `baseURL`、`paramsSerializer` 和 `params`，因此你拿到的字符串与 axios 实际发出的 URL 相同。可用于构建链接、调试序列化逻辑，或在另一个请求中复用解析后的 URL。

```ts
axios.getUri(config?: AxiosRequestConfig): string;
```

```js
const url = axios.getUri({
  url: "/users",
  baseURL: "https://api.example.com",
  params: { active: true, role: "admin" },
});
// "https://api.example.com/users?active=true&role=admin"
```

::: tip
在实例上调用 `getUri`（`instance.getUri(config)`）会继承该实例的 `baseURL`、`params` 和 `paramsSerializer` 默认值。
:::

## 表单数据快捷方法

这些方法与上述对应方法等价，但会预设 `Content-Type` 为 `multipart/form-data`，是上传文件或提交 HTML 表单的推荐方式。

### `postForm`

```ts
axios.postForm(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

```js
// 从浏览器文件输入框上传文件
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
// 用表单数据替换资源
await axios.putForm("/api/users/1/avatar", {
  avatar: document.querySelector("#avatarInput").files[0],
});
```

### `patchForm`

```ts
axios.patchForm(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

```js
// 使用表单数据更新特定字段
await axios.patchForm("/api/users/1", {
  displayName: "New Name",
  avatar: document.querySelector("#avatarInput").files[0],
});
```

::: tip
`postForm`、`putForm` 和 `patchForm` 接受与基础方法相同的所有数据类型——普通对象、`FormData`、`FileList` 以及 `HTMLFormElement`。更多示例请参阅[文件上传](/pages/advanced/file-posting)。
:::
