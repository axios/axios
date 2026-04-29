# Adaptadores

Los adaptadores te permiten personalizar la forma en que axios maneja los datos de la solicitud. De forma predeterminada, axios usa una lista de prioridad ordenada de `['xhr', 'http', 'fetch']` y selecciona el primer adaptador que sea compatible con el entorno actual. En la práctica, esto significa que `xhr` se usa en los navegadores, `http` en Node.js y `fetch` en entornos donde ninguno de los dos está disponible (como Cloudflare Workers o Deno).

Escribir tu propio adaptador te permite controlar completamente cómo axios realiza una solicitud y procesa la respuesta — útil para pruebas, transportes personalizados o entornos no estándar.

## Adaptadores integrados

Puedes seleccionar un adaptador integrado por nombre usando la opción de configuración `adapter`:

```js
// Use the fetch adapter
const instance = axios.create({ adapter: "fetch" });

// Use the XHR adapter (browser default)
const instance = axios.create({ adapter: "xhr" });

// Use the HTTP adapter (Node.js default)
const instance = axios.create({ adapter: "http" });
```

También puedes pasar un arreglo de nombres de adaptadores. axios usará el primero que sea compatible con el entorno actual:

```js
const instance = axios.create({ adapter: ["fetch", "xhr", "http"] });
```

Para más detalles sobre el adaptador `fetch`, consulta la página del [Adaptador Fetch](/pages/advanced/fetch-adapter).

## Crear un adaptador personalizado

Para crear un adaptador personalizado, escribe una función que acepte un objeto `config` y devuelva una Promise que se resuelva en un objeto de respuesta de axios válido.

```js
import axios from "axios";
import { settle } from "axios/unsafe/core/settle.js";

function myAdapter(config) {
  /**
   * At this point:
   * - config has been merged with defaults
   * - request transformers have run
   * - request interceptors have run
   *
   * The adapter is now responsible for making the request
   * and returning a valid response object.
   */

  return new Promise((resolve, reject) => {
    // Perform your custom request logic here.
    // This example uses the native fetch API as a starting point.
    fetch(config.url, {
      method: config.method?.toUpperCase() ?? "GET",
      headers: config.headers?.toJSON() ?? {},
      body: config.data,
      signal: config.signal,
    })
      .then(async (fetchResponse) => {
        const responseData = await fetchResponse.text();

        const response = {
          data: responseData,
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          headers: Object.fromEntries(fetchResponse.headers.entries()),
          config,
          request: null,
        };

        // settle resolves or rejects the promise based on the HTTP status
        settle(resolve, reject, response);

        /**
         * After this point:
         * - response transformers will run
         * - response interceptors will run
         */
      })
      .catch(reject);
  });
}

const instance = axios.create({ adapter: myAdapter });
```

::: tip
El helper `settle` resuelve la Promise para códigos de estado 2xx y la rechaza para todo lo demás, siguiendo el comportamiento predeterminado de axios. Si deseas una validación de estado personalizada, usa la opción de configuración `validateStatus`.
:::
