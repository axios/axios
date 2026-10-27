# 升级指南

本指南旨在帮助你将项目从旧版本升级到新版本。建议阅读每个主要版本的发布说明，其中可能包含关于破坏性变更的重要信息。

## 升级到 v1.21.0

### 将自定义类实例用作请求头默认值

在 `headers.common` 以及 `headers.post` 等方法键下，axios 现在只将普通对象、原型为 null 的对象和 `AxiosHeaders` 实例视为默认值分组，因此与方法同名的字面请求头（例如 `Link`）会被保留。如果你将自己的类实例赋值为分组，请将其转换为普通对象（`{ post: { ...customDefaults } }`）或 `new AxiosHeaders({ ...customDefaults })`。否则，它的字符串表示形式会作为字面请求头随每个请求发送（包括使用其他方法的请求），这可能会暴露自定义 `toString()` 所包含的内容。参阅[按方法设置的请求头默认值](/zh/pages/advanced/config-defaults#按方法设置的请求头默认值)。

## 升级到 v1.20.0

### 自定义 fetch 接收经过过滤的第二个参数

当 `Request` 构造函数可用时，自定义 `env.fetch` 仍会将 `fetchOptions` 作为第二个参数接收，但其中不再包含 `method`、`headers`、`body`、`signal`、`duplex` 和 `credentials`。这些值由作为第一个参数传入的解析后 `Request` 表示，省略它们可以防止第二个参数覆盖该 `Request`。从第二个参数读取这些字段的自定义 fetch 实现必须改为从 `Request` 中读取。参阅[传递给自定义 fetch 的参数](/zh/pages/advanced/fetch-adapter#传递给自定义-fetch-的参数)。

### Fetch 适配器与 `maxRedirects: 0`

fetch 适配器会将 `maxRedirects: 0` 映射为平台的手动重定向模式，而不再跟随重定向。在 Node.js 中，`3xx` 响应及其 `Location` 响应头可能可见；浏览器会返回状态为 `0`、响应头不可读的不透明重定向。在 fetch 适配器中，正数值仍不会限制重定向次数。参阅 [Fetch 适配器重定向](/zh/pages/advanced/fetch-adapter#重定向)。

### HTTP/2 与代理

使用 `httpVersion: 2` 和显式 `proxy` 对象的请求会以 `ERR_NOT_SUPPORT` 拒绝。HTTP/2 请求会忽略代理环境变量和 agent 的 `proxyEnv` 设置并直接连接，因此在代理为强制出站策略的环境中请勿使用 HTTP/2。`proxy: false` 仍会直接连接。参阅 [HTTP2 代理](/zh/pages/advanced/http2#代理)。

### 请求拦截器返回的替换配置

当请求拦截器返回的对象不是可写的、原型为 null 的对象（例如对象字面量、`{ ...config }` 副本或类实例）时，axios 会在分发请求前将其复制到一个经过过滤的、原型为 null 的快照中。从应用程序定义的原型继承的字段会被复制为自身字段，但快照不会保留该对象的身份、原型、`instanceof` 检查、访问器或属性特性。通过自身原型为 `null` 的原型（例如 `Object.create(null)` 模板）继承的字段会被忽略。返回原始配置，或其他不含不安全键的可写、原型为 null 的对象，则会保留其身份，并且 axios 会在分发期间更新该对象上的 `headers` 和 `data` 等字段。参阅[返回不同的配置对象](/zh/pages/advanced/interceptors#返回不同的配置对象)。

### RFC 9110 状态码名称

`HttpStatusCode.ContentTooLarge`（413）和 `HttpStatusCode.UnprocessableContent`（422）是推荐使用的名称。`PayloadTooLarge` 和 `UnprocessableEntity` 在整个 v1.x 中仍可作为已废弃的别名使用，按数字反向查找仍会返回旧名称。

## 升级到 v1.19.0

### 格式错误的 HTTP(S) URL 将被拒绝

现在，如果 `http:` 或 `https:` 的 `url` 或 `baseURL` 在协议后缺少 `//`，请求会被拒绝。请将 `https:example.com` 或 `https:/example.com` 等值替换为 `https://example.com` 等格式正确的 URL。生成的 `AxiosError` 使用 `ERR_INVALID_URL` 代码，并在安全隐藏敏感信息后指出有问题的 URL。此项安全行为变更旨在防止格式错误 URL 的规范化过程绕过 `baseURL` 或 URL 允许列表。

### 同步请求拦截器错误

同步请求拦截器抛出错误时，axios 会调用其配对的拒绝处理器，并停止运行其余请求拦截器。正常返回的拒绝处理器会将错误视为已处理，并使用最后一个有效配置发送请求；它的返回值不会成为请求配置。如果验证必须阻止请求发送，请省略拒绝处理器，或让它抛出错误或返回已拒绝的 Promise。最终错误会继续传递给响应拒绝拦截器。

## 从 v0.x 升级到 v1.x

### import 语句变更

在 v1.x 中，import 语句改为使用 `default` 导出，你需要将 import 语句更新为如下形式：

```diff
- import { axios } from "axios";
+ import axios from "axios";
```

### 拦截器系统变更

在 v1.x 中，你需要使用 `InternalAxiosRequestConfig` 类型来为 `request` 拦截器的 `config` 参数标注类型。这是因为该参数现在的类型是 `InternalAxiosRequestConfig`，而不再是公开的 `AxiosRequestConfig`。

```diff
- axios.interceptors.request.use((config: AxiosRequestConfig) => {
+ axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    return config;
  });
```

### 请求头结构变更

在 v1.x 中，请求头的结构已去除 `common` 属性，你需要按如下方式更新相关代码：

```diff
- if (request.headers?.common?.Authorization) {
-       request.headers.common.Authorization = ...
+ if (request.headers?.Authorization) {
+       request.headers.Authorization = ...
```

原本位于 `common`、`get`、`post` 等属性下的默认请求头，现在直接设置在 `axios.defaults.headers` 上：

```diff
- axios.defaults.headers.common["Accept"] = "application/json";
+ axios.defaults.headers["Accept"] = "application/json";
```

### Multipart 表单数据

如果请求包含 `FormData` 数据，`Content-Type: multipart/form-data` 请求头现在会被自动设置，请移除手动设置以避免重复：

```diff
- axios.post("/upload", formData, {
-   headers: { "Content-Type": "multipart/form-data" },
- });
+ axios.post("/upload", formData);
```

如果你明确设置了 `Content-Type: application/json`，axios 现在会自动将数据序列化为 JSON。

### 参数序列化

v1.x 对 URL 参数的序列化方式进行了若干破坏性变更，主要包括：

**`params` 默认会进行百分号编码。** 如果你的后端期望接收 qs 风格的原始方括号编码，可能需要配置自定义序列化器：

```js
import qs from 'qs';

axios.create({
  paramsSerializer: {
    serialize: (params) => qs.stringify(params, { arrayFormat: 'brackets' }),
  },
});
```

**`params` 中的嵌套对象现在使用方括号表示法**（`foo[bar]=1`）序列化，而不再使用点号表示法。如果你的后端期望点号表示法，请使用自定义序列化器。

**`null` 和 `undefined` 参数**的处理方式现在已统一：`null` 值序列化为空字符串，而 `undefined` 值则被完全忽略。

关于参数序列化配置的完整选项，请参阅[请求配置](/pages/advanced/request-config)页面。

### 内部模块不再导出

我们决定不再导出 axios 的内部模块，你需要将代码更新为仅使用 axios 的公开 API。此变更旨在简化 API，缩小 axios 的接口范围，使我们能够在不声明破坏性变更的情况下修改内部实现。

请查阅本站的 [API 参考](/pages/advanced/api-reference)，获取最新的公开 API 信息。

### 请求配置

我们对请求配置对象进行了调整，请查阅本站的[配置参考](/pages/advanced/request-config)获取最新信息。

### 遗漏的破坏性变更

本指南并不详尽，可能未涵盖所有破坏性变更。如果你遇到任何问题，欢迎在 [docs GitHub 仓库](https://github.com/axios/docs)提交 issue，并添加 `breaking change` 标签。
