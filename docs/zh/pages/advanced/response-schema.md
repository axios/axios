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
