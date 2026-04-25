# Interceptores

Los interceptores son un mecanismo poderoso que puede usarse para interceptar y modificar solicitudes y respuestas HTTP. Son muy similares al middleware en Express.js. Un interceptor es una función que se ejecuta antes de enviar una solicitud y antes de recibir una respuesta. Los interceptores son útiles para una variedad de tareas como el registro de eventos (logging), la modificación de encabezados de solicitud y la modificación de la respuesta.

El uso básico de los interceptores es el siguiente:

```js
// Add a request interceptor
axios.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
axios.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error);
  }
);
```

## Eliminar interceptores

Puedes eliminar cualquier interceptor usando el método `eject` sobre el interceptor que deseas eliminar. También puedes eliminar todos los interceptores llamando al método `clear` sobre el objeto `axios.interceptors`. A continuación se muestra un ejemplo de cómo eliminar un interceptor:

```js
// Eject the request interceptor
const myInterceptor = axios.interceptors.request.use(function () {
  /*...*/
});
axios.interceptors.request.eject(myInterceptor);

// Eject the response interceptor
const myInterceptor = axios.interceptors.response.use(function () {
  /*...*/
});
axios.interceptors.response.eject(myInterceptor);
```

A continuación se muestra un ejemplo de cómo eliminar todos los interceptores:

```js
const instance = axios.create();
instance.interceptors.request.use(function () {
  /*...*/
});
instance.interceptors.request.clear(); // Removes interceptors from requests
instance.interceptors.response.use(function () {
  /*...*/
});
instance.interceptors.response.clear(); // Removes interceptors from responses
```

## Comportamiento predeterminado de los interceptores

Cuando añades interceptores de solicitud, se asume que son asíncronos de forma predeterminada. Esto puede causar un retraso en la ejecución de tu solicitud axios cuando el hilo principal está bloqueado (se crea una Promise internamente para el interceptor y tu solicitud queda al final de la pila de llamadas). Si tus interceptores de solicitud son síncronos, puedes añadir un indicador al objeto de opciones que le indicará a axios que ejecute el código de forma síncrona y evite cualquier retraso en la ejecución de la solicitud.

```js
axios.interceptors.request.use(
  function (config) {
    config.headers.test = "I am only a header!";
    return config;
  },
  null,
  { synchronous: true }
);
```

## Interceptores usando `runWhen`

Si deseas ejecutar un interceptor particular basándote en una verificación en tiempo de ejecución, puedes añadir una función `runWhen` al objeto de opciones. El interceptor no se ejecutará si y solo si el retorno de `runWhen` es `false`. La función se llamará con el objeto de configuración (recuerda que también puedes vincularle tus propios argumentos). Esto puede ser útil cuando tienes un interceptor de solicitud asíncrono que solo necesita ejecutarse en ciertos momentos.

```js
function onGetCall(config) {
  return config.method === "get";
}
axios.interceptors.request.use(
  function (config) {
    config.headers.test = "special get headers";
    return config;
  },
  null,
  { runWhen: onGetCall }
);
```

## Múltiples interceptores

Puedes añadir múltiples interceptores a la misma solicitud o respuesta. Lo siguiente aplica para múltiples interceptores en la misma cadena, en el orden indicado a continuación:

- Cada interceptor se ejecuta
- Los interceptores de solicitud se ejecutan en orden inverso (LIFO).
- Los interceptores de respuesta se ejecutan en el orden en que fueron añadidos (FIFO).
- Solo se devuelve el resultado del último interceptor
- Cada interceptor recibe el resultado de su predecesor
- Cuando el interceptor de cumplimiento lanza una excepción:
  - El siguiente interceptor de cumplimiento no es llamado
  - El siguiente interceptor de rechazo es llamado
  - Una vez capturado, el siguiente interceptor de cumplimiento es llamado nuevamente (igual que en una cadena de promises).

::: tip
Para obtener una comprensión profunda de cómo funcionan los interceptores, puedes leer los casos de prueba [aquí](https://github.com/axios/axios/blob/v1.x/test/specs/interceptors.spec.js).
:::
