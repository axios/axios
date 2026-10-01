# 创建实例

`axios.create()` 允许你创建一个预配置的 axios 实例。该实例与默认 `axios` 对象拥有相同的请求和响应 API，但会将你提供的配置作为每次请求的基础配置。对于任何超过单文件规模的应用，这是使用 axios 的推荐方式。

```ts
import axios from "axios";

const instance = axios.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
  headers: { "X-Custom-Header": "foobar" },
});
```

`create` 方法接受完整的[请求配置](/pages/advanced/request-config)对象。之后可以像使用默认 axios 对象一样使用该实例：

```js
const response = await instance.get("/users/1");
```

## 为什么要使用实例？

### 按服务设置 baseURL

在大多数应用中，你需要与多个 API 通信。为每个服务创建独立的实例，可以避免在每次调用时重复指定 baseURL：

```js
const githubApi = axios.create({ baseURL: "https://api.github.com" });
const internalApi = axios.create({ baseURL: "https://api.internal.example.com" });

const { data: repos } = await githubApi.get("/users/axios/repos");
const { data: users } = await internalApi.get("/users");
```

### 共享认证请求头

在一个实例上附加认证令牌，让该实例的所有请求自动携带，而不影响其他实例：

```js
const authApi = axios.create({
  baseURL: "https://api.example.com",
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});
```

### 按服务设置超时与重试

不同服务有不同的可靠性特征。可以为实时服务设置较短的超时，为批处理任务设置较长的超时：

```js
const realtimeApi = axios.create({ baseURL: "https://realtime.example.com", timeout: 2000 });
const batchApi    = axios.create({ baseURL: "https://batch.example.com",    timeout: 60000 });
```

### 隔离的拦截器

添加到实例上的拦截器只对该实例生效，有助于保持关注点分离：

```js
const loggingApi = axios.create({ baseURL: "https://api.example.com" });

loggingApi.interceptors.request.use((config) => {
  console.log(`→ ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});
```

## 按请求覆盖默认配置

在请求时传入的配置始终会覆盖实例默认配置：

```js
const api = axios.create({ timeout: 5000 });

// 这个特定请求使用 30 秒超时
await api.get("/slow-endpoint", { timeout: 30000 });
```

::: tip
实例默认配置也可以在创建后通过修改 `instance.defaults` 来更改：

```js
instance.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
```
:::
