# Adaptador Fetch <Badge type="tip" text="Nuevo" />

El adaptador `fetch` es un nuevo adaptador que introdujimos a partir de la versión 1.7.0. Proporciona una forma de usar axios con la API `fetch`, dándote lo mejor de ambos mundos. De forma predeterminada, `fetch` se usará si los adaptadores `xhr` y `http` no están disponibles en la compilación o no son compatibles con el entorno. Para usarlo de forma predeterminada, debe seleccionarse explícitamente estableciendo la opción `adapter` en `fetch` al crear una instancia de axios.

```js
import axios from 'axios';

const instance = axios.create({
  adapter: 'fetch',
});
```

El adaptador admite la misma funcionalidad que el adaptador `xhr`, incluyendo la captura del progreso de carga y descarga. También admite tipos de respuesta adicionales como `stream` y `formdata` (si el entorno lo soporta).

Cuando `auth` se omite, el adaptador fetch puede leer credenciales de autenticación HTTP Basic desde la URL de la solicitud, por ejemplo `https://user:pass@example.com`. Las credenciales de URL codificadas con porcentaje se decodifican antes de generar el encabezado `Authorization`, y `auth` tiene prioridad sobre las credenciales incluidas en la URL.

## Límites de tamaño de respuesta

Cuando se establece `maxContentLength`, el adaptador fetch rechaza con `ERR_BAD_RESPONSE` si la respuesta supera el límite, incluso mientras se lee el cuerpo. El error conserva la `config` y la `request` actuales aunque el entorno de ejecución envuelva o descarte el error original del stream, por lo que no se informa como un error de red. A diferencia de un `ERR_BAD_RESPONSE` causado por un estado 5xx, un error por límite de tamaño no tiene `error.response`.

```js
try {
  await axios.get('https://example.com/large-file', {
    adapter: 'fetch',
    maxContentLength: 10 * 1024 * 1024, // 10 MB
  });
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_BAD_RESPONSE' && !error.response) {
      console.error('Response too large:', error.message);
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Network failure');
    }
  }
}
```

## Redirecciones

De forma predeterminada, el adaptador fetch deja que el entorno de ejecución siga las redirecciones. Establecer `maxRedirects: 0` solicita el modo de redirección manual de la plataforma (`redirect: 'manual'`). Lo que recibas entonces depende del entorno de ejecución de fetch:

- Node.js puede exponer el estado `3xx` y su encabezado `Location`. Con el `validateStatus` predeterminado, esta respuesta se rechaza; acepta los estados `3xx` para manejarla tú mismo.
- Los navegadores devuelven una redirección opaca con estado `0` y encabezados inaccesibles, por lo que no se puede leer la ubicación de destino.

```js
const response = await axios.get('https://example.com/old-path', {
  adapter: 'fetch',
  maxRedirects: 0,
  validateStatus: (status) => status < 400,
});

// En Node.js, por ejemplo: 301 'https://example.com/new-path'
console.log(response.status, response.headers.get('location'));
```

No dependas del comportamiento de Node.js en código para el navegador. Los valores positivos de `maxRedirects` no limitan el número de redirecciones en el adaptador fetch; solo `0` cambia su comportamiento.

## Fetch personalizado <Badge type="tip" text="v1.12.0+" />

A partir de `v1.12.0`, puedes personalizar el adaptador fetch para que use una función `fetch` personalizada en lugar de la global del entorno. Puedes pasar una función `fetch` personalizada, y los constructores `Request` y `Response` a través de la opción de configuración `env`. Esto es útil cuando trabajas con entornos personalizados o frameworks de aplicación que proporcionan su propia implementación de `fetch`.

::: info
Al usar una función `fetch` personalizada, es posible que también necesites proporcionar constructores `Request` y `Response` correspondientes. Si los omites, se usarán los constructores globales. Si tu `fetch` personalizado es incompatible con los globales, pasa `null` para deshabilitarlos.

**Nota:** Establecer `Request` y `Response` en `null` hará imposible que el adaptador fetch capture el progreso de carga y descarga.
:::

### Argumentos pasados a un fetch personalizado

Cuando hay un constructor `Request` disponible, axios llama a tu `fetch` con la `Request` completamente resuelta como primer argumento y una copia filtrada de `fetchOptions` como segundo. El segundo argumento conserva tus propios campos personalizados, pero omite los campos que axios gestiona a través de la `Request`: `method`, `headers`, `body`, `signal`, `duplex` y `credentials`. Lee esos valores desde la `Request`:

```js
const instance = axios.create({
  adapter: 'fetch',
  fetchOptions: { cache: 'no-store', tag: 'reports' },
  env: {
    fetch: (request, options) => {
      console.log(request.method, request.headers.get('content-type'));
      console.log(options.cache, options.tag); // 'no-store' 'reports'
      return fetch(request, options);
    },
  },
});
```

Cuando `Request` está deshabilitado (`Request: null`), axios llama en su lugar a `fetch(url, options)` con las opciones resueltas completas.

### Constructores `Response` personalizados

axios envuelve el cuerpo de la respuesta en un `ReadableStream<Uint8Array>` rastreado y lo pasa a `env.Response` cuando el entorno de ejecución admite streams de respuesta, la respuesta tiene cuerpo y se cumple alguna de las siguientes condiciones:

- `maxContentLength` está habilitado (un número mayor que `-1`), incluso sin una función de progreso;
- `onDownloadProgress` está establecido;
- `responseType` es `'stream'` o `'response'` y la solicitud usa un `signal`, `cancelToken` o `timeout`.

Un constructor `Response` personalizado debe aceptar ese stream y reenviarlo sin cambios; de lo contrario, los límites de tamaño, el progreso y el seguimiento de la cancelación no pueden funcionar. La firma TypeScript de `env.Response` conserva su tipo de cuerpo heredado por compatibilidad, por lo que un constructor que pasa la comprobación de tipos no garantiza que admita cuerpos de tipo stream en tiempo de ejecución.

```js
class CustomResponse extends Response {
  constructor(body, init) {
    // `body` puede ser un ReadableStream rastreado: pásalo tal cual
    super(body, init);
  }
}

const instance = axios.create({
  adapter: 'fetch',
  maxContentLength: 10 * 1024 * 1024,
  onDownloadProgress: (e) => console.log(e.loaded),
  env: { fetch: customFetch, Response: CustomResponse },
});
```

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
