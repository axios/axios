# TypeScript example

## Importing types

axios ships with TypeScript definitions out of the box. You can import the types you need directly from `"axios"`:

```ts
import axios from "axios";
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
```

## Typing a request

Use a generic type parameter on the response to tell TypeScript what shape your data will have:

```ts
import axios from "axios";

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

const response = await axios.get<Post>("https://jsonplaceholder.typicode.com/posts/1");

console.log(response.data.title); // TypeScript knows this is a string
```

## Typing a function

Wrap requests in functions with explicit return types for maximum type safety:

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

## Typing a POST request

You can type both the request body and the expected response:

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

## Typed axios instance

Create a typed instance so your base URL and headers are baked in:

```ts
import axios from "axios";
import type { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
});
```

## Typed interceptors

Use `InternalAxiosRequestConfig` (not `AxiosRequestConfig`) for request interceptors in v1.x:

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

## Typing errors

Use `axios.isAxiosError()` to narrow the type of a caught error:

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
    // error.response?.data is typed as ApiError
    console.error(error.response?.data.message);
    console.error(error.response?.status);
  } else {
    throw error;
  }
}
```

## TypeScript configuration notes

Because axios dual-publishes ESM and CJS, there are a few caveats depending on your setup:

- The recommended setting is `"moduleResolution": "node16"` (implied by `"module": "node16"`). This requires TypeScript 4.7 or greater.
- If you compile TypeScript to CJS and cannot use `"moduleResolution": "node16"`, enable `"esModuleInterop": true`.
- If you use TypeScript to type-check CJS JavaScript code, your only option is `"moduleResolution": "node16"`.
