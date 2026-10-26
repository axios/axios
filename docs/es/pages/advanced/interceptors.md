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

El número devuelto por `use()` es un ID de interceptor opaco. Pásalo a `eject()` sin modificarlo; no lo uses como índice del array `handlers`. Prefiere `eject()` y `clear()` antes que editar `handlers` directamente:

- Expulsar un ID desconocido, o expulsar el mismo ID dos veces, no hace nada.
- Un ID obsoleto nunca elimina un interceptor diferente, incluso después de haber expulsado otros interceptores o de haber vaciado el gestor.
- Si `handlers` se reemplaza por `null` o `undefined`, esa cadena de interceptores se omite, y la siguiente llamada a `use()` restaura un array vacío antes de añadir el nuevo interceptor.

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

### Errores en interceptores síncronos

Cuando un interceptor de solicitud síncrono lanza un error, axios llama al manejador `onRejected` emparejado con ese interceptor y deja de ejecutar los interceptores de solicitud restantes. Si el manejador retorna normalmente —incluido `undefined` o una Promise resuelta— el error se considera manejado y axios envía la solicitud con la última configuración válida. El valor devuelto por el manejador no reemplaza esa configuración.

Para impedir el envío, omite el manejador de rechazo o haz que lance un error o devuelva una Promise rechazada. El error terminal continúa entonces por los interceptores de rechazo de respuesta.

```js
axios.interceptors.request.use(
  function validate(config) {
    if (!config.headers.has("Authorization")) {
      throw new Error("Authorization is required");
    }
    return config;
  },
  function rejectInvalidRequest(error) {
    return Promise.reject(error);
  },
  { synchronous: true }
);
```

Un manejador que solo registra el error puede retornar normalmente para conservar el comportamiento existente de continuación:

```js
axios.interceptors.request.use(
  function prepare(config) {
    throw new Error("Optional preparation failed");
  },
  function logPreparationFailure(error) {
    console.warn(error);
    // Retornar normalmente envía la solicitud con la última configuración válida.
  },
  { synchronous: true }
);
```

## Devolver un objeto de configuración diferente

Un interceptor de solicitud normalmente modifica y devuelve la configuración que recibe. Esa configuración es un objeto escribible con prototipo nulo creado por axios, y devolverla sin cambios conserva su identidad: el adaptador y `response.config` reciben el mismo objeto.

```js
let seen;

const instance = axios.create({
  adapter: async (config) => {
    console.log(config === seen); // true
    return { data: null, status: 200, statusText: 'OK', headers: {}, config };
  },
});

instance.interceptors.request.use((config) => {
  config.headers.set('X-Trace', '1');
  seen = config;
  return config;
});
```

Si un interceptor devuelve un objeto diferente, axios lo copia en una nueva instantánea escribible con prototipo nulo antes del envío. Se conservan los campos propios, excepto las claves inseguras `__proto__`, `constructor` y `prototype`, que siempre se descartan. Los campos heredados de un prototipo definido por la aplicación se copian como campos propios, pero la instantánea no conserva la identidad del objeto original, su prototipo, las comprobaciones `instanceof`, los descriptores de acceso ni los atributos de las propiedades:

```js
const template = { tenant: 'acme' };

instance.interceptors.request.use((config) => {
  // `tenant` se hereda de `template`; un adaptador personalizado
  // lo lee como un campo propio de la instantánea: config.tenant === 'acme'
  return Object.assign(Object.create(template), config);
});
```

Los campos heredados de `Object.prototype`, o de un prototipo que a su vez tiene un prototipo `null` (como uno creado con `Object.create(null)`), se ignoran:

```js
const nullTemplate = Object.create(null);
nullTemplate.tenant = 'acme';

instance.interceptors.request.use((config) => {
  // `tenant` se ignora porque `nullTemplate` tiene un prototipo nulo:
  // un adaptador personalizado ve config.tenant === undefined
  return Object.assign(Object.create(nullTemplate), config);
});
```

Una configuración con prototipo nulo también se copia cuando está congelada, sellada, usa descriptores de acceso o propiedades no escribibles, o contiene una de las claves inseguras, porque axios debe actualizar campos como `headers` y `data` durante el envío. Estas reglas son un límite de seguridad intencional que impide que los valores inyectados en prototipos compartidos cambien el comportamiento de la solicitud; no hacen que modificar `Object.prototype` sea seguro ni compatible.

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

## Orden de ejecución de los interceptores

::: warning Los interceptores de solicitud y respuesta se ejecutan en órdenes **opuestos**
Los interceptores de solicitud se ejecutan en **orden inverso** (LIFO — último en entrar, primero en salir). El _último_ interceptor de solicitud añadido se ejecuta _primero_.

Los interceptores de respuesta se ejecutan en el **orden en que fueron añadidos** (FIFO — primero en entrar, primero en salir). El _primer_ interceptor de respuesta añadido se ejecuta _primero_.
:::

El siguiente ejemplo muestra el orden completo de ejecución para tres interceptores de solicitud y tres interceptores de respuesta:

```js
const instance = axios.create();

const interceptor = (id) => (base) => {
  console.log(id);
  return base;
};

instance.interceptors.request.use(interceptor("Request Interceptor 1"));
instance.interceptors.request.use(interceptor("Request Interceptor 2"));
instance.interceptors.request.use(interceptor("Request Interceptor 3"));
instance.interceptors.response.use(interceptor("Response Interceptor 1"));
instance.interceptors.response.use(interceptor("Response Interceptor 2"));
instance.interceptors.response.use(interceptor("Response Interceptor 3"));

// Salida en consola:
// Request Interceptor 3
// Request Interceptor 2
// Request Interceptor 1
// [Se realiza la solicitud HTTP]
// Response Interceptor 1
// Response Interceptor 2
// Response Interceptor 3
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
Para obtener una comprensión profunda de cómo funcionan los interceptores, puedes leer los casos de prueba [aquí](https://github.com/axios/axios/blob/v1.x/tests/browser/interceptors.browser.test.js).
:::
