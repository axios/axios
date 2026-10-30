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

::: warning Las redirecciones no se admiten sobre HTTP/2
El adaptador HTTP/2 actualmente no sigue redirecciones. Si una solicitud emitida con `httpVersion: 2` recibe una respuesta `3xx`, la redirección no se sigue automáticamente. Maneja estas respuestas manualmente o permanece en HTTP/1.x para endpoints que dependen de redirecciones.
:::

## Búsqueda DNS personalizada

Una función [`lookup`](https://nodejs.org/api/dns.html#dnslookuphostname-options-callback) personalizada también se aplica a las conexiones HTTP/2. La función de búsqueda forma parte de las opciones de sesión, por lo que las solicitudes reutilizan una sesión solo cuando usan la misma función `lookup`.

```js
import dns from 'node:dns';

const { data } = await axios.get('https://example.com/api', {
  httpVersion: 2,
  lookup: (hostname, options, callback) => {
    // Resuelve con tu propia lógica y luego devuelve el resultado a Node.js
    dns.lookup(hostname, options, callback);
  },
});
```

## Proxies

Las solicitudes HTTP/2 no pueden enviarse a través de un proxy porque `http2.connect()` de Node.js no puede aplicar la configuración de proxy:

- Un objeto `proxy` explícito se rechaza con un `AxiosError` cuyo código es `ERR_NOT_SUPPORT`.
- `proxy: false` se conecta directamente, como antes.
- Las variables de entorno de proxy (`HTTP_PROXY`, `HTTPS_PROXY`, etc.) y la configuración `proxyEnv` en `httpAgent`/`httpsAgent` se ignoran.

::: danger Las solicitudes HTTP/2 omiten los proxies del entorno
Como la configuración de proxy del entorno se ignora, una solicitud HTTP/2 se conecta directamente al origen incluso cuando el proceso está configurado para usar un proxy. Si tu despliegue requiere que todo el tráfico de salida pase por un proxy, no uses `httpVersion: 2`.
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
