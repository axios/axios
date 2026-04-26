# Referencia de la API

A continuación se presenta una lista de todas las funciones y clases disponibles en el paquete axios. Estas funciones pueden usarse e importarse en tu proyecto. Todas ellas están protegidas por nuestro renovado compromiso de seguir el versionado semántico. Esto significa que puedes confiar en que estas funciones y clases permanecerán estables y sin cambios en futuras versiones, salvo que se realice un cambio de versión mayor.

## Instancia

La instancia `axios` es el objeto principal que usarás para realizar solicitudes HTTP. Es una función de fábrica que crea una nueva instancia de la clase `Axios`. La instancia `axios` cuenta con una serie de métodos para hacer solicitudes HTTP, los cuales están documentados en la [sección de alias de solicitud](/pages/advanced/request-method-aliases) de la documentación.

## Clases

### `Axios`

La clase `Axios` es la clase principal que usarás para realizar solicitudes HTTP. Es una función de fábrica que crea una nueva instancia de la clase `Axios`. La clase `Axios` cuenta con una serie de métodos para hacer solicitudes HTTP, los cuales están documentados en la [sección de alias de solicitud](/pages/advanced/request-method-aliases) de la documentación.

#### `constructor`

Crea una nueva instancia de la clase `Axios`. El constructor acepta un objeto de configuración opcional como argumento.

```ts
constructor(instanceConfig?: AxiosRequestConfig);
```

#### `request`

Gestiona la invocación de la solicitud y la resolución de la respuesta. Este es el método principal que usarás para hacer solicitudes HTTP. Acepta un objeto de configuración como argumento y devuelve una Promise que se resuelve en el objeto de respuesta.

```ts
request(configOrUrl: string | AxiosRequestConfig<D>, config: AxiosRequestConfig<D>): Promise<AxiosResponse<T>>;
```

### `CancelToken` <Badge type="danger" text="Obsoleto en favor de AbortController" />

La clase `CancelToken` estaba basada en la propuesta `tc39/proposal-cancelable-promises`. Se usaba para crear un token que permitiera cancelar una solicitud HTTP. La clase `CancelToken` está ahora obsoleta en favor de la API `AbortController`.

A partir de la versión 0.22.0, la clase `CancelToken` está obsoleta y será eliminada en una versión futura. Se recomienda usar la API `AbortController` en su lugar.

La clase se exporta principalmente por compatibilidad con versiones anteriores y será eliminada en una versión futura. Desaconsejamos fuertemente su uso en proyectos nuevos, por lo que no documentamos su API.

## Funciones

### `AxiosError`

La clase `AxiosError` es una clase de error que se lanza cuando una solicitud HTTP falla. Extiende la clase `Error` y añade propiedades adicionales al objeto de error.

#### `constructor`

Crea una nueva instancia de la clase `AxiosError`. El constructor acepta opcionalmente un mensaje, un código, una configuración, una solicitud y una respuesta como argumentos.

```ts
constructor(message?: string, code?: string, config?: InternalAxiosRequestConfig<D>, request?: any, response?: AxiosResponse<T, D>);
```

#### `properties`

La clase `AxiosError` proporciona las siguientes propiedades:

```ts
// Instancia de configuración.
config?: InternalAxiosRequestConfig<D>;

// Código de error.
code?: string;

// Instancia de solicitud.
request?: any;

// Instancia de respuesta.
response?: AxiosResponse<T, D>;

// Booleano que indica si el error es un `AxiosError`.
isAxiosError: boolean;

// Código de estado HTTP del error.
status?: number;

// Método auxiliar para convertir el error a un objeto JSON.
toJSON: () => object;

// Causa del error.
cause?: Error;
```

### `AxiosHeaders`

La clase `AxiosHeaders` es una clase de utilidad que se usa para gestionar encabezados HTTP. Provee métodos para manipular encabezados, como añadir, eliminar y obtener encabezados.

Aquí solo se documentan los métodos principales. Para una lista completa de métodos, consulta el archivo de declaración de tipos.

#### `constructor`

Crea una nueva instancia de la clase `AxiosHeaders`. El constructor acepta opcionalmente un objeto de encabezados como argumento.

```ts
constructor(headers?: RawAxiosHeaders | AxiosHeaders | string);
```

#### `set`

Agrega un encabezado al objeto de encabezados.

```ts
set(headerName?: string, value?: AxiosHeaderValue, rewrite?: boolean | AxiosHeaderMatcher): AxiosHeaders;
set(headers?: RawAxiosHeaders | AxiosHeaders | string, rewrite?: boolean): AxiosHeaders;
```

#### `get`

Obtiene un encabezado del objeto de encabezados.

```ts
get(headerName: string, parser: RegExp): RegExpExecArray | null;
get(headerName: string, matcher?: true | AxiosHeaderParser): AxiosHeaderValue;
```

#### `has`

Verifica si un encabezado existe en el objeto de encabezados.

```ts
has(header: string, matcher?: AxiosHeaderMatcher): boolean;
```

#### `delete`

Elimina un encabezado del objeto de encabezados.

```ts
delete(header: string | string[], matcher?: AxiosHeaderMatcher): boolean;
```

#### `clear`

Elimina todos los encabezados del objeto de encabezados.

```ts
clear(matcher?: AxiosHeaderMatcher): boolean;
```

#### `normalize`

Normaliza el objeto de encabezados.

```ts
normalize(format: boolean): AxiosHeaders;
```

#### `concat`

Concatena objetos de encabezados.

```ts
concat(...targets: Array<AxiosHeaders | RawAxiosHeaders | string | undefined | null>): AxiosHeaders;
```

#### `toJSON`

Convierte el objeto de encabezados a un objeto JSON.

```ts
toJSON(asStrings?: boolean): RawAxiosHeaders;
```

### `CanceledError` <Badge type="tip" text="Extiende AxiosError" />

La clase `CanceledError` es una clase de error que se lanza cuando se cancela una solicitud HTTP. Extiende la clase `AxiosError`.

### `Cancel` <Badge type="tip" text="Alias de CanceledError" />

La clase `Cancel` es un alias de la clase `CanceledError`. Se exporta por compatibilidad con versiones anteriores y será eliminada en una versión futura.

### `isCancel`

Una función que verifica si un error es un `CanceledError`. Es útil para distinguir cancelaciones intencionales de errores inesperados.

```ts
isCancel(value: any): boolean;
```

```js
import axios from "axios";

const controller = new AbortController();

axios.get("/api/data", { signal: controller.signal }).catch((error) => {
  if (axios.isCancel(error)) {
    console.log("Request was cancelled:", error.message);
  } else {
    console.error("Unexpected error:", error);
  }
});

controller.abort("User navigated away");
```

### `isAxiosError`

Una función que verifica si un error es un `AxiosError`. Úsala en bloques `catch` para acceder de forma segura a las propiedades específicas de axios como `error.response` y `error.config`.

```ts
isAxiosError(value: any): value is AxiosError;
```

```js
import axios from "axios";

try {
  await axios.get("/api/resource");
} catch (error) {
  if (axios.isAxiosError(error)) {
    // error.response, error.config, error.code are all available
    console.error("HTTP error", error.response?.status, error.message);
  } else {
    // A non-axios error (e.g. a programming mistake)
    throw error;
  }
}
```

### `all` <Badge type="danger" text="Obsoleto en favor de Promise.all" />

La función `all` es una función de utilidad que acepta un arreglo de promises y devuelve una única Promise que se resuelve cuando todas las promises del arreglo se han resuelto. La función `all` está ahora obsoleta en favor del método `Promise.all`. Se recomienda usar el método `Promise.all` en su lugar.

A partir de la versión 0.22.0, la función `all` está obsoleta y será eliminada en una versión futura. Se recomienda usar el método `Promise.all` en su lugar.

### `spread`

La función `spread` es una función de utilidad que puede usarse para distribuir un arreglo de argumentos en una llamada a función. Es útil cuando tienes un arreglo de argumentos que deseas pasar a una función que acepta múltiples argumentos.

```ts
spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
```

### `toFormData`

Convierte un objeto JavaScript plano (o anidado) a una instancia de `FormData`. Es útil cuando deseas construir datos de formulario multipart de forma programática a partir de un objeto.

```ts
toFormData(sourceObj: object, formData?: FormData, options?: FormSerializerOptions): FormData;
```

```js
import { toFormData } from "axios";

const data = { name: "Jay", avatar: fileBlob };
const form = toFormData(data);
// form is now a FormData instance ready to post
await axios.post("/api/users", form);
```

### `formToJSON`

Convierte una instancia de `FormData` de vuelta a un objeto JavaScript plano. Es útil para leer datos de formulario en un formato estructurado.

```ts
formToJSON(form: FormData): object;
```

```js
import { formToJSON } from "axios";

const form = new FormData();
form.append("name", "Jay");
form.append("role", "admin");

const obj = formToJSON(form);
console.log(obj); // { name: "Jay", role: "admin" }
```

### `getAdapter`

Resuelve y devuelve una función de adaptador por nombre o pasando un arreglo de nombres candidatos. axios usa esto internamente para seleccionar el mejor adaptador disponible para el entorno actual.

```ts
getAdapter(adapters: string | string[]): AxiosAdapter;
```

```js
import { getAdapter } from "axios";

// Get the fetch adapter explicitly
const fetchAdapter = getAdapter("fetch");

// Get the best available adapter from a priority list
const adapter = getAdapter(["fetch", "xhr", "http"]);
```

### `mergeConfig`

Combina dos objetos de configuración de axios, aplicando la misma estrategia de fusión profunda que axios usa internamente al combinar los valores predeterminados con las opciones por solicitud. Los valores posteriores tienen precedencia.

```ts
mergeConfig<T>(config1: AxiosRequestConfig<T>, config2: AxiosRequestConfig<T>): AxiosRequestConfig<T>;
```

```js
import { mergeConfig } from "axios";

const base = { baseURL: "https://api.example.com", timeout: 5000 };
const override = { timeout: 10000, headers: { "X-Custom": "value" } };

const merged = mergeConfig(base, override);
// { baseURL: "https://api.example.com", timeout: 10000, headers: { "X-Custom": "value" } }
```

## Constantes

### `HttpStatusCode`

Un objeto que contiene una lista de códigos de estado HTTP como constantes con nombre. Úsalo para escribir condicionales legibles en lugar de números directos.

```js
import axios, { HttpStatusCode } from "axios";

try {
  const response = await axios.get("/api/resource");
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === HttpStatusCode.NotFound) {
      console.error("Resource not found");
    } else if (error.response?.status === HttpStatusCode.Unauthorized) {
      console.error("Authentication required");
    }
  }
}
```

## Miscelánea

### `VERSION`

La versión actual del paquete `axios`. Es una cadena que representa el número de versión del paquete. Se actualiza con cada nueva versión del paquete.
