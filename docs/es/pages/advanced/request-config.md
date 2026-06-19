# Configuración de solicitud

La configuración de solicitud se usa para configurar la solicitud. Existe una amplia gama de opciones disponibles, pero la única opción requerida es `url`. Si el objeto de configuración no contiene un campo `method`, el método predeterminado es `GET`.

::: warning Seguridad: la protección contra bombas de descompresión es opcional
Por defecto, `maxContentLength` y `maxBodyLength` están en `-1` (sin límite). Un servidor malicioso o comprometido puede devolver un cuerpo pequeño comprimido con gzip/deflate/brotli/zstd que se expande a gigabytes y agota el proceso de Node.js.

Si haces solicitudes a servidores en los que no confías plenamente, **establece un tope**:

```js
axios.defaults.maxContentLength = 10 * 1024 * 1024; // 10 MB
axios.defaults.maxBodyLength = 10 * 1024 * 1024;
```

Consulta la [guía de seguridad](/pages/misc/security) para más detalles.
:::

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

### `parseReviver`

La función `parseReviver` te permite proporcionar una función "reviver" personalizada directamente a la llamada nativa `JSON.parse()` que utiliza el `transformResponse` predeterminado.

Esto resulta especialmente útil para realizar hidratación de tipos de alto rendimiento (por ejemplo, convertir cadenas ISO a objetos `Temporal` o `Date`) o para evitar la pérdida de precisión durante el parseo.

En entornos modernos (ES2023+), la función reviver recibe un tercer argumento `context`. Esto proporciona acceso a la fuente JSON cruda (`source`), permitiendo la conversión precisa de enteros grandes (BigInt) que de otro modo perderían precisión al ser parseados como números estándar de JavaScript.

> Nota: `Temporal` aún no está disponible en todos los entornos. Considera usar un polyfill si es necesario.

```js
const client = axios.create({
  parseReviver: (key, value, context) => {
    // Ejemplo: parseo de BigInt seguro en precisión
    if (typeof value === 'number' && context?.source) {
      const isInteger = Number.isInteger(value);
      const isUnsafe = !Number.isSafeInteger(value);
      const isValidIntegerString = /^-?\d+$/.test(context.source);

      if (isInteger && isUnsafe && isValidIntegerString) {
        try {
          return BigInt(context.source);
        } catch {
          // Alternativa: devolver el valor original si el parseo falla
        }
      }
    }

    // Ejemplo: hidratar fechas en objetos Temporal
    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      typeof Temporal !== 'undefined' &&
      Temporal?.PlainDate
    ) {
      return Temporal.PlainDate.from(value);
    }

    return value;
  },
});
```

### `headers`

Los `headers` son los encabezados HTTP que se enviarán con la solicitud. El encabezado `Content-Type` se establece en `application/json` de forma predeterminada.

### `params`

Los `params` son los parámetros de URL que se enviarán con la solicitud. Debe ser un objeto plano o un objeto URLSearchParams. Si la `url` contiene parámetros de consulta, se combinarán con el objeto `params`.

### `paramsSerializer`

La función `paramsSerializer` te permite serializar el objeto `params` antes de enviarlo al servidor. Hay varias opciones disponibles para esta función; consulta el ejemplo completo de configuración de solicitud al final de esta página.

#### Codificación porcentual estricta RFC 3986

De forma predeterminada, axios decodifica `%3A`, `%24`, `%2C` y `%20` de vuelta a `:`, `$`, `,` y `+` por legibilidad (el `+` sigue la convención `application/x-www-form-urlencoded` para representar un espacio en una cadena de consulta). Estos caracteres son válidos dentro de un componente de consulta según la [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986#section-3.4), por lo que la salida predeterminada es correcta. Sin embargo, algunos backends requieren codificación porcentual estricta y rechazan la forma legible.

Usa la opción `encode` para sobrescribir el codificador predeterminado:

```js
// Por solicitud: emitir codificación porcentual estricta RFC 3986 para los valores de consulta
axios.get('/foo', {
  params: { filter: JSON.stringify({ startedAt: '2026-01-23' }) },
  paramsSerializer: { encode: encodeURIComponent }
});

// O establecerlo en los valores predeterminados de la instancia
const client = axios.create({
  paramsSerializer: { encode: encodeURIComponent }
});
```

### `data`

El `data` son los datos que se enviarán como cuerpo de la solicitud. Puede ser una cadena de texto, un objeto plano, un Buffer, ArrayBuffer, FormData, Stream o URLSearchParams. Solo aplica para los métodos de solicitud `PUT`, `POST`, `DELETE` y `PATCH`. Cuando no se establece `transformRequest`, debe ser de uno de los siguientes tipos:

- cadena de texto, objeto plano, ArrayBuffer, ArrayBufferView, URLSearchParams
- Solo en el navegador: FormData, File, Blob
- React Native: FormData
- Solo en Node.js: Stream, Buffer, FormData (paquete form-data)

Para `FormData` en navegador, web worker y React Native, no establezcas manualmente `Content-Type`; el entorno agrega el boundary multipart.

Para los objetos `FormData` de Node.js que proporcionan un método `getHeaders()`, axios copia por defecto todos los encabezados devueltos para mantener la compatibilidad con v1. Si el objeto `FormData` es personalizado o no es de plena confianza, establece `formDataHeaderPolicy: 'content-only'` para copiar únicamente `Content-Type` y `Content-Length`, y define cualquier otro encabezado de la solicitud explícitamente mediante la configuración `headers`.

### `formDataHeaderPolicy` <Badge type="warning" text="Solo en Node.js" />

Controla cómo axios copia los encabezados devueltos por `FormData#getHeaders()` de Node.js. El valor por defecto es `'legacy'`, que copia todos los encabezados devueltos para preservar el comportamiento existente de v1. Establece `'content-only'` para copiar únicamente `Content-Type` y `Content-Length` desde `getHeaders()`.

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

`auth` indica que se debe usar autenticación HTTP Basic y proporciona las credenciales. Esto establecerá un encabezado `Authorization`, sobrescribiendo cualquier encabezado `Authorization` personalizado que hayas definido usando `headers`. Si `auth` se omite, los adaptadores HTTP de Node.js y fetch pueden obtener credenciales Basic desde la URL de la solicitud, por ejemplo `https://user:pass@example.com`; las credenciales codificadas con porcentaje en la URL se decodifican, y `auth` siempre tiene prioridad sobre las credenciales incluidas en la URL. En el adaptador HTTP de Node.js, la autenticación Basic se conserva en redirecciones del mismo origen y se elimina en redirecciones de origen cruzado. Ten en cuenta que solo la autenticación HTTP Basic es configurable a través de este parámetro. Para tokens Bearer y similares, usa encabezados `Authorization` personalizados.

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

`withXSRFToken` controla si axios lee la cookie XSRF y establece el encabezado XSRF en las solicitudes del navegador. Acepta:

- `undefined` _(predeterminado)_ — establece el encabezado XSRF solo para solicitudes del mismo origen.
- `true` — siempre establece el encabezado XSRF, incluso para solicitudes de origen cruzado.
- `false` — nunca establece el encabezado XSRF.
- `(config: InternalAxiosRequestConfig) => boolean | undefined` — un callback que decide por solicitud, recibiendo el objeto de configuración interna.

```ts
withXSRFToken: boolean | undefined | ((config: InternalAxiosRequestConfig) => boolean | undefined);
```

::: warning XSRF de origen cruzado y `withCredentials`
`withCredentials` controla si las solicitudes de origen cruzado incluyen credenciales (cookies, autenticación HTTP). En versiones anteriores de axios, establecer `withCredentials: true` provocaba implícitamente que axios estableciera el encabezado XSRF para solicitudes de origen cruzado. Las versiones más recientes de axios separan estas responsabilidades: para permitir que el encabezado XSRF se envíe en solicitudes de origen cruzado debes establecer **ambos** `withCredentials: true` y `withXSRFToken: true`.

```js
axios.get('/user', { withCredentials: true, withXSRFToken: true });
```
:::

### `onUploadProgress`

La función `onUploadProgress` te permite escuchar el progreso de una carga.

### `onDownloadProgress`

La función `onDownloadProgress` te permite escuchar el progreso de una descarga.

### `maxContentLength` <Badge type="warning" text="HTTP Node.js/fetch" />

La propiedad `maxContentLength` define el tamaño máximo de la respuesta en bytes. El adaptador HTTP de Node.js lo aplica en respuestas almacenadas en búfer y en streaming. El adaptador fetch lo aplica cuando la longitud de la respuesta está declarada, se puede rastrear el stream de respuesta o se puede determinar el tamaño de la respuesta.

> ⚠️ **Seguridad:** el valor por defecto es `-1` (sin límite). Las respuestas sin límite combinadas con la descompresión gzip/deflate/brotli/zstd permiten ataques de denegación de servicio por bomba de descompresión.
> Establece un límite explícito al consumir servidores en los que no confíes plenamente.

### `maxBodyLength` <Badge type="warning" text="HTTP Node.js/fetch" />

La propiedad `maxBodyLength` define el tamaño máximo del cuerpo de la solicitud en bytes. El adaptador HTTP de Node.js lo aplica, y el adaptador fetch lo aplica cuando se puede determinar la longitud del cuerpo de la solicitud.

### `redact`

La propiedad `redact` es un arreglo opcional de nombres de claves de configuración que se enmascararán cuando un `AxiosError` se serialice con `toJSON()`. La coincidencia es insensible a mayúsculas/minúsculas y recursiva a lo largo de la configuración de la solicitud serializada. Los valores coincidentes se reemplazan por `[REDACTED ****]`.

`redact` solo afecta a la serialización del error. No modifica los datos de la solicitud, los encabezados ni el objeto de configuración original.

```js
axios.get('/user/12345', {
  headers: { Authorization: 'Bearer token' },
  auth: { username: 'me', password: 'secret' },
  redact: ['authorization', 'password']
}).catch((error) => {
  console.log(error.toJSON().config);
});
```

### `validateStatus`

La función `validateStatus` te permite sobreescribir la validación predeterminada del código de estado. Por defecto, axios rechazará la Promise si el código de estado no está en el rango 200-299. Puedes sobreescribir este comportamiento proporcionando una función `validateStatus` personalizada. La función debe devolver `true` si el código de estado está dentro del rango que deseas aceptar.

Por defecto, un `validateStatus: undefined` explícito conserva el comportamiento heredado y resuelve todos los estados de respuesta, porque `transitional.validateStatusUndefinedResolves` tiene `true` como valor predeterminado. Establece `transitional.validateStatusUndefinedResolves` en `false` si quieres que un `validateStatus: undefined` explícito se comporte como si `validateStatus` se hubiera omitido; así axios usa el validador configurado/predeterminado y rechaza las respuestas que no sean 2xx por defecto.

`validateStatus: null` sigue aceptando todos los estados de respuesta. Si desactivas el comportamiento transicional y quieres intencionalmente resolver todos los estados, usa `validateStatus: null` o un validador que devuelva `true`.

```js
axios.get('/user/12345', {
  validateStatus: undefined,
  transitional: {
    validateStatusUndefinedResolves: false
  }
});
```

### `maxRedirects` <Badge type="warning" text="Solo en Node.js" />

La propiedad `maxRedirects` define el número máximo de redirecciones a seguir. Si se establece en 0, no se seguirá ninguna redirección.

### `sensitiveHeaders` <Badge type="warning" text="Solo en Node.js" />

La propiedad `sensitiveHeaders` es un arreglo opcional de nombres de encabezados personalizados que contienen secretos, como `X-API-Key`, que el adaptador HTTP de Node.js elimina al seguir una redirección a un origen diferente. La coincidencia no distingue mayúsculas/minúsculas. Las redirecciones al mismo origen conservan estos encabezados. Si `maxRedirects` es `0`, axios no sigue redirecciones y `sensitiveHeaders` no se usa.

```js
axios.get('https://api.example.com/users', {
  headers: { 'X-API-Key': 'secret' },
  sensitiveHeaders: ['X-API-Key']
});
```

### `beforeRedirect`

La función `beforeRedirect` te permite modificar la solicitud antes de que sea redirigida. Úsala para ajustar las opciones de la solicitud al redirigir, para inspeccionar los últimos encabezados de respuesta, o para cancelar la solicitud lanzando un error. Si `maxRedirects` se establece en 0, `beforeRedirect` no se usa.

```js
beforeRedirect: (options, { headers }) => {
  if (
    options.hostname === "example.com" &&
    options.protocol === "https:"
  ) {
    options.auth = "user:password";
  }
}
```

::: warning Seguridad: reinyección de credenciales en redirecciones
El hook `beforeRedirect` se ejecuta **después** de que se eliminan los encabezados sensibles durante las redirecciones. La librería `follow-redirects` elimina las credenciales en una bajada de protocolo (HTTPS → HTTP) por seguridad. Como `beforeRedirect` se ejecuta después, reinyectar credenciales sin verificar el protocolo de destino puede exponer datos sensibles. Reinyecta credenciales únicamente para destinos HTTPS de confianza, y evita reinyectarlas en redirecciones con bajada de protocolo.
:::

### `socketPath` <Badge type="warning" text="Solo en Node.js" />

La propiedad `socketPath` define un socket UNIX que se usará en lugar de una conexión TCP. Por ejemplo, `/var/run/docker.sock` para enviar solicitudes al daemon de Docker. Solo se puede especificar `socketPath` o `proxy`. Si ambos se especifican, se usa `socketPath`.

:::warning Seguridad
Cuando se establece `socketPath`, el hostname y el puerto de la URL se ignoran y axios se comunica directamente con el socket Unix indicado. Si cualquier parte de la configuración de la solicitud proviene de entrada del usuario (por ejemplo, en un proxy o manejador de webhooks que reenvía opciones), un atacante puede inyectar `socketPath` para redirigir el tráfico a sockets locales privilegiados como `/var/run/docker.sock`, `/run/containerd/containerd.sock` o `/run/systemd/private`, eludiendo por completo las protecciones SSRF basadas en hostname (CWE-918). Filtra la configuración recibida desde entradas no confiables y/o restringe las rutas de socket aceptadas con `allowedSocketPaths` (ver más abajo).
:::

### `allowedSocketPaths` <Badge type="warning" text="Solo en Node.js" />

Restringe qué rutas de socket pueden usarse a través de `socketPath`. Acepta un string o un array de strings. Cuando está definido, axios resuelve el `socketPath` y lo compara con cada entrada (también resuelta); la solicitud se rechaza con un `AxiosError` de código `ERR_BAD_OPTION_VALUE` si no hay coincidencia. Si no se define (valor por defecto), `socketPath` se comporta igual que antes.

```js
const client = axios.create({
  allowedSocketPaths: ['/var/run/docker.sock']
});

// permitido
await client.get('http://localhost/v1.45/info', { socketPath: '/var/run/docker.sock' });

// rechazado — no está en la lista
await client.get('http://localhost/pods', { socketPath: '/var/run/kubelet.sock' });
```

Un array vacío (`allowedSocketPaths: []`) bloquea todas las rutas de socket.

### `transport`

La propiedad `transport` define el transporte a usar para la solicitud. Es útil para hacer solicitudes sobre un protocolo diferente, como `http2`.

### `httpAgent` y `httpsAgent`

`httpAgent` y `httpsAgent` definen un agente personalizado para usar al realizar solicitudes http y https respectivamente en Node.js. Esto permite añadir opciones como `keepAlive` que no están habilitadas por defecto.

### `proxy`

`proxy` define el nombre de host, puerto y protocolo del servidor proxy que deseas usar. También puedes definir tu proxy usando las variables de entorno convencionales `http_proxy` y `https_proxy`.

Si usas variables de entorno para tu configuración de proxy, también puedes definir una variable de entorno `no_proxy` como una lista separada por comas de dominios que no deben ser enviados a través del proxy.

Usa `false` para deshabilitar los proxies, ignorando las variables de entorno. `auth` indica que se debe usar autenticación HTTP Basic para conectarse al proxy, y proporciona las credenciales. Esto establecerá un encabezado `Proxy-Authorization`, sobrescribiendo cualquier encabezado `Proxy-Authorization` personalizado que hayas definido usando `headers`. Si el servidor proxy usa HTTPS, debes establecer el protocolo en `https`.

Un encabezado `Host` proporcionado por el usuario en `headers` se preserva al reenviar a través de un proxy (coincidencia insensible a mayúsculas en `host` / `Host` / `HOST`). Esto te permite apuntar a un host virtual distinto al de la URL de la solicitud — por ejemplo, llegar a `127.0.0.1:4000` mientras el proxy trata la solicitud como `example.com`. Si no se proporciona ningún encabezado `Host`, axios lo establece por defecto al `hostname:port` de la URL de la solicitud, como antes.

Para destinos `https://`, axios establece un túnel CONNECT a través del proxy y realiza TLS de extremo a extremo con el origen. `Proxy-Authorization` se envía solo en la solicitud CONNECT, nunca en la solicitud TLS encapsulada. Las opciones TLS de `httpsAgent`, como `ca`, `cert`, `key` y `rejectUnauthorized`, se reenvían al agente de túnel generado para que sigan aplicándose a la conexión TLS con el origen. Si proporcionas un `HttpsProxyAgent`, axios deja el túnel a cargo de ese agente.

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

La propiedad `decompress` indica si los datos de la respuesta deben descomprimirse automáticamente. El valor predeterminado es `true`. El adaptador HTTP de Node.js admite gzip, deflate, brotli y zstd cuando el runtime actual de Node.js proporciona el descompresor zlib correspondiente.

### `insecureHTTPParser`

Indica si se debe usar un parser HTTP inseguro que acepta encabezados HTTP inválidos. Esto puede permitir la interoperabilidad con implementaciones HTTP no conformes. Se debe evitar el uso del parser inseguro.

Ten en cuenta que la opción `insecureHTTPParser` solo está disponible en Node.js 12.10.0 y versiones posteriores. Consulta la [documentación de Node.js](https://nodejs.org/en/blog/vulnerability/february-2020-security-releases/#strict-http-header-parsing-none) para más información. Consulta el conjunto completo de opciones [aquí](https://nodejs.org/dist/latest-v12.x/docs/api/http.html#http_http_request_url_options_callback).

### `transitional`

La propiedad `transitional` te permite habilitar o deshabilitar ciertas características de transición. Las siguientes opciones están disponibles:

- `silentJSONParsing`: Si se establece en `true` _(predeterminado)_, axios ignora silenciosamente los errores de parseo de JSON y establece `response.data` en `null` cuando el parseo falla. Establécelo en `false` para que se lance `SyntaxError` en su lugar.

  ::: tip Importante
  Esta opción solo tiene efecto cuando `responseType` se establece **explícitamente** en `'json'`. Cuando `responseType` se omite, axios usa `forcedJSONParsing` para intentar el parseo de JSON y devuelve silenciosamente la cadena cruda en caso de fallo, sin importar este ajuste. Para hacer que el JSON inválido lance un error, establece ambos:

  ```js
  { responseType: 'json', transitional: { silentJSONParsing: false } }
  ```
  :::

- `forcedJSONParsing`: Fuerza a axios a analizar la cadena de respuesta como JSON incluso si `responseType` no es `'json'`.
- `clarifyTimeoutError`: Clarifica el mensaje de error cuando una solicitud expira. Es útil cuando depuras problemas de timeout.
- `validateStatusUndefinedResolves`: Si se establece en `true` _(predeterminado)_, un `validateStatus: undefined` explícito resuelve todos los estados de respuesta por compatibilidad. Establécelo en `false` para tratar `undefined` explícito como si `validateStatus` se hubiera omitido, de modo que axios use el validador configurado/predeterminado. Usa `validateStatus: null` o un validador que devuelva `true` cuando quieras intencionalmente resolver todos los estados.
- `advertiseZstdAcceptEncoding`: Cuando se establece en `true`, axios añade `zstd` al encabezado `Accept-Encoding` predeterminado cuando el runtime actual de Node.js soporta descompresión zstd. Las respuestas zstd se descomprimen automáticamente cuando son compatibles y `decompress` es `true`.
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
  // `data` es específico de cada solicitud: axios no lo hereda ni lo fusiona en profundidad desde los valores predeterminados.
  // Para agregar campos compartidos al cuerpo, usa un interceptor de solicitud o transformRequest.
  formDataHeaderPolicy: "legacy",
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
  redact: ['authorization', 'password'],
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  },
  maxRedirects: 21,
  sensitiveHeaders: ['X-API-Key'],
  beforeRedirect: (options, { headers }) => {
    if (options.hostname === "typicode.com") {
      options.auth = "user:password";
    }
  },
  socketPath: null,
  allowedSocketPaths: null,
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
    validateStatusUndefinedResolves: true,
    advertiseZstdAcceptEncoding: false,
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
