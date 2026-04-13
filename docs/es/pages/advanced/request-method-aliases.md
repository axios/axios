# Alias de solicitud

axios proporciona un conjunto de alias para realizar solicitudes HTTP. Estos alias son atajos para hacer solicitudes usando el método `request`. Están diseñados para ser fáciles de usar y ofrecer una forma más conveniente de hacer solicitudes.

axios se esfuerza por seguir las RFC 7231 y RFC 5789 de la manera más fiel posible. Los alias están diseñados para ser consistentes con los métodos HTTP definidos en dichas RFC.

### `axios`

axios puede usarse para hacer una solicitud HTTP pasando únicamente el objeto de configuración. El objeto de configuración completo está documentado [aquí](/pages/advanced/request-config).

```ts
axios(url: string | AxiosRequestConfig, config?: AxiosRequestConfig);
```

## Alias de método

Los siguientes alias están disponibles para hacer solicitudes:

### `request`

El método `request` es el método principal que usarás para hacer solicitudes HTTP. Acepta un objeto de configuración como argumento y devuelve una Promise que se resuelve en el objeto de respuesta. Es un método genérico que puede usarse para cualquier tipo de solicitud HTTP.

```ts
axios.request(config: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `get`

El método `get` se usa para hacer una solicitud GET. Acepta una URL y un objeto de configuración opcional como argumentos, y devuelve una Promise que se resuelve en el objeto de respuesta.

```ts
axios.get(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `delete`

El método `delete` se usa para hacer una solicitud DELETE. Acepta una URL y un objeto de configuración opcional como argumentos, y devuelve una Promise que se resuelve en el objeto de respuesta.

```ts
axios.delete(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `head`

El método `head` se usa para hacer una solicitud HEAD. Acepta una URL y un objeto de configuración opcional como argumentos, y devuelve una Promise que se resuelve en el objeto de respuesta.

```ts
axios.head(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `options`

El método `options` se usa para hacer una solicitud OPTIONS. Acepta una URL y un objeto de configuración opcional como argumentos, y devuelve una Promise que se resuelve en el objeto de respuesta.

```ts
axios.options(url: string, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `post`

El método `post` se usa para hacer una solicitud POST. Acepta una URL, un objeto de datos opcional y un objeto de configuración opcional como argumentos, y devuelve una Promise que se resuelve en el objeto de respuesta.

```ts
axios.post(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `put`

El método `put` se usa para hacer una solicitud PUT. Acepta una URL, un objeto de datos opcional y un objeto de configuración opcional como argumentos, y devuelve una Promise que se resuelve en el objeto de respuesta.

```ts
axios.put(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

### `patch`

El método `patch` se usa para hacer una solicitud PATCH. Acepta una URL, un objeto de datos opcional y un objeto de configuración opcional como argumentos, y devuelve una Promise que se resuelve en el objeto de respuesta.

```ts
axios.patch(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

## Métodos abreviados para datos de formulario

Estos métodos son equivalentes a sus contrapartes anteriores, pero predefinen `Content-Type` como `multipart/form-data`. Son la forma recomendada de subir archivos o enviar formularios HTML.

### `postForm`

```ts
axios.postForm(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
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
axios.putForm(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
```

```js
// Replace a resource with form data
await axios.putForm("/api/users/1/avatar", {
  avatar: document.querySelector("#avatarInput").files[0],
});
```

### `patchForm`

```ts
axios.patchForm(url: string, data?: D, config?: AxiosRequestConfig<C>): AxiosResponse<R>;
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
