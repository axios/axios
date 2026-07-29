# TypeScript

`axios` incluye definiciones de TypeScript en el paquete npm a través de `index.d.ts` (ESM) e `index.d.cts` (CJS), por lo que la verificación de tipos y el soporte del editor funcionan de manera nativa para ambos formatos de módulo.

## Consideraciones sobre la resolución de módulos

Dado que axios publica de forma dual con una exportación por defecto ESM y un `module.exports` CJS, hay algunas consideraciones de configuración:

- La configuración recomendada es `"moduleResolution": "node16"` (implícita en `"module": "node16"`). Esto requiere TypeScript 4.7 o superior.
- Si usas ESM, tu configuración debería estar bien.
- Si compilas TypeScript a CJS y no puedes usar `"moduleResolution": "node16"`, debes habilitar `esModuleInterop`.
- Si usas TypeScript para verificar tipos en código JavaScript CJS, tu única opción es `"moduleResolution": "node16"`.

## Type guards para errores de axios

Usa el type guard `axios.isAxiosError` para reducir de forma segura los errores `unknown` en bloques `catch`. Tras la reducción, puedes acceder a propiedades específicas de axios como `error.response`, `error.config` y `error.code` con seguridad de tipos completa.

```ts
import axios from "axios";

let user: User | null = null;
try {
  const { data } = await axios.get("/user?ID=12345");
  user = data.userDetails;
} catch (error) {
  if (axios.isAxiosError(error)) {
    handleAxiosError(error);
  } else {
    handleUnexpectedError(error);
  }
}
```

Usa `axios.isCancel<T>()` para reducir los errores de cancelación a `CanceledError<T>`:

```ts
const controller = new AbortController();

try {
  await axios.get<User>("/user?ID=12345", { signal: controller.signal });
} catch (error) {
  if (axios.isCancel<User>(error)) {
    handleCancellation(error);
  }
}
```

## Tipado de los datos de solicitud y los parámetros de consulta

`AxiosRequestConfig<D = any, P = any>` usa `D` para los datos de la solicitud y `P` para los parámetros de consulta. Un serializador de parámetros personalizado recibe el mismo `P`:

```ts
import axios, {
  type AxiosPromise,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

interface RequestBody {
  includeArchived: boolean;
}

interface SearchParams {
  query: string;
  page?: number;
}

interface SearchResponse {
  results: string[];
}

const searchConfig: AxiosRequestConfig<RequestBody, SearchParams> = {
  data: { includeArchived: false },
  params: { query: "axios", page: 1 },
  paramsSerializer: (params) => `${params.query}:${params.page ?? 1}`,
};

const response = await axios.get("/search", searchConfig);
response.config.data;   // RequestBody | undefined
response.config.params; // SearchParams | undefined

const invalidConfig: AxiosRequestConfig<RequestBody, SearchParams> = {
  // @ts-expect-error `query` debe ser una cadena
  params: { query: 123 },
};
```

Los resultados predeterminados conservan `D` y `P` en `response.config`, incluso cuando los alias de solicitud infieren esos tipos a partir de una configuración tipada. `RawAxiosRequestConfig`, `InternalAxiosRequestConfig`, `AxiosDefaults`, `CreateAxiosDefaults`, `AxiosResponse`, `AxiosPromise`, `AxiosError`, `CanceledError`, las instancias invocables, los adaptadores y `mergeConfig()` también conservan el tipo de los parámetros.

Los métodos de solicitud añaden `P` como último genérico —`<T, R, D, P>`— para mantener sin cambios las posiciones existentes de datos de respuesta (`T`), respuesta personalizada (`R`) y datos de solicitud (`D`). Un tipo de respuesta personalizado proporcionado explícitamente sigue controlando el valor resuelto. `P` vale `any` por defecto para mantener la compatibilidad.

Un adaptador u otra promesa tipada explícitamente puede conservar ambos tipos de la solicitud:

```ts
const searchAdapter = (
  config: InternalAxiosRequestConfig<RequestBody, SearchParams>
): AxiosPromise<SearchResponse, RequestBody, SearchParams> =>
  Promise.resolve({
    data: { results: [] },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });

declare const error: unknown;

if (axios.isCancel<SearchResponse, RequestBody, SearchParams>(error)) {
  error.config?.data;   // RequestBody | undefined
  error.config?.params; // SearchParams | undefined
}
```

## Instancias e interceptores tipados

Anota el resultado de `axios.create` con `AxiosInstance`, y anota los interceptores de solicitud con `InternalAxiosRequestConfig` para obtener verificación de tipos de extremo a extremo en un cliente personalizado:

```ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const apiClient: AxiosInstance = axios.create({
  baseURL: "https://api.example.com",
  timeout: 10000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Añadir token de autenticación, registrar, etc.
  return config;
});
```

## Configuración de solicitud personalizada con claves de tipo símbolo

axios conserva las propiedades de símbolo propias y enumerables al combinar la configuración predeterminada con la de cada solicitud. Las aplicaciones pueden ampliar `AxiosRequestConfig` con una clave de símbolo específica y leer la opción desde `InternalAxiosRequestConfig` en un interceptor o adaptador:

```ts
import axios from "axios";

export const someFlag: unique symbol = Symbol(
  "some flag used in request interceptor"
);

declare module "axios" {
  interface AxiosRequestConfig<D = any, P = any> {
    [someFlag]?: boolean;
  }
}

axios.interceptors.request.use((config) => {
  if (config[someFlag]) {
    config.headers.set("X-Some-Flag", "enabled");
  }
  return config;
});

await axios.get("/users", { [someFlag]: true });
```

Solo se copian las propiedades de símbolo propias y enumerables. Las propiedades de símbolo heredadas o no enumerables no se copian.

## Tipado de los datos de respuesta

Los métodos de solicitud de Axios son genéricos sobre el tipo de los datos de respuesta. Pasa un parámetro de tipo a `axios.get<T>` (y a los demás alias) para tipar `response.data`:

```ts
interface User {
  id: number;
  name: string;
}

const { data } = await apiClient.get<User>("/users/1");
// `data` está tipado como `User`
```
