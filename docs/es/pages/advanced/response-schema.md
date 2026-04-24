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
