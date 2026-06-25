# TypeScript

`axios` ships TypeScript definitions in the npm package via `index.d.ts` (ESM) and `index.d.cts` (CJS), so type checking and editor support work out of the box for both module formats.

## Module resolution caveats

Because axios dual-publishes with an ESM default export and a CJS `module.exports`, there are a few configuration caveats:

- The recommended setting is `"moduleResolution": "node16"` (implied by `"module": "node16"`). This requires TypeScript 4.7 or greater.
- If you use ESM, your settings should be fine.
- If you compile TypeScript to CJS and you can't use `"moduleResolution": "node16"`, you must enable `esModuleInterop`.
- If you use TypeScript to type-check CJS JavaScript code, your only option is `"moduleResolution": "node16"`.

## Type guards for axios errors

Use the `axios.isAxiosError` type guard to safely narrow `unknown` errors in `catch` blocks. After narrowing, you can access axios-specific properties like `error.response`, `error.config`, and `error.code` with full type safety.

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

Use `axios.isCancel<T>()` to narrow cancellation errors to `CanceledError<T>`:

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

## Typed instances and interceptors

Annotate the result of `axios.create` with `AxiosInstance`, and annotate request interceptors with `InternalAxiosRequestConfig` to get end-to-end type checking on a custom client:

```ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const apiClient: AxiosInstance = axios.create({
  baseURL: "https://api.example.com",
  timeout: 10000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Add auth token, log, etc.
  return config;
});
```

## Typing response data

Axios request methods are generic over the response data type. Pass a type parameter to `axios.get<T>` (and the other aliases) to type `response.data`:

```ts
interface User {
  id: number;
  name: string;
}

const { data } = await apiClient.get<User>("/users/1");
// `data` is typed as `User`
```
