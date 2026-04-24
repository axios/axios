# 重试与错误恢复

网络请求可能因瞬时原因而失败——服务器抖动、短暂的网络中断或限流响应。在拦截器中实现重试策略，可以让你透明地处理这些失败，无需在业务代码中添加繁琐的重试逻辑。

## 基本重试（使用响应拦截器）

最简单的方式是捕获特定错误状态码，并在有限次数内立即重新发送原始请求：

```js
import axios from "axios";

const api = axios.create({ baseURL: "https://api.example.com" });

const MAX_RETRIES = 3;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // 仅在网络错误或 5xx 服务器错误时重试
    const shouldRetry =
      !error.response || (error.response.status >= 500 && error.response.status < 600);

    if (!shouldRetry) {
      return Promise.reject(error);
    }

    config._retryCount = config._retryCount ?? 0;

    if (config._retryCount >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    config._retryCount += 1;
    return api(config);
  }
);
```

## 指数退避

失败后立即重试可能会使本已压力过大的服务器雪上加霜。指数退避策略会在每次重试之间等待逐渐增长的时间：

```js
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    const shouldRetry =
      !error.response || (error.response.status >= 500 && error.response.status < 600);

    if (!shouldRetry) return Promise.reject(error);

    config._retryCount = config._retryCount ?? 0;

    if (config._retryCount >= 3) return Promise.reject(error);

    config._retryCount += 1;

    // 每次重试前分别等待 200ms、400ms、800ms……
    const backoff = 100 * 2 ** config._retryCount;
    await delay(backoff);

    return api(config);
  }
);
```

## 响应 429（限流）时使用 Retry-After

当服务器返回 `429 Too Many Requests` 时，通常会在响应头中包含 `Retry-After` 字段，明确告知你需要等待多长时间：

```js
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (error.response?.status !== 429) return Promise.reject(error);

    config._retryCount = config._retryCount ?? 0;
    if (config._retryCount >= 3) return Promise.reject(error);

    config._retryCount += 1;

    const retryAfterHeader = error.response.headers["retry-after"];
    const waitMs = retryAfterHeader
      ? parseFloat(retryAfterHeader) * 1000  // 请求头单位为秒
      : 1000;                                // 默认等待 1 秒

    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return api(config);
  }
);
```

## 针对特定请求禁用重试

如果某些请求不应被重试（例如不幂等的变更操作，不希望重复执行），可以在请求配置中添加一个标志：

```js
// 在重试逻辑之前，在拦截器中添加以下判断：
if (config._noRetry) return Promise.reject(error);

// 然后在特定调用中禁用重试：
await api.post("/payments/charge", body, { _noRetry: true });
```

## 结合重试与取消

使用 `AbortController` 可以取消正在等待退避延迟的请求：

```js
const controller = new AbortController();

try {
  await api.get("/api/data", { signal: controller.signal });
} catch (error) {
  if (axios.isCancel(error)) {
    console.log("Request aborted by user");
  }
}

// 从其他地方取消请求（以及任何待处理的重试延迟）：
controller.abort();
```
