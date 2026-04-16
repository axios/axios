# Configuración de solicitud

La configuración de solicitud se usa para configurar la solicitud. Existe una amplia gama de opciones disponibles, pero la única opción requerida es `url`. Si el objeto de configuración no contiene un campo `method`, el método predeterminado es `GET`.

### `url`

La `url` es la URL a la que se realiza la solicitud. Puede ser una cadena de texto o una instancia de `URL`.

### `method`

El `method` es el método HTTP a usar para la solicitud. El método predeterminado es `GET`.

### `baseURL`

La `baseURL` es la URL base que se antepondrá a la `url` a menos que la `url` sea una URL absoluta. Es útil para hacer solicitudes al mismo dominio sin tener que repetir el nombre de dominio, ni ningún prefijo de API o versión.

### `allowAbsoluteUrls`

`allowAbsoluteUrls` determina si las URLs absolutas sobrescribirán un `baseUrl` configurado. Cuando se establece en `true` (valor predeterminado), los valores absolutos para `url` sobrescribirán `baseUrl`. Cuando se establece en `false`, los valores absolutos para `url` siempre serán antepuestos por `baseUrl`.

### `transformRequest`

La función `transformRequest` te permite modificar los datos de la solicitud antes de enviarlos al servidor. Esta función se llama con los datos de la solicitud como único argumento. Solo aplica para los métodos de solicitud `PUT`, `POST`, `PATCH` y `DELETE`. La última función del arreglo debe devolver una cadena de texto o una instancia de Buffer, ArrayBuffer, FormData o Stream.

### `transformResponse`

La función `transformResponse` te permite modificar los datos de la respuesta antes de que sean pasados a las funciones `then` o `catch`. Esta función se llama con los datos de la respuesta como único argumento.

### `headers`

Los `headers` son los encabezados HTTP que se enviarán con la solicitud. El encabezado `Content-Type` se establece en `application/json` de forma predeterminada.

### `params`

Los `params` son los parámetros de URL que se enviarán con la solicitud. Debe ser un objeto plano o un objeto URLSearchParams. Si la `url` contiene parámetros de consulta, se combinarán con el objeto `params`.

### `paramsSerializer`

La función `paramsSerializer` te permite serializar el objeto `params` antes de enviarlo al servidor. Hay varias opciones disponibles para esta función; consulta el ejemplo completo de configuración de solicitud al final de esta página.

### `data`

El `data` son los datos que se enviarán como cuerpo de la solicitud. Puede ser una cadena de texto, un objeto plano, un Buffer, ArrayBuffer, FormData, Stream o URLSearchParams. Solo aplica para los métodos de solicitud `PUT`, `POST`, `DELETE` y `PATCH`. Cuando no se establece `transformRequest`, debe ser de uno de los siguientes tipos:

- cadena de texto, objeto plano, ArrayBuffer, ArrayBufferView, URLSearchParams
- Solo en el navegador: FormData, File, Blob
- Solo en Node.js: Stream, Buffer, FormData (paquete form-data)

### `timeout`

El `timeout` es el número de milisegundos antes de que la solicitud expire. Si la solicitud tarda más que `timeout`, se abortará.

### `withCredentials`

La propiedad `withCredentials` indica si las solicitudes de Access-Control entre sitios deben hacerse usando credenciales como cookies, encabezados de autorización o certificados de cliente TLS. Establecer `withCredentials` no tiene efecto en solicitudes del mismo sitio.

### `adapter`

`adapter` permite el manejo personalizado de solicitudes, lo que facilita las pruebas. Devuelve una Promise y proporciona una respuesta válida; consulta los [adaptadores](/pages/advanced/adapters) para más información. También proporcionamos una serie de adaptadores integrados. El adaptador predeterminado es `http` para Node.js y `xhr` para navegadores. La lista completa de adaptadores integrados es la siguiente:

- fetch
- http
- xhr

También puedes pasar un arreglo de adaptadores. axios usará el primero que sea compatible con el entorno.

### `auth`

`auth` indica que se debe usar autenticación HTTP Basic y proporciona las credenciales. Esto establecerá un encabezado `Authorization`, sobrescribiendo cualquier encabezado `Authorization` personalizado que hayas definido usando `headers`. Ten en cuenta que solo la autenticación HTTP Basic es configurable a través de este parámetro. Para tokens Bearer y similares, usa encabezados `Authorization` personalizados.

### `responseType`

El `responseType` indica el tipo de datos con el que el servidor responderá. Puede ser uno de los siguientes:

- arraybuffer
- document
- json
- text
- stream
- blob (solo en el navegador)
- formdata (solo con el adaptador fetch)

### `responseEncoding` <Badge type="warning" text="Solo en Node.js" />

El `responseEncoding` indica la codificación a usar para decodificar las respuestas. Se admiten las siguientes opciones:

- ascii
- ASCII
- ansi
- ANSI
- binary
- BINARY
- base64
- BASE64
- base64url
- BASE64URL
- hex
- HEX
- latin1
- LATIN1
- ucs-2
- UCS-2
- ucs2
- UCS2
- utf-8
- UTF-8
- utf8
- UTF8
- utf16le
- UTF16LE

::: tip
Nota: Se ignora para `responseType` de tipo `stream` o solicitudes del lado del cliente.
:::

### `xsrfCookieName`

`xsrfCookieName` es el nombre de la cookie que se usará como valor para el token `XSRF`.

### `xsrfHeaderName`

`xsrfHeaderName` es el nombre del encabezado que se usará como valor para el token `XSRF`.

### `withXSRFToken`

La propiedad `withXSRFToken` indica si se debe enviar el token `XSRF` con la solicitud. Solo aplica para solicitudes del lado del cliente. El valor predeterminado es `undefined`.

### `onUploadProgress`

La función `onUploadProgress` te permite escuchar el progreso de una carga.

### `onDownloadProgress`

La función `onDownloadProgress` te permite escuchar el progreso de una descarga.

### `maxContentLength` <Badge type="warning" text="Solo en Node.js" />

La propiedad `maxContentLength` define el número máximo de bytes que el servidor aceptará en la respuesta.

### `maxBodyLength` <Badge type="warning" text="Solo en Node.js" />

La propiedad `maxBodyLength` define el número máximo de bytes que el servidor aceptará en la solicitud.

### `validateStatus`

La función `validateStatus` te permite sobreescribir la validación predeterminada del código de estado. Por defecto, axios rechazará la Promise si el código de estado no está en el rango 200-299. Puedes sobreescribir este comportamiento proporcionando una función `validateStatus` personalizada. La función debe devolver `true` si el código de estado está dentro del rango que deseas aceptar.

### `maxRedirects` <Badge type="warning" text="Solo en Node.js" />

La propiedad `maxRedirects` define el número máximo de redirecciones a seguir. Si se establece en 0, no se seguirá ninguna redirección.

### `beforeRedirect`

La función `beforeRedirect` te permite modificar la solicitud antes de que sea redirigida. Úsala para ajustar las opciones de la solicitud al redirigir, para inspeccionar los últimos encabezados de respuesta, o para cancelar la solicitud lanzando un error. Si `maxRedirects` se establece en 0, `beforeRedirect` no se usa.

### `socketPath` <Badge type="warning" text="Solo en Node.js" />

La propiedad `socketPath` define un socket UNIX que se usará en lugar de una conexión TCP. Por ejemplo, `/var/run/docker.sock` para enviar solicitudes al daemon de Docker. Solo se puede especificar `socketPath` o `proxy`. Si ambos se especifican, se usa `socketPath`.

### `transport`

La propiedad `transport` define el transporte a usar para la solicitud. Es útil para hacer solicitudes sobre un protocolo diferente, como `http2`.

### `httpAgent` y `httpsAgent`

`httpAgent` y `httpsAgent` definen un agente personalizado para usar al realizar solicitudes http y https respectivamente en Node.js. Esto permite añadir opciones como `keepAlive` que no están habilitadas por defecto.

### `proxy`

`proxy` define el nombre de host, puerto y protocolo del servidor proxy que deseas usar. También puedes definir tu proxy usando las variables de entorno convencionales `http_proxy` y `https_proxy`.

Si usas variables de entorno para tu configuración de proxy, también puedes definir una variable de entorno `no_proxy` como una lista separada por comas de dominios que no deben ser enviados a través del proxy.

Usa `false` para deshabilitar los proxies, ignorando las variables de entorno. `auth` indica que se debe usar autenticación HTTP Basic para conectarse al proxy, y proporciona las credenciales. Esto establecerá un encabezado `Proxy-Authorization`, sobrescribiendo cualquier encabezado `Proxy-Authorization` personalizado que hayas definido usando `headers`. Si el servidor proxy usa HTTPS, debes establecer el protocolo en `https`.

```js
proxy: {
  protocol: "https",
  host: "127.0.0.1",
  hostname: "localhost", // Takes precedence over "host" if both are defined
  port: 9000,
  auth: {
    username: "mikeymike",
    password: "rapunz3l"
  }
},
```

### `cancelToken`

La propiedad `cancelToken` te permite crear un token de cancelación que puede usarse para cancelar la solicitud. Para más información, consulta la documentación de [cancelación](/pages/advanced/cancellation).

### `signal`

La propiedad `signal` te permite pasar una instancia de `AbortSignal` a la solicitud. Esto te permite cancelar la solicitud usando la API `AbortController`.

### `decompress` <Badge type="warning" text="Solo en Node.js" />

La propiedad `decompress` indica si los datos de la respuesta deben descomprimirse automáticamente. El valor predeterminado es `true`.

### `insecureHTTPParser`

Indica si se debe usar un parser HTTP inseguro que acepta encabezados HTTP inválidos. Esto puede permitir la interoperabilidad con implementaciones HTTP no conformes. Se debe evitar el uso del parser inseguro.

Ten en cuenta que la opción `insecureHTTPParser` solo está disponible en Node.js 12.10.0 y versiones posteriores. Consulta la [documentación de Node.js](https://nodejs.org/en/blog/vulnerability/february-2020-security-releases/#strict-http-header-parsing-none) para más información. Consulta el conjunto completo de opciones [aquí](https://nodejs.org/dist/latest-v12.x/docs/api/http.html#http_http_request_url_options_callback).

### `transitional`

La propiedad `transitional` te permite habilitar o deshabilitar ciertas características de transición. Las siguientes opciones están disponibles:

- `silentJSONParsing`: Si se establece en `true`, axios no registrará una advertencia cuando encuentre respuestas JSON inválidas, estableciendo el valor de retorno en null. Es útil cuando trabajas con APIs que devuelven JSON inválido.
- `forcedJSONParsing`: Fuerza a axios a analizar las respuestas JSON como JSON, incluso si la respuesta no es JSON válido. Es útil cuando trabajas con APIs que devuelven JSON inválido.
- `clarifyTimeoutError`: Clarifica el mensaje de error cuando una solicitud expira. Es útil cuando depuras problemas de timeout.
- `legacyInterceptorReqResOrdering`: Cuando se establece en `true`, se usará el orden de solicitud/respuesta de interceptores heredado.

### `env`

La propiedad `env` te permite establecer algunas opciones de configuración. Por ejemplo, la clase FormData que se usa para serializar automáticamente el payload en un objeto FormData.

- FormData: window?.FormData || global?.FormData

### `formSerializer`

La opción `formSerializer` te permite configurar cómo se serializan los objetos planos a `multipart/form-data` cuando se usan como `data` de solicitud. Opciones disponibles:

- `visitor` — función visitante personalizada llamada recursivamente para cada valor
- `dots` — usar notación de punto en lugar de notación de corchetes
- `metaTokens` — preservar terminaciones especiales de clave como `{}`
- `indexes` — controlar el formato de corchetes para claves de arreglo (`null` / `false` / `true`)
- `maxDepth` _(predeterminado: `100`)_ — profundidad máxima de anidación antes de lanzar un `AxiosError` con código `ERR_FORM_DATA_DEPTH_EXCEEDED`. Establece en `Infinity` para desactivar.

Consulta la página [multipart/form-data](/pages/advanced/multipart-form-data-format) para todos los detalles, y el ejemplo completo de configuración de solicitud al final de esta página.

### `maxRate` <Badge type="warning" text="Solo en Node.js" />

La propiedad `maxRate` define el **ancho de banda** máximo (en bytes por segundo) para la carga y/o descarga. Acepta un número único (aplicado a ambas direcciones) o un arreglo de dos elementos `[uploadRate, downloadRate]` donde cada elemento es un límite en bytes por segundo. Por ejemplo, `100 * 1024` significa 100 KB/s. Consulta [Limitación de velocidad](/pages/advanced/rate-limiting) para ver ejemplos.

## Ejemplo completo de configuración de solicitud

```js
{
  url: "/posts",
  method: "get",
  baseURL: "https://jsonplaceholder.typicode.com",
  allowAbsoluteUrls: true,
  transformRequest: [function (data, headers) {
    return data;
  }],
  transformResponse: [function (data) {
    return data;
  }],
  headers: {"X-Requested-With": "XMLHttpRequest"},
  params: {
    postId: 5
  },
  paramsSerializer: {
    // Custom encoder function which sends key/value pairs in an iterative fashion.
    encode?: (param: string): string => { /* Do custom operations here and return transformed string */ },

    // Custom serializer function for the entire parameter. Allows user to mimic pre 1.x behaviour.
    serialize?: (params: Record<string, any>, options?: ParamsSerializerOptions ),

    // Configuration for formatting array indexes in the params.
    // Three available options:
      // (1) indexes: null (leads to no brackets)
      // (2) (default) indexes: false (leads to empty brackets)
      // (3) indexes: true (leads to brackets with indexes).
    indexes: false,

    // Profundidad máxima de anidación de objetos al serializar params. Lanza AxiosError
    // (ERR_FORM_DATA_DEPTH_EXCEEDED) si se excede. Predeterminado: 100. Establecer en Infinity para desactivar.
    maxDepth: 100

  },
  data: {
    firstName: "Fred"
  },
  // Syntax alternative to send data into the body method post only the value is sent, not the key
  data: "Country=Brasil&City=Belo Horizonte",
  timeout: 1000,
  withCredentials: false,
  adapter: function (config) {
    // Do whatever you want
  },
  adapter: "xhr",
  auth: {
    username: "janedoe",
    password: "s00pers3cret"
  },
  responseType: "json",
  responseEncoding: "utf8",
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  withXSRFToken: boolean | undefined | ((config: InternalAxiosRequestConfig) => boolean | undefined),
  onUploadProgress: function ({loaded, total, progress, bytes, estimated, rate, upload = true}) {
    // Do whatever you want with the Axios progress event
  },
  onDownloadProgress: function ({loaded, total, progress, bytes, estimated, rate, download = true}) {
    // Do whatever you want with the Axios progress event
  },
  maxContentLength: 2000,
  maxBodyLength: 2000,
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  },
  maxRedirects: 21,
  beforeRedirect: (options, { headers }) => {
    if (options.hostname === "typicode.com") {
      options.auth = "user:password";
    }
  },
  socketPath: null,
  transport: undefined,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  proxy: {
    protocol: "https",
    host: "127.0.0.1",
    // hostname: "127.0.0.1" // Takes precedence over "host" if both are defined
    port: 9000,
    auth: {
      username: "mikeymike",
      password: "rapunz3l"
    }
  },
  cancelToken: new CancelToken(function (cancel) {
    cancel("Operation has been canceled.");
  }),
  signal: new AbortController().signal,
  decompress: true,
  insecureHTTPParser: undefined,
  transitional: {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false,
    legacyInterceptorReqResOrdering: true,
  },
  env: {
    FormData: window?.FormData || global?.FormData
  },
  formSerializer: {
      // Custom visitor function to serialize form values
      visitor: (value, key, path, helpers) => {};

      // Use dots instead of brackets format
      dots: boolean;

      // Keep special endings like {} in parameter key
      metaTokens: boolean;

      // Usar formato de índices de arreglo:
        // null - sin corchetes
        // false - corchetes vacíos
        // true - corchetes con índices
      indexes: boolean;

      // Profundidad máxima de anidación de objetos. Lanza AxiosError (ERR_FORM_DATA_DEPTH_EXCEEDED)
      // si se excede. Predeterminado: 100. Establecer en Infinity para desactivar.
      maxDepth: 100;
  },
  maxRate: [
    100 * 1024, // 100KB/s upload limit,
    100 * 1024  // 100KB/s download limit
  ]
}
```
