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

Si no se proporciona `auth`, los adaptadores HTTP de Node.js y fetch también pueden obtener credenciales Basic desde la URL de la solicitud, por ejemplo `https://myUser:myPassword@api.example.com/data`. Las credenciales codificadas con porcentaje en la URL se decodifican antes de generar el encabezado `Authorization`. Para código nuevo, prefiere la opción explícita `auth`; tiene prioridad sobre las credenciales incluidas en la URL.

### Nombres de usuario UTF-8

De forma predeterminada, los adaptadores XHR y fetch mantienen su manejo existente de nombres de usuario por compatibilidad:

- El adaptador XHR envía el nombre de usuario como caracteres heredados de un solo byte (Latin-1) y la contraseña como UTF-8.
- El adaptador fetch envía credenciales UTF-8, pero rechaza nombres de usuario que contengan caracteres por encima de U+00FF.

En ambos adaptadores, un nombre de usuario no admitido se rechaza con `ERR_BAD_OPTION_VALUE`. Si tu servidor espera nombres de usuario Basic auth en UTF-8, establece `transitional.encodeBasicAuthUsername: true` por solicitud o en una instancia:

```js
await axios.get('/account', {
  auth: { username: 'π', password: 'secret' },
  transitional: { encodeBasicAuthUsername: true },
});
```

Un `false` a nivel de solicitud anula la activación en la instancia, por ejemplo para un endpoint XHR heredado que espera bytes Latin-1 en el nombre de usuario:

```js
const api = axios.create({
  transitional: { encodeBasicAuthUsername: true },
});

await api.get('/legacy/account', {
  auth: { username: 'café', password: 'secret' },
  transitional: { encodeBasicAuthUsername: false },
});
```

Ten en cuenta lo siguiente:

- Si actualmente conviertes tú mismo los nombres de usuario a cadenas de bytes UTF-8, elimina esa conversión al activar la opción para evitar una doble codificación.
- No actives la opción para servidores XHR que esperan bytes Latin-1 heredados en el nombre de usuario.
- Establecer la opción en `false` no hace que los adaptadores fetch o HTTP de Node.js envíen Latin-1.
- La opción no afecta al adaptador HTTP de Node.js ni a las credenciales incluidas en la URL de una solicitud fetch.
- Los nombres de usuario ASCII y vacíos se codifican igual en ambos casos. Las cadenas UTF-16 malformadas siguen rechazándose con `ERR_BAD_OPTION_VALUE`.
- axios no negocia el conjunto de caracteres a partir del desafío de autenticación del servidor ni normaliza cadenas Unicode.

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
