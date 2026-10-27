# Esquema de respuesta

Cada solicitud de axios se resuelve en un objeto de respuesta con la siguiente estructura. El esquema es consistente tanto en el entorno del navegador como en Node.js.

```js
{
  // Los datos de respuesta proporcionados por el servidor.
  // Al usar `transformResponse`, este será el resultado de la última transformación.
  data: {},

  // El código de estado HTTP de la respuesta del servidor (por ejemplo: 200, 404, 500).
  status: 200,

  // El mensaje de estado HTTP correspondiente al código de estado (por ejemplo: "OK", "Not Found").
  statusText: "OK",

  // Los encabezados de respuesta enviados por el servidor.
  // Los nombres de los encabezados están en minúsculas. Puedes acceder a ellos con notación de corchetes o de punto.
  headers: {},

  // La configuración de axios que se usó para esta solicitud, incluyendo baseURL,
  // headers, timeout, params y cualquier otra opción que hayas proporcionado.
  config: {},

  // El objeto de solicitud subyacente.
  // En Node.js: la última instancia de `http.ClientRequest` (después de cualquier redirección).
  // En el navegador: la instancia de `XMLHttpRequest`.
  request: {},

  // Tiempo aproximado en milisegundos que tardó el adaptador en completar la solicitud.
  // axios lo establece para adaptadores integrados y personalizados; consulta "Duración de la respuesta" más abajo.
  duration: 42,
}
```

En TypeScript, `AxiosResponse<T, D, H, P>` tipa los datos de respuesta (`T`), los datos de solicitud (`D`), los encabezados de respuesta (`H`) y los parámetros de consulta (`P`). La configuración conserva ambos tipos de la solicitud:

```ts
interface AxiosResponse<T = any, D = any, H = {}, P = any> {
  data: T;
  status: number;
  statusText: string;
  duration?: number;
  headers: (H & RawAxiosResponseHeaders) | AxiosResponseHeaders;
  config: InternalAxiosRequestConfig<D, P>;
  request?: any;
}
```

## Acceder a los campos de la respuesta

En la práctica, generalmente desestructurarás solo las partes que necesites:

```js
const { data, status, headers } = await axios.get("/api/users/1");

console.log(status);          // 200
console.log(headers["content-type"]); // "application/json; charset=utf-8"
console.log(data);            // { id: 1, name: "Jay", email: "jay@example.com" }
```

## Duración de la respuesta

`response.duration` es el tiempo transcurrido del adaptador en milisegundos:

```js
const response = await axios.get('/users');

console.log(response.duration); // p. ej. 128
```

La medición comienza justo antes de que axios invoque el adaptador, después de que se hayan ejecutado los interceptores de solicitud y `transformRequest`. Se detiene cuando el adaptador termina, antes de que se ejecuten `transformResponse` y los interceptores de respuesta. Por tanto, incluye el trabajo del adaptador, como la espera en cola de la conexión y el seguimiento de redirecciones.

- En las respuestas almacenadas en búfer, el valor incluye la recepción del cuerpo de la respuesta.
- En las respuestas en stream (`responseType: "stream"` en los adaptadores HTTP y fetch), solo mide el tiempo hasta que el stream está disponible. Consumir el stream más tarde, o que el stream falle, no actualiza el valor.
- No es un desglose de DNS, TCP, TLS o tiempo hasta el primer byte, ni el tiempo de procesamiento del servidor.
- El valor es un tiempo de reloj aproximado medido con `Date.now()`. Los ajustes del reloj hacia atrás se limitan a `0`, pero los ajustes hacia adelante pueden inflar el valor.

axios establece `duration` en cada respuesta producida por un adaptador, sobrescribiendo cualquier propiedad `duration` que un adaptador personalizado ya hubiera establecido. La propiedad es opcional en las declaraciones de TypeScript para que los adaptadores personalizados y las respuestas construidas manualmente no necesiten proporcionarla. Los errores que no tienen respuesta, como los errores de red, los tiempos de espera agotados y las cancelaciones, no tienen duración; consulta [Manejo de errores](/es/pages/advanced/error-handling#duracion-de-la-respuesta-en-errores).

## Verificar el código de estado

axios resuelve la Promise para cualquier respuesta 2xx y la rechaza para cualquier cosa fuera de ese rango de forma predeterminada. Puedes personalizar esto con la opción de configuración `validateStatus`:

```js
const response = await axios.get("/api/resource", {
  validateStatus: (status) => status < 500, // resolve for anything below 500
});
```

## Acceder a los encabezados de respuesta

Todos los nombres de encabezados de respuesta están en minúsculas, independientemente de cómo los haya enviado el servidor:

```js
const response = await axios.get("/api/resource");

// These are equivalent
const contentType = response.headers["content-type"];
const contentType2 = response.headers.get("content-type");
```
