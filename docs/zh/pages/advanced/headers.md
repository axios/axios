# 请求头 <Badge type="tip" text="新特性" />

axios 暴露了自己的 AxiosHeaders 类，通过类 Map 的 API 来操作请求头，保证键名不区分大小写。axios 内部使用该类管理请求头，同时也将其暴露给用户以提供便利。尽管 HTTP 请求头本身不区分大小写，axios 仍会保留原始请求头的大小写形式，以满足风格需求，并在服务器错误地将请求头大小写视为有效区分时提供兼容。直接操作请求头对象的旧方式仍然可用，但已废弃，不建议在新代码中使用。

## 使用请求头

AxiosHeaders 对象实例可以包含不同类型的内部值，用于控制设置和合并逻辑。axios 在将最终请求头对象发送前会调用 `toJSON` 方法。AxiosHeaders 对象也是可迭代的，可以在循环中使用，或转换为数组或对象。

请求头值可以是以下类型之一：

- `string` - 正常的字符串值，将被发送到服务器
- `null` - 转换为 JSON 时跳过该请求头
- `false` - 转换为 JSON 时跳过该请求头，并额外表示调用 `set` 方法时必须将 `rewrite` 选项设置为 true 才能覆盖此值（axios 内部使用此机制允许用户选择不安装某些请求头，如 User-Agent 或 Content-Type）
- `undefined` - 值未设置

::: warning
如果请求头值不是 undefined，则视为已设置。
:::

请求头对象始终在拦截器和转换器中初始化，如以下示例所示：

```js
axios.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  request.headers.set("My-header", "value");

  request.headers.set({
    "My-set-header1": "my-set-value1",
    "My-set-header2": "my-set-value2",
  });

  // 禁止 axios 后续设置此请求头
  request.headers.set("User-Agent", false);

  request.headers.setContentType("text/plain");

  // 直接访问的方式已废弃
  request.headers["My-set-header2"] = "newValue";

  return request;
});
```

你可以使用任何可迭代方法遍历 AxiosHeaders，如 for-of 循环、forEach 或展开运算符：

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

## 在请求中设置请求头

最常见的设置请求头的方式是在请求配置或实例配置的 `headers` 选项中设置：

```js
// 针对单个请求
await axios.get('/api/data', {
  headers: {
    'Accept-Language': 'en-US',
    'X-Request-ID': 'abc123',
  },
});

// 针对实例（应用于每个请求）
const api = axios.create({
  headers: {
    'X-App-Version': '2.0.0',
  },
});
```

## 与 HTTP 方法同名的请求头

有些请求头名称与某个 HTTP 方法相同，例如 `Link`（对应 `LINK` 方法）。当其值为字符串或其他非映射值时，axios 会将其作为普通请求头发送：

```js
await axios.post('/api/resource', data, {
  headers: { Link: '<https://example.com/resource>; rel="type"' },
});
```

在配置的 `headers` 中，只有当键 `common` 和小写方法名（`get`、`post`、`link` 等）的值为普通对象、原型为 null 的对象或 `AxiosHeaders` 实例（包括子类以及来自另一份 axios 副本的兼容实例）时，它们才会被视为[默认值分组](/zh/pages/advanced/config-defaults#按方法设置的请求头默认值)。只有与请求方法匹配的分组会被应用，分组本身永远不会作为字面请求头发送。

其他任何值都会被序列化为普通请求头值：字符串、数字、数组，以及 `Date`、`Buffer`、类型化数组和应用程序类实例等对象（这些对象会被转换为字符串）。例如，在 Node.js 中：

```js
await axios.post('/api/resource', data, {
  headers: { Link: Buffer.from('<https://example.com/resource>; rel="type"') },
});
// 发送为：Link: <https://example.com/resource>; rel="type"
```

值为 `null`、`undefined` 和 `false` 时仍会省略该请求头。

## 保留特定请求头大小写

axios 请求头名称不区分大小写，但 `AxiosHeaders` 会保留第一个匹配键的大小写形式。如果你需要为大小写敏感的非标准服务器保留特定大小写，可以在 `defaults` 中预设键名，之后再按常规方式设置值。

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

也可以在组合请求头时直接使用 `AxiosHeaders` 实现：

```js
import axios, { AxiosHeaders } from 'axios';

const headers = AxiosHeaders.concat(
  { 'content-type': undefined },
  { 'Content-Type': 'application/octet-stream' }
);

await axios.put(url, data, { headers });
```

## 在拦截器中设置请求头

拦截器是附加动态请求头（如认证令牌）的合适位置，因为令牌可能在实例首次创建时还不可用：

```js
api.interceptors.request.use((config) => {
  const token = getAuthToken(); // 在请求时读取
  config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});
```

## 读取响应头

响应头以 `AxiosHeaders` 实例的形式在 `response.headers` 上可用，所有头名称均为小写：

```js
const response = await axios.get('/api/data');

console.log(response.headers['content-type']);
// application/json; charset=utf-8

console.log(response.headers.get('x-request-id'));
// abc123
```

## 移除默认请求头

如需取消 axios 默认设置的请求头（如 `Content-Type` 或 `User-Agent`），将其值设置为 `false`：

```js
await axios.post('/api/data', payload, {
  headers: {
    'Content-Type': false, // 让浏览器自动设置（例如针对 FormData）
  },
});
```

关于完整 `AxiosHeaders` 方法 API 的详细说明，请参阅[请求头方法](/pages/advanced/header-methods)页面。
