# Alias de solicitud

axios proporciona un conjunto de alias para realizar solicitudes HTTP. Estos alias son atajos para hacer solicitudes usando el método `request`. Están diseñados para ser fáciles de usar y ofrecer una forma más conveniente de hacer solicitudes.

axios se esfuerza por seguir las RFC 7231 y RFC 5789 de la manera más fiel posible. Los alias están diseñados para ser consistentes con los métodos HTTP definidos en dichas RFC.

### `axios`

axios puede usarse para hacer una solicitud HTTP pasando únicamente el objeto de configuración. El objeto de configuración completo está documentado [aquí](/pages/advanced/request-config).

```ts
axios<T, R, D, P>(
  url: string | AxiosRequestConfig<D, P>,
  config?: AxiosRequestConfig<D, P>
): Promise<R>;
```

Los métodos de solicitud usan parámetros genéricos en el orden `<T, R, D, P>`: datos de respuesta, respuesta personalizada, datos de solicitud y parámetros de consulta. `P` se añade al final para conservar el significado de los argumentos explícitos `T`, `R` y `D`. Si no proporcionas un `R` personalizado, el `AxiosResponse` predeterminado conserva `D` y `P` en `response.config`.

## Alias de método

Los siguientes alias están disponibles para hacer solicitudes:

### `request`

El método `request` es el método principal que usarás para hacer solicitudes HTTP. Acepta un objeto de configuración como argumento y devuelve una Promise que se resuelve en el objeto de respuesta. Es un método genérico que puede usarse para cualquier tipo de solicitud HTTP.

```ts
axios.request<T, R, D, P>(config: AxiosRequestConfig<D, P>): Promise<R>;
```

### `get`

El método `get` se usa para hacer una solicitud GET. Acepta una URL y un objeto de configuración opcional como argumentos, y devuelve una Promise que se resuelve en el objeto de respuesta.

```ts
axios.get<T, R, D, P>(url: string, config?: AxiosRequestConfig<D, P>): Promise<R>;
```

### `delete`

El método `delete` se usa para hacer una solicitud DELETE. Acepta una URL y un objeto de configuración opcional como argumentos, y devuelve una Promise que se resuelve en el objeto de respuesta.

```ts
axios.delete<T, R, D, P>(url: string, config?: AxiosRequestConfig<D, P>): Promise<R>;
```

### `head`

El método `head` se usa para hacer una solicitud HEAD. Acepta una URL y un objeto de configuración opcional como argumentos, y devuelve una Promise que se resuelve en el objeto de respuesta.

```ts
axios.head<T, R, D, P>(url: string, config?: AxiosRequestConfig<D, P>): Promise<R>;
```

### `options`

El método `options` se usa para hacer una solicitud OPTIONS. Acepta una URL y un objeto de configuración opcional como argumentos, y devuelve una Promise que se resuelve en el objeto de respuesta.

```ts
axios.options<T, R, D, P>(url: string, config?: AxiosRequestConfig<D, P>): Promise<R>;
```

### `post`

El método `post` se usa para hacer una solicitud POST. Acepta una URL, un objeto de datos opcional y un objeto de configuración opcional como argumentos, y devuelve una Promise que se resuelve en el objeto de respuesta.

```ts
axios.post<T, R, D, P>(url: string, data?: D, config?: AxiosRequestConfig<D, P>): Promise<R>;
```

### `put`

El método `put` se usa para hacer una solicitud PUT. Acepta una URL, un objeto de datos opcional y un objeto de configuración opcional como argumentos, y devuelve una Promise que se resuelve en el objeto de respuesta.

```ts
axios.put<T, R, D, P>(url: string, data?: D, config?: AxiosRequestConfig<D, P>): Promise<R>;
```

### `patch`

El método `patch` se usa para hacer una solicitud PATCH. Acepta una URL, un objeto de datos opcional y un objeto de configuración opcional como argumentos, y devuelve una Promise que se resuelve en el objeto de respuesta.

```ts
axios.patch<T, R, D, P>(url: string, data?: D, config?: AxiosRequestConfig<D, P>): Promise<R>;
```

### `query`

El método `query` se usa para hacer una solicitud QUERY, un método seguro e idempotente que transporta un cuerpo. Acepta una URL, un objeto de datos opcional y un objeto de configuración opcional como argumentos, y devuelve una Promise que se resuelve en el objeto de respuesta. Úsalo para operaciones de tipo lectura cuyos parámetros sean demasiado complejos o sensibles para ir en la URL.

```ts
axios.query<T, R, D, P>(url: string, data?: D, config?: AxiosRequestConfig<D, P>): Promise<R>;
```

```js
// Enviar un filtro de búsqueda complejo como cuerpo de la solicitud
const { data } = await axios.query("/api/search", {
  selector: ["name", "email"],
  filter: { active: true, role: "admin" },
});
```

::: warning Especificación en borrador
El método QUERY está definido por un [Internet-Draft](https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/) del IETF y todavía no ha sido estandarizado. La semántica e incluso el propio nombre del método pueden cambiar antes de la publicación final, y el soporte en servidores, proxies y CDN es desigual. Verifica que tu infraestructura acepte `QUERY` de extremo a extremo antes de usarlo en producción.
:::

### `getUri`

El método `getUri` devuelve la URL que se enviaría para una configuración dada sin realizar realmente la solicitud. Aplica `baseURL`, `paramsSerializer` y `params`, así que recibes la misma cadena que axios pondría en el cable. Útil para construir enlaces, depurar la serialización o reutilizar la URL resuelta en otra solicitud.

```ts
axios.getUri(config?: AxiosRequestConfig<D, P>): string;
```

```js
const url = axios.getUri({
  url: "/users",
  baseURL: "https://api.example.com",
  params: { active: true, role: "admin" },
});
// "https://api.example.com/users?active=true&role=admin"
```

::: tip
Usa `getUri` en una instancia (`instance.getUri(config)`) para heredar los valores predeterminados de `baseURL`, `params` y `paramsSerializer` de la instancia.
:::

## Métodos abreviados para datos de formulario

Estos métodos son equivalentes a sus contrapartes anteriores, pero predefinen `Content-Type` como `multipart/form-data`. Son la forma recomendada de subir archivos o enviar formularios HTML.

### `postForm`

```ts
axios.postForm<T, R, D, P>(url: string, data?: D, config?: AxiosRequestConfig<D, P>): Promise<R>;
```

```js
// Upload a file from a browser file input
await axios.postForm("/api/upload", {
  file: document.querySelector("#fileInput").files[0],
  description: "Profile photo",
});
```

### `putForm`

```ts
axios.putForm<T, R, D, P>(url: string, data?: D, config?: AxiosRequestConfig<D, P>): Promise<R>;
```

```js
// Replace a resource with form data
await axios.putForm("/api/users/1/avatar", {
  avatar: document.querySelector("#avatarInput").files[0],
});
```

### `patchForm`

```ts
axios.patchForm<T, R, D, P>(url: string, data?: D, config?: AxiosRequestConfig<D, P>): Promise<R>;
```

```js
// Update specific fields using form data
await axios.patchForm("/api/users/1", {
  displayName: "New Name",
  avatar: document.querySelector("#avatarInput").files[0],
});
```

::: tip
`postForm`, `putForm` y `patchForm` aceptan los mismos tipos de datos que sus métodos base: objetos planos, `FormData`, `FileList` y `HTMLFormElement`. Consulta [Publicación de archivos](/pages/advanced/file-posting) para más ejemplos.
:::
