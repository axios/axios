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

## 为请求数据和查询参数添加类型

`AxiosRequestConfig<D = any, P = any>` 使用 `D` 表示请求数据，使用 `P` 表示查询参数。自定义参数序列化器会接收同一个 `P` 类型：

```ts
import axios, {
  type AxiosPromise,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

interface RequestBody {
  includeArchived: boolean;
}

interface SearchParams {
  query: string;
  page?: number;
}

interface SearchResponse {
  results: string[];
}

const searchConfig: AxiosRequestConfig<RequestBody, SearchParams> = {
  data: { includeArchived: false },
  params: { query: "axios", page: 1 },
  paramsSerializer: (params) => `${params.query}:${params.page ?? 1}`,
};

const response = await axios.get("/search", searchConfig);
response.config.data;   // RequestBody | undefined
response.config.params; // SearchParams | undefined

const invalidConfig: AxiosRequestConfig<RequestBody, SearchParams> = {
  // @ts-expect-error `query` 必须是字符串
  params: { query: 123 },
};
```

默认请求结果会在 `response.config` 上保留 `D` 和 `P`，包括请求别名从带类型的请求配置中推断出这些类型的情况。`RawAxiosRequestConfig`、`InternalAxiosRequestConfig`、`AxiosDefaults`、`CreateAxiosDefaults`、`AxiosResponse`、`AxiosPromise`、`AxiosError`、`CanceledError`、可调用实例、适配器和 `mergeConfig()` 也会保留查询参数类型。

请求方法将 `P` 添加为最后一个泛型参数，即 `<T, R, D, P>`，因此现有的响应数据（`T`）、自定义响应（`R`）和请求数据（`D`）参数位置保持不变。显式提供的自定义响应类型仍然控制最终返回值。为保持向后兼容，`P` 默认为 `any`。

适配器或其他显式添加类型的 Promise 可以同时保留两种请求类型：

```ts
const searchAdapter = (
  config: InternalAxiosRequestConfig<RequestBody, SearchParams>
): AxiosPromise<SearchResponse, RequestBody, SearchParams> =>
  Promise.resolve({
    data: { results: [] },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });

declare const error: unknown;

if (axios.isCancel<SearchResponse, RequestBody, SearchParams>(error)) {
  error.config?.data;   // RequestBody | undefined
  error.config?.params; // SearchParams | undefined
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

## 使用 Symbol 键的自定义请求配置

axios 合并默认配置和单次请求配置时，会保留自身的、可枚举的 Symbol 属性。应用可以通过模块扩充为 `AxiosRequestConfig` 添加特定的 Symbol 键，然后在拦截器或适配器的 `InternalAxiosRequestConfig` 中读取该选项：

```ts
import axios from "axios";

export const someFlag: unique symbol = Symbol(
  "some flag used in request interceptor"
);

declare module "axios" {
  interface AxiosRequestConfig<D = any, P = any> {
    [someFlag]?: boolean;
  }
}

axios.interceptors.request.use((config) => {
  if (config[someFlag]) {
    config.headers.set("X-Some-Flag", "enabled");
  }
  return config;
});

await axios.get("/users", { [someFlag]: true });
```

只有自身的、可枚举的 Symbol 属性会被复制；不可枚举或继承的 Symbol 属性不会被复制。

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
