# 错误处理

axios 可能会抛出多种不同类型的错误，有些来自 axios 本身，有些来自服务器或客户端。下表列出了所抛出错误的基本结构：

| 属性    | 说明                                                                                                                                          |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| message | 错误信息的简要摘要，以及失败时的状态码。                                                                                                      |
| name    | 定义错误的来源，对于 axios 来说始终是 `AxiosError`。                                                                                          |
| stack   | 提供错误的堆栈跟踪。                                                                                                                          |
| config  | 包含用户在发起请求时定义的特定实例配置的 axios 配置对象。                                                                                     |
| code    | 表示 axios 内部识别的错误，下表列出了 axios 内部错误的具体说明。                                                                              |
| status  | HTTP 响应状态码。常见 HTTP 响应状态码的含义请参阅[此处](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes)。                            |

以下是 axios 内部可能出现的错误列表：

| 错误代码                  | 说明                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------- |
| ERR_BAD_OPTION_VALUE      | axios 配置中提供了无效或不支持的值。                                                    |
| ERR_BAD_OPTION            | axios 配置中提供了无效选项。                                                            |
| ECONNABORTED              | 通常表示请求已超时（除非设置了 `transitional.clarifyTimeoutError`）或被浏览器或其插件中止。 |
| ETIMEDOUT                 | 请求因超过 axios 默认时限而超时。必须将 `transitional.clarifyTimeoutError` 设置为 `true`，否则会抛出通用的 `ECONNABORTED` 错误。 |
| ERR_NETWORK               | 网络相关问题。在浏览器中，此错误也可能由 [CORS](https://developer.mozilla.org/ru/docs/Web/HTTP/Guides/CORS) 或[混合内容](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)策略违规引起。出于安全考虑，浏览器不允许 JS 代码获知错误的真实原因，请检查控制台。 |
| ERR_FR_TOO_MANY_REDIRECTS | 请求重定向次数过多，超过了 axios 配置中指定的最大重定向次数。                           |
| ERR_DEPRECATED            | 使用了 axios 中已废弃的功能或方法。                                                     |
| ERR_BAD_RESPONSE          | 响应无法正确解析或格式异常，通常与 `5xx` 状态码的响应有关。                             |
| ERR_BAD_REQUEST           | 请求格式异常或缺少必要参数，通常与 `4xx` 状态码的响应有关。                             |
| ERR_CANCELED              | 功能或方法被用户通过 AbortSignal（或 CancelToken）显式取消。                            |
| ERR_NOT_SUPPORT           | 当前 axios 环境不支持该功能或方法。                                                     |
| ERR_INVALID_URL           | axios 请求提供了无效的 URL。                                                            |
| ERR_FORM_DATA_DEPTH_EXCEEDED | 在序列化 `params` 或表单数据时，对象超过了配置的 `maxDepth`，默认上限为 100 层。详见 [`paramsSerializer`](/pages/advanced/request-config#paramsserializer) 和 [`formSerializer`](/pages/advanced/request-config#formserializer)。 |

## 处理错误

axios 的默认行为是在请求失败时 reject Promise。不过，你也可以捕获错误并按需处理。以下是捕获错误的示例：

```js
axios.get("/user/12345").catch(function (error) {
  if (error.response) {
    // 请求已发出，服务器返回了不在 2xx 范围内的状态码
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    // 请求已发出，但未收到响应
    // `error.request` 在浏览器中是 XMLHttpRequest 实例，在 node.js 中是 http.ClientRequest 实例
    console.log(error.request);
  } else {
    // 在设置请求时触发了错误
    console.log("Error", error.message);
  }
  console.log(error.config);
});
```

## 格式错误的 HTTP(S) URL

如果 `http:` 或 `https:` 请求的 `url` 或 `baseURL` 在协议后缺少 `//`，axios 会拒绝请求。例如，`https:example.com` 和 `https:/example.com` 会以代码为 `ERR_INVALID_URL` 的 `AxiosError` 拒绝，而不会由浏览器或 Node.js URL 解析器静默规范化。请使用 `https://example.com` 等格式正确的 URL。

错误消息会指出有问题的 URL，例如：

```text
Invalid URL "https:example.com": missing "//" after protocol
```

此行为可防止格式错误的 URL 绕过 `baseURL` 或 URL 允许列表。报告的 URL 会先规范化控制字符，并隐藏凭据、查询参数值和片段内容；协议、主机、路径和查询参数名称会保留，以便识别请求。消息级脱敏始终生效，因为 `AxiosError.message` 一定会包含在 `toJSON()` 中；请求配置的 `redact` 选项无法清理已创建的消息。

使用 `validateStatus` 配置选项，可以覆盖默认条件（`status >= 200 && status < 300`），自定义应当抛出错误的 HTTP 状态码。

```js
axios.get("/user/12345", {
  validateStatus: function (status) {
    return status < 500; // 仅在状态码小于 500 时 resolve
  },
});
```

使用 `toJSON` 方法，可以获取包含更多错误信息的对象。

```js
axios.get("/user/12345").catch(function (error) {
  console.log(error.toJSON());
});
```

为避免从 `error.config` 中泄露敏感信息，可在请求配置中传入 `redact` 数组。当调用 `AxiosError#toJSON()` 时，匹配的配置键会在任意深度上以不区分大小写的方式被脱敏。

```js
axios.get("/user/12345", {
  headers: { Authorization: "Bearer token" },
  redact: ["authorization"]
}).catch(function (error) {
  console.log(error.toJSON().config.headers.Authorization); // [REDACTED ****]
});
```

## 错误中的响应耗时

当错误携带响应时（例如被 `validateStatus` 拒绝的非 2xx 状态），`error.response.duration` 保存以毫秒为单位的适配器耗时。并非所有错误都有响应：网络错误、超时和取消都没有 `error.response`，因此也没有耗时。读取前请先检查是否存在响应：

```js
try {
  await axios.get('/users');
} catch (error) {
  if (axios.isAxiosError(error) && error.response) {
    console.log(error.response.status, error.response.duration);
  }
}
```

严格 JSON 解析失败时，附加在错误上的响应仍会保留耗时。该值的具体含义请参阅[响应耗时](/zh/pages/advanced/response-schema#响应耗时)。

## 包装的错误堆栈

当 axios 包装底层错误（例如 Node.js 套接字或 DNS 故障）时，原始错误仍可通过 `error.cause` 访问。包装后的 `error.stack` 还会在 `Caused by:` 行之后包含被包装错误的堆栈，因此只读取 `stack` 的错误上报工具也能看到底层故障。axios 帧和重建的调用方帧排在前面，后面原样附上被包装的堆栈：

```text
Error: getaddrinfo ENOTFOUND api.example.invalid
    at AxiosError.from (.../axios/lib/core/AxiosError.js)
    ...
    at Axios.request (.../axios/lib/core/Axios.js)
    at async loadUser (/app/users.js:4:5)
Caused by: Error: getaddrinfo ENOTFOUND api.example.invalid
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:...)
```

如需以编程方式访问，请使用 `error.cause`；它就是同一个原始错误对象：

```js
try {
  await axios.get('https://api.example.invalid/users');
} catch (error) {
  if (axios.isAxiosError(error) && error.cause) {
    console.log(error.cause.code); // 例如 'ENOTFOUND'
  }
}
```

请注意以下几点：

- `error.toJSON().stack` 也会返回这个组合后的字符串。它是原样输出的诊断信息：`redact` 不会清理堆栈字符串。
- 已经会打印 `error.cause` 的、支持 cause 的工具可能会将部分堆栈内容显示两次。
- 只有通过 `AxiosError.from()` 包装、且其 cause 具有可用堆栈的错误才会增加该部分。缺失、为空或无法读取的堆栈会被跳过。
- 每次包装已经包装过的错误都会再增加一个嵌套部分，因此字符串会随每次包装而变长。
- 在 `AxiosError.from()` 的 `customProps` 参数中传入的 `stack` 仍会替换生成的堆栈。
- `Caused by:` 标记是诊断文本，并非可供解析的稳定格式。
- 包装无法恢复平台从未提供的细节。例如，浏览器 XHR 的 `Network Error` 通常没有底层错误堆栈，因此被隐藏的 CORS、DNS 或 TLS 原因仍然无法获取。

## 处理超时

当请求超过其配置的 `timeout` 时，axios 默认会以 `ECONNABORTED` 拒绝。设置 `transitional.clarifyTimeoutError: true` 可改为收到 `ETIMEDOUT`，便于将超时错误与其他中止情况区分开。

```js
async function fetchWithTimeout() {
  try {
    const response = await axios.get("https://example.com/data", {
      timeout: 5000, // 5 秒
      transitional: {
        // 如果你更倾向于使用 ETIMEDOUT 而非 ECONNABORTED，请设置为 true
        clarifyTimeoutError: true,
      },
    });

    console.log("Response:", response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        console.error("请求超时，请重试。");
        return;
      }

      console.error("Axios 错误：", error.message);
      return;
    }

    console.error("意外错误：", error);
  }
}
```

::: tip 在生产环境中始终设置 `timeout`
若不设置超时，停滞的请求可能会无限挂起。匹配的配置选项请参阅 [`timeout`](/pages/advanced/request-config#timeout) 与 [`transitional.clarifyTimeoutError`](/pages/advanced/request-config#transitional)。
:::
