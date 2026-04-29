# Authentication

Most APIs require some form of authentication. This page covers the most common patterns for attaching credentials to axios requests.

## Bearer tokens (JWT)

The most common approach is to attach a JWT in the `Authorization` header. The cleanest way to do this is via a request interceptor on your axios instance, so the token is read fresh on every request:

```js
import axios from "axios";

const api = axios.create({ baseURL: "https://api.example.com" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});
```

## HTTP Basic auth

For APIs that use HTTP Basic authentication, pass the `auth` option. axios will encode the credentials and set the `Authorization` header automatically:

```js
const response = await axios.get("https://api.example.com/data", {
  auth: {
    username: "myUser",
    password: "myPassword",
  },
});
```

::: tip
For Bearer tokens and API keys, use a custom `Authorization` header rather than the `auth` option — `auth` is only for HTTP Basic.
:::

## API keys

API keys are typically passed as a header or a query parameter, depending on what the API expects:

```js
// As a header
const api = axios.create({
  baseURL: "https://api.example.com",
  headers: { "X-API-Key": "your-api-key-here" },
});

// As a query parameter
const response = await axios.get("https://api.example.com/data", {
  params: { apiKey: "your-api-key-here" },
});
```

## Token refresh

When access tokens expire, you need to silently refresh them and retry the failed request. A response interceptor is the right place to implement this:

```js
import axios from "axios";

const api = axios.create({ baseURL: "https://api.example.com" });

// Track whether a refresh is already in progress to avoid parallel refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post("/auth/refresh", {
          refreshToken: localStorage.getItem("refresh_token"),
        });

        const newToken = data.access_token;
        localStorage.setItem("access_token", newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Redirect to login or emit an event
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

## Cookie-based authentication

For session-based APIs that rely on cookies, set `withCredentials: true` to include cookies in cross-origin requests:

```js
const api = axios.create({
  baseURL: "https://api.example.com",
  withCredentials: true, // send cookies with every request
});
```

::: warning
`withCredentials: true` requires the server to respond with `Access-Control-Allow-Credentials: true` and a specific (non-wildcard) `Access-Control-Allow-Origin`.
:::
