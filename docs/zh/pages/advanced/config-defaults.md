# 配置默认值

axios 允许你指定应用于每个请求的配置默认值，包括 `baseURL`、`headers`、`timeout` 等属性。下面是使用配置默认值的示例：

```js
axios.defaults.baseURL = "https://jsonplaceholder.typicode.com/posts";
axios.defaults.headers.common["Authorization"] = AUTH_TOKEN;
axios.defaults.headers.post["Content-Type"] =
  "application/x-www-form-urlencoded";
```

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
