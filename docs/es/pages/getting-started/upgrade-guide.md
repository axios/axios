# Guía de actualización

Esta guía tiene como objetivo ayudarte a actualizar tu proyecto de una versión del framework a otra. Se recomienda leer las notas de la versión de cada versión mayor desde la que estás migrando, ya que pueden contener información importante sobre cambios que rompen la compatibilidad.

## Actualización a v1.21.0

### Instancias de clases personalizadas como valores predeterminados de encabezados

Bajo `headers.common` y claves de método como `headers.post`, axios ahora trata solo los objetos planos, los objetos con prototipo nulo y las instancias de `AxiosHeaders` como grupos de valores predeterminados, de modo que se conservan los encabezados literales con nombre de método, como `Link`. Si asignas una instancia de tu propia clase como grupo, conviértela en un objeto plano (`{ post: { ...customDefaults } }`) o en `new AxiosHeaders({ ...customDefaults })`. De lo contrario, su representación como cadena se envía como un encabezado literal en cada solicitud, incluidas las solicitudes con otros métodos, lo que puede exponer contenido incluido por un `toString()` personalizado. Consulta [Valores predeterminados de encabezados por método](/es/pages/advanced/config-defaults#valores-predeterminados-de-encabezados-por-metodo).

## Actualización a v1.20.0

### El fetch personalizado recibe un segundo argumento filtrado

Cuando hay un constructor `Request` disponible, un `env.fetch` personalizado sigue recibiendo `fetchOptions` como segundo argumento, pero sin `method`, `headers`, `body`, `signal`, `duplex` ni `credentials`. Estos valores están representados por la `Request` resuelta que se pasa como primer argumento, y omitirlos evita que el segundo argumento la sobrescriba. Las implementaciones de fetch personalizadas que leen esos campos desde el segundo argumento deben leerlos desde la `Request`. Consulta [Argumentos pasados a un fetch personalizado](/es/pages/advanced/fetch-adapter#argumentos-pasados-a-un-fetch-personalizado).

### Adaptador fetch y `maxRedirects: 0`

El adaptador fetch asigna `maxRedirects: 0` al modo de redirección manual de la plataforma en lugar de seguir las redirecciones. En Node.js, la respuesta `3xx` y su encabezado `Location` pueden ser visibles; los navegadores devuelven una redirección opaca con estado `0` y encabezados ilegibles. Los valores positivos siguen sin limitar el número de redirecciones en el adaptador fetch. Consulta [Redirecciones del adaptador fetch](/es/pages/advanced/fetch-adapter#redirecciones).

### HTTP/2 y proxies

Las solicitudes con `httpVersion: 2` y un objeto `proxy` explícito se rechazan con `ERR_NOT_SUPPORT`. Las solicitudes HTTP/2 ignoran las variables de entorno de proxy y la configuración `proxyEnv` de los agentes y se conectan directamente, así que no uses HTTP/2 donde el uso de proxy sea una política de salida obligatoria. `proxy: false` sigue conectándose directamente. Consulta [Proxies de HTTP2](/es/pages/advanced/http2#proxies).

### Configuraciones de reemplazo desde interceptores de solicitud

Cuando un interceptor de solicitud devuelve un objeto que no es un objeto escribible con prototipo nulo, como un literal de objeto, una copia `{ ...config }` o una instancia de clase, axios lo copia en una instantánea filtrada con prototipo nulo antes del envío. Los campos heredados de un prototipo definido por la aplicación se copian como campos propios, pero la instantánea no conserva la identidad del objeto, su prototipo, las comprobaciones `instanceof`, los descriptores de acceso ni los atributos de las propiedades. Los campos heredados a través de un prototipo cuyo propio prototipo es `null`, como una plantilla `Object.create(null)`, se ignoran. Devolver la configuración original, u otro objeto escribible con prototipo nulo sin claves inseguras, conserva su identidad, y axios actualiza en ese objeto campos como `headers` y `data` durante el envío. Consulta [Devolver un objeto de configuración diferente](/es/pages/advanced/interceptors#devolver-un-objeto-de-configuracion-diferente).

### Nombres de códigos de estado de la RFC 9110

`HttpStatusCode.ContentTooLarge` (413) y `HttpStatusCode.UnprocessableContent` (422) son los nombres preferidos. `PayloadTooLarge` y `UnprocessableEntity` siguen disponibles como alias obsoletos durante toda la v1.x, y las búsquedas inversas numéricas siguen devolviendo los nombres heredados.

## Actualización a v1.19.0

### Se rechazan las URL HTTP(S) malformadas

Ahora las solicitudes rechazan una `url` o `baseURL` `http:` o `https:` que omita `//` después del protocolo. Sustituye valores como `https:example.com` o `https:/example.com` por una URL bien formada como `https://example.com`. El `AxiosError` resultante usa el código `ERR_INVALID_URL` e identifica de forma segura la URL incorrecta con sus secretos ocultos. Este cambio de seguridad intencional evita que la normalización de URL malformadas eluda `baseURL` o las listas de direcciones permitidas.

### Errores de interceptores de solicitud síncronos

Cuando un interceptor de solicitud síncrono lanza un error, axios invoca su manejador de rechazo emparejado y detiene los interceptores de solicitud restantes. Un manejador de rechazo que retorna normalmente trata el error como resuelto y envía la solicitud con la última configuración válida; su valor de retorno no se convierte en la configuración. Si una validación debe impedir el envío, omite el manejador de rechazo o haz que lance o devuelva una Promise rechazada. Los errores terminales continúan por los interceptores de rechazo de respuesta.

## Actualización de v0.x a v1.x

### Cambios en la declaración de importación

En v1.x, la declaración de importación fue modificada para usar la exportación `default`. Esto significa que deberás actualizar tus importaciones para usar la exportación `default`.

```diff
- import { axios } from "axios";
+ import axios from "axios";
```

### Cambios en el sistema de interceptores

En v1.x debes usar el tipo `InternalAxiosRequestConfig` para tipar el parámetro `config` en el interceptor de `request`. Esto se debe a que el parámetro `config` ahora es del tipo `InternalAxiosRequestConfig` en lugar del tipo público `AxiosRequestConfig`.

```diff
- axios.interceptors.request.use((config: AxiosRequestConfig) => {
+ axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    return config;
  });
```

### Cambios en la estructura de los encabezados de solicitud

En v1.x, la estructura de los encabezados de solicitud fue modificada para eliminar la propiedad `common`. Esto significa que deberás actualizar tu código para usar la nueva estructura de encabezados de solicitud de la siguiente manera:

```diff
- if (request.headers?.common?.Authorization) {
-       request.headers.common.Authorization = ...
+ if (request.headers?.Authorization) {
+       request.headers.Authorization = ...
```

Los encabezados predeterminados que antes estaban bajo `common`, `get`, `post`, etc., ahora se definen directamente en `axios.defaults.headers`:

```diff
- axios.defaults.headers.common["Accept"] = "application/json";
+ axios.defaults.headers["Accept"] = "application/json";
```

### Datos multipart en formularios

Si una solicitud incluye un payload de tipo `FormData`, el encabezado `Content-Type: multipart/form-data` ahora se establece automáticamente. Elimina cualquier encabezado manual para evitar duplicados:

```diff
- axios.post("/upload", formData, {
-   headers: { "Content-Type": "multipart/form-data" },
- });
+ axios.post("/upload", formData);
```

Si defines explícitamente `Content-Type: application/json`, axios ahora serializará automáticamente los datos a JSON.

### Serialización de parámetros

v1.x introdujo varios cambios que rompen la compatibilidad en la forma en que se serializan los parámetros de URL. Los más importantes son:

**Los `params` ahora se codifican por porcentaje (percent-encoded) de forma predeterminada.** Si tu backend esperaba corchetes sin codificar al estilo qs, puede que necesites configurar un serializador personalizado:

```js
import qs from 'qs';

axios.create({
  paramsSerializer: {
    serialize: (params) => qs.stringify(params, { arrayFormat: 'brackets' }),
  },
});
```

**Los objetos anidados en `params` ahora se serializan con notación de corchetes** (`foo[bar]=1`) en lugar de notación de punto. Si tu backend esperaba notación de punto, usa un serializador personalizado.

**Los parámetros con valor `null` o `undefined`** ahora se manejan de forma consistente: los valores `null` se serializan como cadenas vacías, mientras que los valores `undefined` se omiten completamente.

Para ver todas las opciones de configuración de serialización de parámetros, consulta la página de [Configuración de solicitud](/pages/advanced/request-config).

### Los internos ya no se exportan

Hemos decidido dejar de exportar los internos de axios. Esto significa que deberás actualizar tu código para usar únicamente la API pública de axios. Este cambio se realizó para simplificar la API y reducir la superficie expuesta de axios, permitiéndonos modificar los internos sin declararlos como cambios que rompen la compatibilidad.

Consulta la [Referencia de la API](/pages/advanced/api-reference) en este sitio para obtener la información más actualizada sobre la API pública de axios.

### Configuración de solicitud

Hemos realizado cambios en el objeto de configuración de solicitud. Consulta la [referencia de configuración](/pages/advanced/request-config) en este sitio para obtener la información más actualizada.

### Cambios que rompen la compatibilidad no cubiertos

Esta guía no es exhaustiva y puede no cubrir todos los cambios que rompen la compatibilidad. Si encuentras algún problema, por favor abre un issue en el [repositorio GitHub de la documentación](https://github.com/axios/docs) con la etiqueta `breaking change`.
