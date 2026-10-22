# Encabezados <Badge type="tip" text="Nuevo" />

Axios expone su propia clase `AxiosHeaders` para manipular encabezados usando una API similar a Map que garantiza claves insensibles a mayúsculas y minúsculas. Esta clase es usada internamente por Axios para gestionar encabezados, pero también está disponible para el usuario por conveniencia. Aunque los encabezados HTTP no son sensibles a mayúsculas y minúsculas, Axios conservará el formato original del encabezado por razones estéticas y como solución alternativa cuando los servidores consideran erróneamente el caso del encabezado. La forma antigua de manipular directamente el objeto de encabezados sigue disponible, pero está obsoleta y no se recomienda para uso futuro.

## Trabajar con encabezados

La instancia del objeto `AxiosHeaders` puede contener diferentes tipos de valores internos que controlan la lógica de configuración y combinación. El objeto de encabezados final es obtenido por Axios mediante la llamada al método `toJSON`. El objeto `AxiosHeaders` también es iterable, por lo que puedes usarlo en bucles o convertirlo en un arreglo u objeto.

Los valores de los encabezados pueden ser de los siguientes tipos:

- `string` - valor de cadena de texto normal que se enviará al servidor
- `null` - omitir el encabezado al convertir a JSON
- `false` - omitir el encabezado al convertir a JSON; indica además que el método `set` debe ser llamado con la opción `rewrite` en `true` para sobreescribir este valor (Axios usa esto internamente para permitir que los usuarios opten por no instalar ciertos encabezados como `User-Agent` o `Content-Type`)
- `undefined` - el valor no está definido

::: warning
El valor del encabezado se considera definido si no es `undefined`.
:::

El objeto de encabezados siempre se inicializa dentro de los interceptores y transformadores, como se muestra en el siguiente ejemplo:

```js
axios.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  request.headers.set("My-header", "value");

  request.headers.set({
    "My-set-header1": "my-set-value1",
    "My-set-header2": "my-set-value2",
  });

  // Disable subsequent setting of this header by Axios
  request.headers.set("User-Agent", false);

  request.headers.setContentType("text/plain");

  // Direct access like this is deprecated
  request.headers["My-set-header2"] = "newValue";

  return request;
});
```

Puedes iterar sobre un `AxiosHeaders` usando cualquier método iterable, como un bucle for-of, forEach o el operador spread:

```js
const headers = new AxiosHeaders({
  foo: '1',
  bar: '2',
  baz: '3',
});

for (const [header, value] of headers) {
  console.log(header, value);
}

// foo 1
// bar 2
// baz 3
```

## Establecer encabezados en una solicitud

El lugar más común para establecer encabezados es la opción `headers` en la configuración de tu solicitud o en la configuración de la instancia:

```js
// On a single request
await axios.get('/api/data', {
  headers: {
    'Accept-Language': 'en-US',
    'X-Request-ID': 'abc123',
  },
});

// On an instance (applied to every request)
const api = axios.create({
  headers: {
    'X-App-Version': '2.0.0',
  },
});
```

## Preservar el formato de un encabezado específico

Los nombres de encabezados de Axios son insensibles a mayúsculas y minúsculas, pero `AxiosHeaders` conserva el formato de la primera clave coincidente que encuentra. Si necesitas un formato específico para un servidor con comportamiento sensible a mayúsculas y minúsculas no estándar, define un formato predeterminado en `defaults` y luego establece los valores normalmente.

```js
const api = axios.create();

api.defaults.headers.common = {
  'content-type': undefined,
  accept: undefined,
};

await api.put(url, data, {
  headers: {
    'Content-Type': 'application/octet-stream',
    Accept: 'application/json',
  },
});
```

También puedes hacerlo directamente con `AxiosHeaders` al componer encabezados:

```js
import axios, { AxiosHeaders } from 'axios';

const headers = AxiosHeaders.concat(
  { 'content-type': undefined },
  { 'Content-Type': 'application/octet-stream' }
);

await axios.put(url, data, { headers });
```

## Establecer encabezados en un interceptor

Los interceptores son el lugar adecuado para adjuntar encabezados dinámicos como tokens de autenticación, ya que el token puede no estar disponible cuando la instancia se crea por primera vez:

```js
api.interceptors.request.use((config) => {
  const token = getAuthToken(); // read at request time
  config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});
```

## Leer encabezados de respuesta

Los encabezados de respuesta están disponibles en `response.headers` como una instancia de `AxiosHeaders`. Todos los nombres de encabezados están en minúsculas:

```js
const response = await axios.get('/api/data');

console.log(response.headers['content-type']);
// application/json; charset=utf-8

console.log(response.headers.get('x-request-id'));
// abc123
```

## Eliminar un encabezado predeterminado

Para optar por no incluir un encabezado que axios establece por defecto (como `Content-Type` o `User-Agent`), establece su valor en `false`:

```js
await axios.post('/api/data', payload, {
  headers: {
    'Content-Type': false, // let the browser set it automatically (e.g. for FormData)
  },
});
```

Para más detalles sobre la API completa de métodos de `AxiosHeaders`, consulta la página de [Métodos de encabezados](/pages/advanced/header-methods).
