# TypeScript 示例

## 导入类型

axios 内置了 TypeScript 类型定义，你可以直接从 `"axios"` 导入所需的类型：

```ts
import axios from "axios";
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
```

## 为请求标注类型

在响应上使用泛型参数，告知 TypeScript 数据的具体结构：

```ts
import axios from "axios";

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

const response = await axios.get<Post>("https://jsonplaceholder.typicode.com/posts/1");

console.log(response.data.title); // TypeScript 知道这是一个字符串
```

## 为函数标注类型

将请求封装在函数中，并明确声明返回类型，以获得最佳的类型安全性：

```ts
import axios, { AxiosResponse } from "axios";

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

const getPost = async (id: number): Promise<Post> => {
  const response = await axios.get<Post>(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );
  return response.data;
};
```

## 为 POST 请求标注类型

你可以同时为请求体和预期响应标注类型：

```ts
type CreatePostBody = {
  title: string;
  body: string;
  userId: number;
};

type CreatePostResponse = CreatePostBody & { id: number };

const createPost = async (data: CreatePostBody): Promise<CreatePostResponse> => {
  const response = await axios.post<CreatePostResponse>(
    "https://jsonplaceholder.typicode.com/posts",
    data
  );
  return response.data;
};
```

## 带类型的 axios 实例

创建一个带类型的实例，将 baseURL 和请求头内置其中：

```ts
import axios from "axios";
import type { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
});
```

## 带类型的拦截器

在 v1.x 中，请求拦截器应使用 `InternalAxiosRequestConfig`（而非 `AxiosRequestConfig`）：

```ts
import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse } from "axios";

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.set("Authorization", `Bearer ${getToken()}`);
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => Promise.reject(error)
);
```

## 为错误标注类型

使用 `axios.isAxiosError()` 对捕获的错误进行类型收窄：

```ts
import axios, { AxiosError } from "axios";

type ApiError = {
  message: string;
  code: number;
};

try {
  await axios.get("/api/protected-resource");
} catch (error) {
  if (axios.isAxiosError<ApiError>(error)) {
    // error.response?.data 的类型为 ApiError
    console.error(error.response?.data.message);
    console.error(error.response?.status);
  } else {
    throw error;
  }
}
```

## TypeScript 配置说明

由于 axios 同时发布了 ESM 和 CJS 版本，根据你的配置不同，可能存在以下注意事项：

- 推荐设置为 `"moduleResolution": "node16"`（由 `"module": "node16"` 隐式指定），需要 TypeScript 4.7 或更高版本。
- 如果你将 TypeScript 编译为 CJS 且无法使用 `"moduleResolution": "node16"`，请启用 `"esModuleInterop": true`。
- 如果你使用 TypeScript 对 CJS JavaScript 代码进行类型检查，则只能使用 `"moduleResolution": "node16"`。
