# Autenticación

La mayoría de las APIs requieren alguna forma de autenticación. Esta página cubre los patrones más comunes para adjuntar credenciales a las solicitudes de axios.

## Tokens Bearer (JWT)

El enfoque más común es adjuntar un JWT en el encabezado `Authorization`. La forma más limpia de hacerlo es a través de un interceptor de solicitud en tu instancia de axios, de manera que el token se lea de nuevo en cada solicitud:

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

## Autenticación HTTP Basic

Para APIs que usan autenticación HTTP Basic, pasa la opción `auth`. axios codificará las credenciales y establecerá el encabezado `Authorization` automáticamente:

```js
const response = await axios.get("https://api.example.com/data", {
  auth: {
    username: "myUser",
    password: "myPassword",
  },
});
```

::: tip
Para tokens Bearer y claves de API, usa un encabezado `Authorization` personalizado en lugar de la opción `auth` — `auth` es solo para HTTP Basic.
:::

## Claves de API

Las claves de API generalmente se pasan como un encabezado o como un parámetro de consulta, dependiendo de lo que espere la API:

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

## Renovación de token

Cuando los tokens de acceso expiran, es necesario renovarlos de forma silenciosa y reintentar la solicitud fallida. Un interceptor de respuesta es el lugar adecuado para implementar esto:

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

## Autenticación basada en cookies

Para APIs basadas en sesiones que dependen de cookies, establece `withCredentials: true` para incluir cookies en solicitudes de origen cruzado:

```js
const api = axios.create({
  baseURL: "https://api.example.com",
  withCredentials: true, // send cookies with every request
});
```

::: warning
`withCredentials: true` requiere que el servidor responda con `Access-Control-Allow-Credentials: true` y un valor específico (no comodín) en `Access-Control-Allow-Origin`.
:::
