# Creating an instance

`axios.create()` lets you create a pre-configured axios instance. The instance shares the same request and response API as the default `axios` object, but uses the config you provide as its baseline for every request. This is the recommended way to use axios in any application larger than a single file.

```ts
import axios from "axios";

const instance = axios.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
  headers: { "X-Custom-Header": "foobar" },
});
```

The `create` method accepts the full [Request Config](/pages/advanced/request-config) object. You can then use the instance just like the default axios object:

```js
const response = await instance.get("/users/1");
```

## Why use an instance?

### Per-service base URL

In most apps you talk to more than one API. Creating a separate instance per service avoids repeating the base URL on every call:

```js
const githubApi = axios.create({ baseURL: "https://api.github.com" });
const internalApi = axios.create({ baseURL: "https://api.internal.example.com" });

const { data: repos } = await githubApi.get("/users/axios/repos");
const { data: users } = await internalApi.get("/users");
```

### Shared authentication headers

Attach an auth token to every request from one instance without touching others:

```js
const authApi = axios.create({
  baseURL: "https://api.example.com",
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});
```

### Per-service timeouts and retries

Different services have different reliability characteristics. Set a tight timeout for real-time services and a relaxed one for batch jobs:

```js
const realtimeApi = axios.create({ baseURL: "https://realtime.example.com", timeout: 2000 });
const batchApi    = axios.create({ baseURL: "https://batch.example.com",    timeout: 60000 });
```

### Isolated interceptors

Interceptors added to an instance only apply to that instance, keeping your concerns separate:

```js
const loggingApi = axios.create({ baseURL: "https://api.example.com" });

loggingApi.interceptors.request.use((config) => {
  console.log(`→ ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});
```

## Overriding defaults per request

Config passed at request time always overrides the instance defaults:

```js
const api = axios.create({ timeout: 5000 });

// This specific request uses a 30-second timeout instead
await api.get("/slow-endpoint", { timeout: 30000 });
```

::: tip
Instance defaults can also be changed after creation by writing to `instance.defaults`:

```js
instance.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
```
:::
