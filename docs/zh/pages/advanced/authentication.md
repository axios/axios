# 认证

大多数 API 都需要某种形式的认证。本页介绍在 axios 请求中附加凭据的最常见模式。

## Bearer 令牌（JWT）

最常见的方式是在 `Authorization` 请求头中附加 JWT。最简洁的做法是通过 axios 实例上的请求拦截器实现，这样令牌会在每次请求时实时读取：

```js
import axios from "axios";

const api = axios.create({ baseURL: "https://api.example.com" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});
```

## HTTP Basic 认证

对于使用 HTTP Basic 认证的 API，传入 `auth` 选项即可。axios 会自动对凭据进行编码并设置 `Authorization` 请求头：

```js
const response = await axios.get("https://api.example.com/data", {
  auth: {
    username: "myUser",
    password: "myPassword",
  },
});
```

::: tip
对于 Bearer 令牌和 API 密钥，请使用自定义 `Authorization` 请求头，而非 `auth` 选项——`auth` 仅适用于 HTTP Basic 认证。
:::

## API 密钥

API 密钥通常作为请求头或查询参数传递，具体取决于 API 的要求：

```js
// 作为请求头
const api = axios.create({
  baseURL: "https://api.example.com",
  headers: { "X-API-Key": "your-api-key-here" },
});

// 作为查询参数
const response = await axios.get("https://api.example.com/data", {
  params: { apiKey: "your-api-key-here" },
});
```

## 令牌刷新

当访问令牌过期时，你需要静默刷新它并重新发送失败的请求。响应拦截器是实现此逻辑的合适位置：

```js
import axios from "axios";

const api = axios.create({ baseURL: "https://api.example.com" });

// 跟踪是否已有刷新正在进行，以避免并行发起多个刷新请求
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 将请求加入队列，等待刷新完成
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post("/auth/refresh", {
          refreshToken: localStorage.getItem("refresh_token"),
        });

        const newToken = data.access_token;
        localStorage.setItem("access_token", newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // 跳转到登录页或触发事件
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

## 基于 Cookie 的认证

对于依赖 Cookie 的会话 API，设置 `withCredentials: true` 以在跨域请求中携带 Cookie：

```js
const api = axios.create({
  baseURL: "https://api.example.com",
  withCredentials: true, // 每次请求均携带 Cookie
});
```

::: warning
`withCredentials: true` 要求服务器响应时携带 `Access-Control-Allow-Credentials: true`，且 `Access-Control-Allow-Origin` 必须为具体域名（不能是通配符）。
:::
