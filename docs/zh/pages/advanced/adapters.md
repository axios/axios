# 适配器

适配器允许你自定义 axios 处理请求数据的方式。默认情况下，axios 使用 `['xhr', 'http', 'fetch']` 的有序优先级列表，并选择当前环境支持的第一个适配器。实际上，这意味着在浏览器中使用 `xhr`，在 Node.js 中使用 `http`，在两者均不可用的环境（如 Cloudflare Workers 或 Deno）中使用 `fetch`。

编写自定义适配器可以让你完全掌控 axios 如何发起请求和处理响应，适用于测试、自定义传输或非标准环境等场景。

## 内置适配器

可以通过 `adapter` 配置选项按名称选择内置适配器：

```js
// 使用 fetch 适配器
const instance = axios.create({ adapter: "fetch" });

// 使用 XHR 适配器（浏览器默认）
const instance = axios.create({ adapter: "xhr" });

// 使用 HTTP 适配器（Node.js 默认）
const instance = axios.create({ adapter: "http" });
```

你也可以传入一个适配器名称数组，axios 将使用当前环境支持的第一个：

```js
const instance = axios.create({ adapter: ["fetch", "xhr", "http"] });
```

关于 `fetch` 适配器的更多详情，请参阅 [Fetch 适配器](/pages/advanced/fetch-adapter)页面。

## 创建自定义适配器

要创建自定义适配器，需要编写一个接受 `config` 对象并返回 Promise 的函数，该 Promise 需解析为有效的 axios 响应对象。

```js
import axios from "axios";
import { settle } from "axios/unsafe/core/settle.js";

function myAdapter(config) {
  /**
   * 到此时：
   * - config 已与默认配置合并
   * - 请求转换器已执行
   * - 请求拦截器已执行
   *
   * 适配器现在负责发起请求
   * 并返回有效的响应对象。
   */

  return new Promise((resolve, reject) => {
    // 在此执行自定义请求逻辑。
    // 本示例以原生 fetch API 为起点。
    fetch(config.url, {
      method: config.method?.toUpperCase() ?? "GET",
      headers: config.headers?.toJSON() ?? {},
      body: config.data,
      signal: config.signal,
    })
      .then(async (fetchResponse) => {
        const responseData = await fetchResponse.text();

        const response = {
          data: responseData,
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          headers: Object.fromEntries(fetchResponse.headers.entries()),
          config,
          request: null,
        };

        // settle 根据 HTTP 状态码决定是 resolve 还是 reject
        settle(resolve, reject, response);

        /**
         * 到此后：
         * - 响应转换器将执行
         * - 响应拦截器将执行
         */
      })
      .catch(reject);
  });
}

const instance = axios.create({ adapter: myAdapter });
```

::: tip
`settle` 辅助函数对 2xx 状态码 resolve Promise，对其他状态码 reject Promise，与 axios 的默认行为一致。如果需要自定义状态码验证，请改用 `validateStatus` 配置选项。
:::
