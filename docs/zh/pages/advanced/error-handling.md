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
