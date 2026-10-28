# Captura de progreso <Badge type="tip" text="Nuevo" />

Axios admite la captura del progreso de carga y descarga en entornos de navegador y Node.js. La frecuencia de los eventos de progreso está limitada a 3 veces por segundo para evitar saturar el navegador con eventos de progreso. A continuación se muestra un ejemplo de cómo capturar eventos de progreso:

```js
await axios.post(url, data, {
  onUploadProgress: function (axiosProgressEvent) {
    /*{
      loaded: number;
      total?: number;
      progress?: number; // in range [0..1]
      bytes: number; // how many bytes have been transferred since the last trigger (delta)
      estimated?: number; // estimated time in seconds
      rate?: number; // upload speed in bytes
      upload: true; // upload sign
    }*/
  },

  onDownloadProgress: function (axiosProgressEvent) {
    /*{
      loaded: number;
      total?: number;
      progress?: number;
      bytes: number; 
      estimated?: number;
      rate?: number; // download speed in bytes
      download: true; // download sign
    }*/
  },
});
```

También puedes transmitir los eventos de progreso de carga y descarga a un stream legible en Node.js. Esto es útil cuando deseas mostrar el progreso de una forma personalizada. A continuación se muestra un ejemplo de cómo transmitir eventos de progreso:

```js
const { data } = await axios.post(SERVER_URL, readableStream, {
  onUploadProgress: ({ progress }) => {
    console.log((progress * 100).toFixed(2));
  },

  headers: {
    "Content-Length": contentLength,
  },

  maxRedirects: 0, // avoid buffering the entire stream
});
```

::: warning
La captura del progreso de carga de FormData no está disponible actualmente en entornos Node.js.
:::

::: danger
Se recomienda deshabilitar las redirecciones estableciendo `maxRedirects: 0` para subir el stream en el entorno Node.js, ya que el paquete `follow-redirects` almacenará todo el stream en memoria RAM sin seguir el algoritmo de "backpressure".
:::

## Leer los datos de respuesta de forma incremental

En el navegador, el adaptador XHR (el predeterminado) pasa el evento de progreso nativo como `axiosProgressEvent.event`. Puedes usar su `target`, el `XMLHttpRequest` subyacente, para leer el texto de respuesta recibido hasta el momento:

```js
let received = 0;

await axios.get('/api/stream', {
  responseType: 'text',
  onDownloadProgress: ({ event }) => {
    const xhr = event.target;
    const chunk = xhr.responseText.slice(received);
    received = xhr.responseText.length;

    if (chunk) {
      console.log('new data:', chunk);
    }
  },
});
```

Como las funciones de progreso están limitadas (throttled), una entrega puede ejecutarse después de que el navegador haya terminado de despachar el evento original. En ese caso, `event.currentTarget` es `null` (comportamiento estándar del DOM), pero `event.target` sigue haciendo referencia a la solicitud, así que usa `target` como se muestra arriba.

Cuando una descarga XHR se completa correctamente, axios entrega un evento final de progreso de descarga desde el manejador `loadend` con el estado completo de la transferencia, de modo que el último fragmento no se pierde por la limitación. El progreso de carga, las descargas XHR fallidas y las transferencias abortadas o con errores mantienen su comportamiento anterior: solo se entrega un evento de progreso que ya estuviera pendiente.
