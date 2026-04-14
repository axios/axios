# HTTP2 <Badge type="warning" text="Experimental" /> <Badge type="tip" text="v1.13.0+" />

El soporte experimental de HTTP/2 fue añadido al adaptador `http` en la versión `1.13.0`. Solo está disponible en entornos Node.js.

## Uso básico

Usa la opción `httpVersion` para seleccionar la versión del protocolo para una solicitud. Establecerla en `2` habilita HTTP/2.

```js
const { data, headers, status } = await axios.post(
  "https://httpbin.org/post",
  form,
  {
    httpVersion: 2,
  },
);
```

## `http2Options`

Las opciones nativas adicionales para la llamada interna `session.request()` pueden pasarse a través del objeto de configuración `http2Options`. Esto también incluye el parámetro personalizado `sessionTimeout`, que controla cuánto tiempo (en milisegundos) una sesión HTTP/2 inactiva se mantiene viva antes de cerrarse. Su valor predeterminado es `1000ms`.

```js
{
  httpVersion: 2,
  http2Options: {
    rejectUnauthorized: false, // accept self-signed certificates (dev only)
    sessionTimeout: 5000,      // keep idle session alive for 5 seconds
  },
}
```

::: warning
El soporte de HTTP/2 es actualmente experimental. La API puede cambiar en futuras versiones menores o de parche.
:::

## Ejemplo completo

El ejemplo a continuación envía una solicitud POST con `multipart/form-data` sobre HTTP/2 y rastrea tanto el progreso de carga como el de descarga.

```js
const form = new FormData();
form.append("foo", "123");

const { data, headers, status } = await axios.post(
  "https://httpbin.org/post",
  form,
  {
    httpVersion: 2,
    http2Options: {
      // rejectUnauthorized: false,
      // sessionTimeout: 1000
    },
    onUploadProgress(e) {
      console.log("upload progress", e);
    },
    onDownloadProgress(e) {
      console.log("download progress", e);
    },
    responseType: "arraybuffer",
  },
);
```

## Referencia de configuración

| Opción | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `httpVersion` | `number` | `1` | Versión del protocolo HTTP a usar. Establece en `2` para habilitar HTTP/2. |
| `http2Options.sessionTimeout` | `number` | `1000` | Tiempo en milisegundos antes de que una sesión HTTP/2 inactiva se cierre. |

Todas las demás opciones nativas de `session.request()` compatibles con el módulo `http2` integrado de Node.js también pueden pasarse dentro de `http2Options`.
