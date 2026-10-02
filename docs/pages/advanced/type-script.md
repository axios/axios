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

## Typing request data and query params

`AxiosRequestConfig<D = any, P = any>` uses `D` for request data and `P` for query params. A custom params serializer receives the same `P`:

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
  // @ts-expect-error `query` must be a string
  params: { query: 123 },
};
```

Default request results preserve `D` and `P` on `response.config`, including when request aliases infer those types from a typed request config. `RawAxiosRequestConfig`, `InternalAxiosRequestConfig`, `AxiosDefaults`, `CreateAxiosDefaults`, `AxiosResponse`, `AxiosPromise`, `AxiosError`, `CanceledError`, callable instances, adapters, and `mergeConfig()` carry the params type as well.

Request methods add `P` as the final generic—`<T, R, D, P>`—so the existing response data (`T`), custom response (`R`), and request data (`D`) positions remain unchanged. An explicitly supplied custom response type still controls the resolved value. `P` defaults to `any` for backward compatibility.

An adapter or another explicitly typed promise can preserve both request types:

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

## Symbol-keyed custom request config

axios preserves own enumerable symbol properties when it merges defaults and per-request config. Applications can module-augment `AxiosRequestConfig` with a specific symbol key and read the option from `InternalAxiosRequestConfig` in an interceptor or adapter:

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

Only own enumerable symbol properties are copied. Non-enumerable and inherited symbol properties are not.

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
