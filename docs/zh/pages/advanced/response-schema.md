# 响应结构

每个 axios 请求都会解析为具有以下结构的响应对象，在浏览器和 Node.js 环境中保持一致。

```js
{
  // 服务器提供的响应数据。
  // 使用 `transformResponse` 时，这将是最后一次转换的结果。
  data: {},

  // 服务器响应的 HTTP 状态码（如 200、404、500）。
  status: 200,

  // 与状态码对应的 HTTP 状态消息（如 "OK"、"Not Found"）。
  statusText: "OK",

  // 服务器发送的响应头。
  // 响应头名称均为小写，可通过方括号或点号表示法访问。
  headers: {},

  // 本次请求使用的 axios 配置，包括 baseURL、headers、timeout、params 及其他选项。
  config: {},

  // 底层请求对象。
  // 在 Node.js 中：最后一个 `http.ClientRequest` 实例（经过任何重定向后）。
  // 在浏览器中：`XMLHttpRequest` 实例。
  request: {},

  // 适配器完成请求所用的大致时间（毫秒）。
  // 由 axios 为内置适配器和自定义适配器设置；参阅下方的"响应耗时"。
  duration: 42,
}
```

在 TypeScript 中，`AxiosResponse<T, D, H, P>` 分别表示响应数据（`T`）、请求数据（`D`）、响应头（`H`）和查询参数（`P`）的类型。配置会保留两种请求侧类型：

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

## 访问响应字段

实际使用中，你通常只需要解构出所需的部分：

```js
const { data, status, headers } = await axios.get("/api/users/1");

console.log(status);          // 200
console.log(headers["content-type"]); // "application/json; charset=utf-8"
console.log(data);            // { id: 1, name: "Jay", email: "jay@example.com" }
```

## 响应耗时

`response.duration` 是以毫秒为单位的适配器耗时：

```js
const response = await axios.get('/users');

console.log(response.duration); // 例如 128
```

计时在 axios 调用适配器之前立即开始，此时请求拦截器和 `transformRequest` 已经运行完毕。计时在适配器完成时停止，早于 `transformResponse` 和响应拦截器的运行。因此，它包含连接排队和跟随重定向等适配器工作。

- 对于缓冲的响应，该值包含接收响应体的时间。
- 对于流式响应（HTTP 和 fetch 适配器中的 `responseType: "stream"`），它只测量到流可用为止的时间。之后消费该流或流发生错误都不会更新该值。
- 它不是 DNS、TCP、TLS 或首字节时间（TTFB）的细分，也不是服务器处理时间。
- 该值是使用 `Date.now()` 测量的大致挂钟时间。时钟向后调整会被限制为 `0`，但向前调整可能会使该值偏大。

axios 会在适配器生成的每个响应上设置 `duration`，覆盖自定义适配器已设置的任何 `duration` 属性。该属性在 TypeScript 声明中是可选的，因此自定义适配器和手动构造的响应无需提供它。没有响应的错误（例如网络错误、超时和取消）没有耗时；参阅[错误处理](/zh/pages/advanced/error-handling#错误中的响应耗时)。

## 检查状态码

axios 默认对任何 2xx 响应 resolve Promise，对超出该范围的响应 reject Promise。可以通过 `validateStatus` 配置选项自定义此行为：

```js
const response = await axios.get("/api/resource", {
  validateStatus: (status) => status < 500, // 500 以下的所有状态码均 resolve
});
```

## 访问响应头

无论服务器如何发送，所有响应头名称均为小写：

```js
const response = await axios.get("/api/resource");

// 以下两种写法等价
const contentType = response.headers["content-type"];
const contentType2 = response.headers.get("content-type");
```
