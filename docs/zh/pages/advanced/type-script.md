# TypeScript

`axios` 在 npm 包中通过 `index.d.ts`（ESM）和 `index.d.cts`（CJS）随包提供 TypeScript 类型定义，因此两种模块格式下的类型检查与编辑器支持都开箱即用。

## 模块解析注意事项

由于 axios 同时以 ESM 默认导出和 CJS `module.exports` 两种方式发布，存在以下配置注意事项：

- 推荐使用 `"moduleResolution": "node16"`（由 `"module": "node16"` 隐式指定），需要 TypeScript 4.7 或更高版本。
- 如果你使用 ESM，现有配置应该没有问题。
- 如果你将 TypeScript 编译为 CJS 且无法使用 `"moduleResolution": "node16"`，则必须启用 `esModuleInterop`。
- 如果你使用 TypeScript 对 CJS JavaScript 代码进行类型检查，则只能使用 `"moduleResolution": "node16"`。

## axios 错误的类型守卫

使用 `axios.isAxiosError` 类型守卫可以在 `catch` 块中安全地收窄 `unknown` 错误。收窄之后，你便可以在完整的类型支持下访问 `error.response`、`error.config` 和 `error.code` 等 axios 专有属性。

```ts
import axios from "axios";

let user: User | null = null;
try {
  const { data } = await axios.get("/user?ID=12345");
  user = data.userDetails;
} catch (error) {
  if (axios.isAxiosError(error)) {
    handleAxiosError(error);
  } else {
    handleUnexpectedError(error);
  }
}
```

使用 `axios.isCancel<T>()` 可以将取消错误收窄为 `CanceledError<T>`：

```ts
const controller = new AbortController();

try {
  await axios.get<User>("/user?ID=12345", { signal: controller.signal });
} catch (error) {
  if (axios.isCancel<User>(error)) {
    handleCancellation(error);
  }
}
```

## 带类型的实例与拦截器

将 `axios.create` 的结果标注为 `AxiosInstance`，并将请求拦截器标注为 `InternalAxiosRequestConfig`，即可对自定义客户端实现端到端的类型检查：

```ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const apiClient: AxiosInstance = axios.create({
  baseURL: "https://api.example.com",
  timeout: 10000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 添加认证令牌、记录日志等
  return config;
});
```

## 为响应数据添加类型

axios 的请求方法对响应数据类型是泛型的。向 `axios.get<T>`（以及其他别名）传入类型参数即可为 `response.data` 添加类型：

```ts
interface User {
  id: number;
  name: string;
}

const { data } = await apiClient.get<User>("/users/1");
// `data` 的类型为 `User`
```
