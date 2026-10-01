# Crear una instancia

`axios.create()` te permite crear una instancia de axios preconfigurada. La instancia comparte la misma API de solicitud y respuesta que el objeto `axios` predeterminado, pero utiliza la configuración que proporciones como base para cada solicitud. Esta es la forma recomendada de usar axios en cualquier aplicación que conste de más de un solo archivo.

```ts
import axios from "axios";

const instance = axios.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
  headers: { "X-Custom-Header": "foobar" },
});
```

El método `create` acepta el objeto completo de [Configuración de solicitud](/pages/advanced/request-config). Luego puedes usar la instancia igual que el objeto axios predeterminado:

```js
const response = await instance.get("/users/1");
```

## ¿Por qué usar una instancia?

### URL base por servicio

En la mayoría de las aplicaciones se interactúa con más de una API. Crear una instancia separada por servicio evita repetir la URL base en cada llamada:

```js
const githubApi = axios.create({ baseURL: "https://api.github.com" });
const internalApi = axios.create({ baseURL: "https://api.internal.example.com" });

const { data: repos } = await githubApi.get("/users/axios/repos");
const { data: users } = await internalApi.get("/users");
```

### Encabezados de autenticación compartidos

Adjunta un token de autenticación a cada solicitud de una instancia sin afectar a las demás:

```js
const authApi = axios.create({
  baseURL: "https://api.example.com",
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});
```

### Tiempos de espera y reintentos por servicio

Los distintos servicios tienen características de fiabilidad diferentes. Define un tiempo de espera corto para servicios en tiempo real y uno más largo para trabajos por lotes:

```js
const realtimeApi = axios.create({ baseURL: "https://realtime.example.com", timeout: 2000 });
const batchApi    = axios.create({ baseURL: "https://batch.example.com",    timeout: 60000 });
```

### Interceptores aislados

Los interceptores añadidos a una instancia solo se aplican a esa instancia, manteniendo tus responsabilidades separadas:

```js
const loggingApi = axios.create({ baseURL: "https://api.example.com" });

loggingApi.interceptors.request.use((config) => {
  console.log(`→ ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});
```

## Sobreescribir los valores predeterminados por solicitud

La configuración pasada en el momento de la solicitud siempre tiene prioridad sobre los valores predeterminados de la instancia:

```js
const api = axios.create({ timeout: 5000 });

// This specific request uses a 30-second timeout instead
await api.get("/slow-endpoint", { timeout: 30000 });
```

::: tip
Los valores predeterminados de la instancia también pueden cambiarse después de su creación escribiendo en `instance.defaults`:

```js
instance.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
```
:::
