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
