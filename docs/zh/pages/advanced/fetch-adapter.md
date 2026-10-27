# Fetch 适配器 <Badge type="tip" text="新特性" />

`fetch` 适配器是我们在 1.7.0 版本中引入的新适配器，使 axios 能够使用 `fetch` API，兼顾两者的优势。默认情况下，当构建中 `xhr` 和 `http` 适配器不可用，或当前环境不支持时，会使用 `fetch`。若要将其作为默认适配器，必须在创建 axios 实例时通过 `adapter` 选项显式指定。

```js
import axios from 'axios';

const instance = axios.create({
  adapter: 'fetch',
});
```

该适配器支持与 `xhr` 适配器相同的功能，包括上传和下载进度捕获，还支持额外的响应类型，如 `stream` 和 `formdata`（如果环境支持）。

当省略 `auth` 时，fetch 适配器可以从请求 URL 中读取 HTTP Basic 认证凭据，例如 `https://user:pass@example.com`。生成 `Authorization` 请求头前会先解码 URL 中经过百分号编码的凭据，并且 `auth` 优先于 URL 中的凭据。

## 响应大小限制

设置 `maxContentLength` 后，如果响应超出限制（包括在读取响应体期间超出），fetch 适配器会以 `ERR_BAD_RESPONSE` 拒绝。即使运行时包装或丢弃了原始的流错误，该错误也会保留当前的 `config` 和 `request`，因此不会被报告为网络错误。与由 5xx 状态引起的 `ERR_BAD_RESPONSE` 不同，大小限制错误没有 `error.response`。

```js
try {
  await axios.get('https://example.com/large-file', {
    adapter: 'fetch',
    maxContentLength: 10 * 1024 * 1024, // 10 MB
  });
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_BAD_RESPONSE' && !error.response) {
      console.error('Response too large:', error.message);
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Network failure');
    }
  }
}
```

使用 `responseType: 'stream'` 或 `'response'` 时，请求会在响应流可用时立即 resolve。只有当声明的 `Content-Length` 已经超过限制时，axios 才会提前拒绝请求。否则，大小检查会在读取流时进行，响应体过大时，读取会在请求 Promise 已经 resolve 之后以同样的 `ERR_BAD_RESPONSE` 失败。因此在消费流时也要处理错误：

```js
const response = await axios.get('https://example.com/large-file', {
  adapter: 'fetch',
  responseType: 'stream',
  maxContentLength: 10 * 1024 * 1024, // 10 MB
});

const reader = response.data.getReader();

try {
  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    // 处理 chunk.value
  }
} catch (error) {
  if (axios.isAxiosError(error) && error.code === 'ERR_BAD_RESPONSE') {
    console.error('Response too large:', error.message);
  }
}
```

## 重定向

默认情况下，fetch 适配器由运行时跟随重定向。设置 `maxRedirects: 0` 会请求平台的手动重定向模式（`redirect: 'manual'`）。此时得到的结果取决于 fetch 运行时：

- Node.js 可能会暴露 `3xx` 状态及其 `Location` 响应头。使用默认的 `validateStatus` 时，该响应会被拒绝；如需自行处理，请接受 `3xx` 状态。
- 浏览器会返回状态为 `0`、响应头不可访问的不透明重定向，因此无法读取目标位置。

```js
const response = await axios.get('https://example.com/old-path', {
  adapter: 'fetch',
  maxRedirects: 0,
  validateStatus: (status) => status < 400,
});

// 例如在 Node.js 中：301 'https://example.com/new-path'
console.log(response.status, response.headers.get('location'));
```

请勿在浏览器代码中依赖 Node.js 的行为。在 fetch 适配器中，正数的 `maxRedirects` 值不会限制重定向次数；只有 `0` 会改变其行为。

## 自定义 fetch <Badge type="tip" text="v1.12.0+" />

从 `v1.12.0` 起，你可以自定义 fetch 适配器，使用自定义的 `fetch` 函数代替环境全局的 `fetch`。可以通过 `env` 配置选项传入自定义的 `fetch` 函数、`Request` 和 `Response` 构造函数。这在使用提供了自己 `fetch` 实现的自定义环境或应用框架时非常实用。

::: info
使用自定义 `fetch` 函数时，可能还需要提供匹配的 `Request` 和 `Response` 构造函数。如果省略，将使用全局构造函数。如果你的自定义 `fetch` 与全局构造函数不兼容，可以传入 `null` 来禁用它们。

**注意：** 将 `Request` 和 `Response` 设置为 `null` 后，fetch 适配器将无法捕获上传和下载进度。
:::

### 传递给自定义 fetch 的参数

当 `Request` 构造函数可用时，axios 调用你的 `fetch` 时会将完全解析后的 `Request` 作为第一个参数，将经过过滤的 `fetchOptions` 副本作为第二个参数。第二个参数会保留你自己的自定义字段，但会省略 axios 通过 `Request` 管理的字段：`method`、`headers`、`body`、`signal`、`duplex` 和 `credentials`。请从 `Request` 中读取这些值：

```js
const instance = axios.create({
  adapter: 'fetch',
  fetchOptions: { cache: 'no-store', tag: 'reports' },
  env: {
    fetch: (request, options) => {
      console.log(request.method, request.headers.get('content-type'));
      console.log(options.cache, options.tag); // 'no-store' 'reports'
      return fetch(request, options);
    },
  },
});
```

禁用 `Request`（`Request: null`）时，axios 会改为使用完整的解析后选项调用 `fetch(url, options)`。

### 自定义 `Response` 构造函数

当运行时支持响应流、响应带有响应体，并且满足以下任一条件时，axios 会将响应体包装在一个受跟踪的 `ReadableStream<Uint8Array>` 中，并将其传给 `env.Response`：

- 启用了 `maxContentLength`（大于 `-1` 的数字），即使没有进度回调；
- 设置了 `onDownloadProgress`；
- `responseType` 为 `'stream'` 或 `'response'`，且请求使用了 `signal`、`cancelToken` 或 `timeout`。

自定义 `Response` 构造函数必须接受该流并原样转发；否则大小限制、进度和取消跟踪都无法生效。为保持兼容，`env.Response` 的 TypeScript 签名保留了旧版的响应体类型，因此能通过类型检查的构造函数并不保证在运行时支持流式响应体。

```js
class CustomResponse extends Response {
  constructor(body, init) {
    // `body` 可能是受跟踪的 ReadableStream：请原样传递
    super(body, init);
  }
}

const instance = axios.create({
  adapter: 'fetch',
  maxContentLength: 10 * 1024 * 1024,
  onDownloadProgress: (e) => console.log(e.loaded),
  env: { fetch: customFetch, Response: CustomResponse },
});
```

### 基本示例

```js
import customFetchFunction from 'customFetchModule';

const instance = axios.create({
  adapter: 'fetch',
  onDownloadProgress(e) {
    console.log('downloadProgress', e);
  },
  env: {
    fetch: customFetchFunction,
    Request: null, // null -> 禁用该构造函数
    Response: null,
  },
});
```

### 与 Tauri 一起使用

[Tauri](https://tauri.app/plugin/http-client/) 提供了一个平台 `fetch` 函数，可绕过浏览器对原生层请求的 CORS 限制。以下示例展示了在 Tauri 应用中使用该自定义 fetch 配置 axios 的最简设置。

```js
import { fetch } from '@tauri-apps/plugin-http';
import axios from 'axios';

const instance = axios.create({
  adapter: 'fetch',
  onDownloadProgress(e) {
    console.log('downloadProgress', e);
  },
  env: {
    fetch,
  },
});

const { data } = await instance.get('https://google.com');
```

### 与 SvelteKit 一起使用

[SvelteKit](https://svelte.dev/docs/kit/web-standards#Fetch-APIs) 为服务端 `load` 函数提供了自定义的 `fetch` 实现，用于处理 Cookie 转发和相对 URL。由于其 `fetch` 与标准 `URL` API 不兼容，必须明确配置 axios 使用它，并禁用全局 `Request` 和 `Response` 构造函数。

```js
export async function load({ fetch }) {
  const { data: post } = await axios.get('https://jsonplaceholder.typicode.com/posts/1', {
    adapter: 'fetch',
    env: {
      fetch,
      Request: null,
      Response: null,
    },
  });

  return { post };
}
```
