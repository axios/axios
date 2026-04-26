# Guía de actualización

Esta guía tiene como objetivo ayudarte a actualizar tu proyecto de una versión del framework a otra. Se recomienda leer las notas de la versión de cada versión mayor desde la que estás migrando, ya que pueden contener información importante sobre cambios que rompen la compatibilidad.

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
