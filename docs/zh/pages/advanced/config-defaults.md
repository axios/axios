# 配置默认值

axios 允许你指定应用于每个请求的配置默认值，包括 `baseURL`、`headers`、`timeout` 等属性。下面是使用配置默认值的示例：

```js
axios.defaults.baseURL = "https://jsonplaceholder.typicode.com/posts";
axios.defaults.headers.common["Authorization"] = AUTH_TOKEN;
axios.defaults.headers.post["Content-Type"] =
  "application/x-www-form-urlencoded";
```

::: warning 全局请求头会被发送到所有主机
如果你的应用会与多个域名通信，设置 `axios.defaults.headers.common["Authorization"]` 会将令牌发送到**所有**域名，包括你可能无法控制的第三方 API。对任何携带凭据的客户端，请使用带有限定 `baseURL` 的[自定义实例](#自定义实例默认值)。
:::

## 按方法设置的请求头默认值

`headers.common` 适用于所有请求，而 `headers.get`、`headers.post` 及其他小写方法名仅适用于使用相应方法的请求。这些默认值分组必须是普通对象、原型为 null 的对象或 `AxiosHeaders` 实例。这些键下的其他任何值都会被视为字面请求头值；参阅[与 HTTP 方法同名的请求头](/zh/pages/advanced/headers#与-http-方法同名的请求头)。

如果你使用自己的类构建默认值，请在将实例赋值为分组之前先进行转换：

```js
import axios, { AxiosHeaders } from 'axios';

const instance = axios.create({
  headers: {
    // 两种方式都会将实例自身的可枚举请求头条目保留为 POST 默认值
    post: { ...customDefaults },
    // 或：post: new AxiosHeaders({ ...customDefaults }),
  },
});
```

::: warning
赋值给 `common` 或某个方法名的任意类实例不会被用作分组。它的字符串表示形式会作为字面请求头（例如 `post: [object Object]`）随每个请求发送，包括使用其他方法的请求。自定义的 `toString()` 可能会以这种方式暴露实例的内容。
:::

## 自定义实例默认值

axios 实例在创建时会有自己的默认配置，这些默认配置可以通过修改实例的 `defaults` 属性来覆盖。下面是使用自定义实例默认值的示例：

```js
var instance = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com/posts",
  timeout: 1000,
  headers: { Authorization: "foobar" },
});

instance.defaults.headers.common["Authorization"] = AUTH_TOKEN;
```

## 配置优先级

配置将按照优先级顺序合并，依次为：库的默认值、实例的默认属性，最后是请求时传入的配置参数。下面通过示例说明优先级顺序。

某些选项是请求专属的，只会从请求配置中读取。`data` 就属于这类选项：axios 不会从全局或实例默认值继承请求体，也不会深度合并请求体。如果每个请求都需要共享的请求体字段，请使用请求拦截器或 `transformRequest` 添加，并谨慎限定作用范围，避免把敏感值发送到错误的端点。

首先，创建一个使用库提供的默认值的实例。此时 timeout 配置值为 `0`，这是库的默认值。

```js
const instance = axios.create();
```

接下来，将实例的 timeout 默认值覆盖为 `2500` 毫秒。此后，使用该实例的所有请求都将在 2.5 秒后超时。

```js
instance.defaults.timeout = 2500;
```

最后，发起一个 timeout 为 `5000` 毫秒的请求，该请求将在 5 秒后超时。

```js
instance.get("/longRequest", {
  timeout: 5000,
});
```
