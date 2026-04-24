# Adaptador Fetch <Badge type="tip" text="Nuevo" />

El adaptador `fetch` es un nuevo adaptador que introdujimos a partir de la versión 1.7.0. Proporciona una forma de usar axios con la API `fetch`, dándote lo mejor de ambos mundos. De forma predeterminada, `fetch` se usará si los adaptadores `xhr` y `http` no están disponibles en la compilación o no son compatibles con el entorno. Para usarlo de forma predeterminada, debe seleccionarse explícitamente estableciendo la opción `adapter` en `fetch` al crear una instancia de axios.

```js
import axios from 'axios';

const instance = axios.create({
  adapter: 'fetch',
});
```

El adaptador admite la misma funcionalidad que el adaptador `xhr`, incluyendo la captura del progreso de carga y descarga. También admite tipos de respuesta adicionales como `stream` y `formdata` (si el entorno lo soporta).

## Fetch personalizado <Badge type="tip" text="v1.12.0+" />

A partir de `v1.12.0`, puedes personalizar el adaptador fetch para que use una función `fetch` personalizada en lugar de la global del entorno. Puedes pasar una función `fetch` personalizada, y los constructores `Request` y `Response` a través de la opción de configuración `env`. Esto es útil cuando trabajas con entornos personalizados o frameworks de aplicación que proporcionan su propia implementación de `fetch`.

::: info
Al usar una función `fetch` personalizada, es posible que también necesites proporcionar constructores `Request` y `Response` correspondientes. Si los omites, se usarán los constructores globales. Si tu `fetch` personalizado es incompatible con los globales, pasa `null` para deshabilitarlos.

**Nota:** Establecer `Request` y `Response` en `null` hará imposible que el adaptador fetch capture el progreso de carga y descarga.
:::

### Ejemplo básico

```js
import customFetchFunction from 'customFetchModule';

const instance = axios.create({
  adapter: 'fetch',
  onDownloadProgress(e) {
    console.log('downloadProgress', e);
  },
  env: {
    fetch: customFetchFunction,
    Request: null, // null -> disable the constructor
    Response: null,
  },
});
```

### Usando con Tauri

[Tauri](https://tauri.app/plugin/http-client/) proporciona una función `fetch` de plataforma que omite las restricciones CORS del navegador para las solicitudes realizadas desde la capa nativa. El ejemplo a continuación muestra una configuración mínima para usar axios dentro de una aplicación Tauri con ese fetch personalizado.

```js
import { fetch } from '@tauri-apps/plugin-http';
import axios from 'axios';

const instance = axios.create({
  adapter: 'fetch',
  onDownloadProgress(e) {
    console.log('downloadProgress', e);
  },
  env: {
    fetch,
  },
});

const { data } = await instance.get('https://google.com');
```

### Usando con SvelteKit

[SvelteKit](https://svelte.dev/docs/kit/web-standards#Fetch-APIs) proporciona una implementación personalizada de `fetch` para las funciones `load` del lado del servidor que gestiona el reenvío de cookies y URLs relativas. Dado que su `fetch` es incompatible con la API estándar de `URL`, axios debe configurarse para usarlo explícitamente, y los constructores globales `Request` y `Response` deben deshabilitarse.

```js
export async function load({ fetch }) {
  const { data: post } = await axios.get('https://jsonplaceholder.typicode.com/posts/1', {
    adapter: 'fetch',
    env: {
      fetch,
      Request: null,
      Response: null,
    },
  });

  return { post };
}
```
