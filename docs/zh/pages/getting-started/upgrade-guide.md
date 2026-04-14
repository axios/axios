# 升级指南

本指南旨在帮助你将项目从旧版本升级到新版本。建议阅读每个主要版本的发布说明，其中可能包含关于破坏性变更的重要信息。

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
