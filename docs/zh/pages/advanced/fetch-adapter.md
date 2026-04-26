# Fetch 适配器 <Badge type="tip" text="新特性" />

`fetch` 适配器是我们在 1.7.0 版本中引入的新适配器，使 axios 能够使用 `fetch` API，兼顾两者的优势。默认情况下，当构建中 `xhr` 和 `http` 适配器不可用，或当前环境不支持时，会使用 `fetch`。若要将其作为默认适配器，必须在创建 axios 实例时通过 `adapter` 选项显式指定。

```js
import axios from 'axios';

const instance = axios.create({
  adapter: 'fetch',
});
```

该适配器支持与 `xhr` 适配器相同的功能，包括上传和下载进度捕获，还支持额外的响应类型，如 `stream` 和 `formdata`（如果环境支持）。

## 自定义 fetch <Badge type="tip" text="v1.12.0+" />

从 `v1.12.0` 起，你可以自定义 fetch 适配器，使用自定义的 `fetch` 函数代替环境全局的 `fetch`。可以通过 `env` 配置选项传入自定义的 `fetch` 函数、`Request` 和 `Response` 构造函数。这在使用提供了自己 `fetch` 实现的自定义环境或应用框架时非常实用。

::: info
使用自定义 `fetch` 函数时，可能还需要提供匹配的 `Request` 和 `Response` 构造函数。如果省略，将使用全局构造函数。如果你的自定义 `fetch` 与全局构造函数不兼容，可以传入 `null` 来禁用它们。

**注意：** 将 `Request` 和 `Response` 设置为 `null` 后，fetch 适配器将无法捕获上传和下载进度。
:::

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
