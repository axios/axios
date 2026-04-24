# API 参考

以下是 axios 包中所有可用函数和类的列表。这些函数可在你的项目中使用和导入。所有函数和类均受我们遵循语义化版本的承诺保护，即在未发布主版本变更的情况下，这些 API 将保持稳定不变。

## 实例

`axios` 实例是你用于发起 HTTP 请求的主要对象，它是一个创建 `Axios` 类新实例的工厂函数。`axios` 实例提供了多个请求方法，详见文档的[请求别名](/pages/advanced/request-method-aliases)章节。

## 类

### `Axios`

`Axios` 类是发起 HTTP 请求的核心类，是一个创建 `Axios` 类新实例的工厂函数。该类提供多个 HTTP 请求方法，详见文档的[请求别名](/pages/advanced/request-method-aliases)章节。

#### `constructor`

创建一个新的 `Axios` 实例，构造函数接受一个可选的配置对象作为参数。

```ts
constructor(instanceConfig?: AxiosRequestConfig);
```

#### `request`

处理请求调用和响应解析，是发起 HTTP 请求的核心方法。接受一个配置对象作为参数，返回一个解析为响应对象的 Promise。

```ts
request(configOrUrl: string | AxiosRequestConfig<D>, config: AxiosRequestConfig<D>): Promise<AxiosResponse<T>>;
```

### `CancelToken` <Badge type="danger" text="已废弃，请改用 AbortController" />

`CancelToken` 类基于 `tc39/proposal-cancelable-promises` 提案，用于创建可取消 HTTP 请求的令牌。该类现已废弃，推荐使用 `AbortController` API。

从 0.22.0 版本起，`CancelToken` 类已废弃，将在未来版本中移除。建议改用 `AbortController` API。

该类主要为了向后兼容而保留导出，未来将被移除。我们强烈不建议在新项目中使用，因此不再对其 API 进行文档说明。

## 函数

### `AxiosError`

`AxiosError` 类是 HTTP 请求失败时抛出的错误类，继承自 `Error` 类并添加了额外属性。

#### `constructor`

创建一个新的 `AxiosError` 实例，构造函数接受可选的 message、code、config、request 和 response 作为参数。

```ts
constructor(message?: string, code?: string, config?: InternalAxiosRequestConfig<D>, request?: any, response?: AxiosResponse<T, D>);
```

#### `properties`

`AxiosError` 类提供以下属性：

```ts
// 配置实例。
config?: InternalAxiosRequestConfig<D>;

// 错误代码。
code?: string;

// 请求实例。
request?: any;

// 响应实例。
response?: AxiosResponse<T, D>;

// 表示该错误是否为 AxiosError 的布尔值。
isAxiosError: boolean;

// 错误状态码。
status?: number;

// 将错误转换为 JSON 对象的辅助方法。
toJSON: () => object;

// 错误原因。
cause?: Error;
```

### `AxiosHeaders`

`AxiosHeaders` 类是用于管理 HTTP 请求头的工具类，提供添加、删除和获取请求头等操作方法。

此处仅列出主要方法，完整方法列表请参阅类型声明文件。

#### `constructor`

创建一个新的 `AxiosHeaders` 实例，构造函数接受一个可选的请求头对象作为参数。

```ts
constructor(headers?: RawAxiosHeaders | AxiosHeaders | string);
```

#### `set`

向请求头对象添加一个请求头。

```ts
set(headerName?: string, value?: AxiosHeaderValue, rewrite?: boolean | AxiosHeaderMatcher): AxiosHeaders;
set(headers?: RawAxiosHeaders | AxiosHeaders | string, rewrite?: boolean): AxiosHeaders;
```

#### `get`

从请求头对象获取一个请求头。

```ts
get(headerName: string, parser: RegExp): RegExpExecArray | null;
get(headerName: string, matcher?: true | AxiosHeaderParser): AxiosHeaderValue;
```

#### `has`

检查请求头对象中是否存在某个请求头。

```ts
has(header: string, matcher?: AxiosHeaderMatcher): boolean;
```

#### `delete`

从请求头对象移除一个请求头。

```ts
delete(header: string | string[], matcher?: AxiosHeaderMatcher): boolean;
```

#### `clear`

从请求头对象移除所有请求头。

```ts
clear(matcher?: AxiosHeaderMatcher): boolean;
```

#### `normalize`

规范化请求头对象。

```ts
normalize(format: boolean): AxiosHeaders;
```

#### `concat`

合并多个请求头对象。

```ts
concat(...targets: Array<AxiosHeaders | RawAxiosHeaders | string | undefined | null>): AxiosHeaders;
```

#### `toJSON`

将请求头对象转换为 JSON 对象。

```ts
toJSON(asStrings?: boolean): RawAxiosHeaders;
```

### `CanceledError` <Badge type="tip" text="继承自 AxiosError" />

`CanceledError` 类是 HTTP 请求被取消时抛出的错误类，继承自 `AxiosError` 类。

### `Cancel` <Badge type="tip" text="CanceledError 的别名" />

`Cancel` 类是 `CanceledError` 类的别名，为向后兼容而保留导出，将在未来版本中移除。

### `isCancel`

检查某个错误是否为 `CanceledError` 的函数，可用于区分主动取消和意外错误。

```ts
isCancel(value: any): boolean;
```

```js
import axios from "axios";

const controller = new AbortController();

axios.get("/api/data", { signal: controller.signal }).catch((error) => {
  if (axios.isCancel(error)) {
    console.log("Request was cancelled:", error.message);
  } else {
    console.error("Unexpected error:", error);
  }
});

controller.abort("User navigated away");
```

### `isAxiosError`

检查某个错误是否为 `AxiosError` 的函数。在 `catch` 块中使用此函数，可安全访问 axios 特有的错误属性，如 `error.response` 和 `error.config`。

```ts
isAxiosError(value: any): value is AxiosError;
```

```js
import axios from "axios";

try {
  await axios.get("/api/resource");
} catch (error) {
  if (axios.isAxiosError(error)) {
    // error.response、error.config、error.code 均可使用
    console.error("HTTP error", error.response?.status, error.message);
  } else {
    // 非 axios 错误（例如编程错误）
    throw error;
  }
}
```

### `all` <Badge type="danger" text="已废弃，请改用 Promise.all" />

`all` 函数接受一组 Promise 并返回一个在所有 Promise 都完成后才完成的单一 Promise，现已废弃，推荐使用 `Promise.all` 方法。

从 0.22.0 版本起，`all` 函数已废弃，将在未来版本中移除。建议改用 `Promise.all` 方法。

### `spread`

`spread` 函数可将一个参数数组展开为函数调用的多个参数，在你需要将数组参数传递给接收多个参数的函数时非常实用。

```ts
spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
```

### `toFormData`

将普通 JavaScript 对象（包括嵌套对象）转换为 `FormData` 实例，在需要从对象中以编程方式构建 multipart 表单数据时非常实用。

```ts
toFormData(sourceObj: object, formData?: FormData, options?: FormSerializerOptions): FormData;
```

```js
import { toFormData } from "axios";

const data = { name: "Jay", avatar: fileBlob };
const form = toFormData(data);
// form 现在是一个可直接发送的 FormData 实例
await axios.post("/api/users", form);
```

### `formToJSON`

将 `FormData` 实例转换回普通 JavaScript 对象，在需要以结构化格式读取表单数据时非常实用。

```ts
formToJSON(form: FormData): object;
```

```js
import { formToJSON } from "axios";

const form = new FormData();
form.append("name", "Jay");
form.append("role", "admin");

const obj = formToJSON(form);
console.log(obj); // { name: "Jay", role: "admin" }
```

### `getAdapter`

通过名称或名称数组解析并返回一个适配器函数。axios 在内部使用此函数为当前环境选择最合适的适配器。

```ts
getAdapter(adapters: string | string[]): AxiosAdapter;
```

```js
import { getAdapter } from "axios";

// 显式获取 fetch 适配器
const fetchAdapter = getAdapter("fetch");

// 按优先级列表获取最合适的适配器
const adapter = getAdapter(["fetch", "xhr", "http"]);
```

### `mergeConfig`

合并两个 axios 配置对象，使用与 axios 内部合并默认配置和请求级选项相同的深度合并策略。后者的值优先级更高。

```ts
mergeConfig<T>(config1: AxiosRequestConfig<T>, config2: AxiosRequestConfig<T>): AxiosRequestConfig<T>;
```

```js
import { mergeConfig } from "axios";

const base = { baseURL: "https://api.example.com", timeout: 5000 };
const override = { timeout: 10000, headers: { "X-Custom": "value" } };

const merged = mergeConfig(base, override);
// { baseURL: "https://api.example.com", timeout: 10000, headers: { "X-Custom": "value" } }
```

## 常量

### `HttpStatusCode`

包含 HTTP 状态码命名常量的对象，可用于编写更具可读性的条件判断，避免直接使用数字字面量。

```js
import axios, { HttpStatusCode } from "axios";

try {
  const response = await axios.get("/api/resource");
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === HttpStatusCode.NotFound) {
      console.error("Resource not found");
    } else if (error.response?.status === HttpStatusCode.Unauthorized) {
      console.error("Authentication required");
    }
  }
}
```

## 其他

### `VERSION`

`axios` 包的当前版本号字符串，随每次发布更新。
