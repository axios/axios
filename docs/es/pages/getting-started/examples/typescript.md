# Ejemplo en TypeScript

## Importar tipos

axios incluye definiciones de TypeScript de forma nativa. Puedes importar los tipos que necesites directamente desde `"axios"`:

```ts
import axios from "axios";
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
```

## Tipar una solicitud

Usa un parámetro de tipo genérico en la respuesta para indicarle a TypeScript la forma que tendrán tus datos:

```ts
import axios from "axios";

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

const response = await axios.get<Post>("https://jsonplaceholder.typicode.com/posts/1");

console.log(response.data.title); // TypeScript knows this is a string
```

## Tipar una función

Envuelve las solicitudes en funciones con tipos de retorno explícitos para maximizar la seguridad de tipos:

```ts
import axios, { AxiosResponse } from "axios";

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

const getPost = async (id: number): Promise<Post> => {
  const response = await axios.get<Post>(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );
  return response.data;
};
```

## Tipar una solicitud POST

Puedes tipar tanto el cuerpo de la solicitud como la respuesta esperada:

```ts
type CreatePostBody = {
  title: string;
  body: string;
  userId: number;
};

type CreatePostResponse = CreatePostBody & { id: number };

const createPost = async (data: CreatePostBody): Promise<CreatePostResponse> => {
  const response = await axios.post<CreatePostResponse>(
    "https://jsonplaceholder.typicode.com/posts",
    data
  );
  return response.data;
};
```

## Instancia de axios tipada

Crea una instancia tipada para que la URL base y los encabezados queden definidos desde el inicio:

```ts
import axios from "axios";
import type { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
});
```

## Interceptores tipados

Usa `InternalAxiosRequestConfig` (no `AxiosRequestConfig`) para los interceptores de solicitud en v1.x:

```ts
import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse } from "axios";

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.set("Authorization", `Bearer ${getToken()}`);
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => Promise.reject(error)
);
```

## Tipar errores

Usa `axios.isAxiosError()` para acotar el tipo de un error capturado:

```ts
import axios, { AxiosError } from "axios";

type ApiError = {
  message: string;
  code: number;
};

try {
  await axios.get("/api/protected-resource");
} catch (error) {
  if (axios.isAxiosError<ApiError>(error)) {
    // error.response?.data is typed as ApiError
    console.error(error.response?.data.message);
    console.error(error.response?.status);
  } else {
    throw error;
  }
}
```

## Notas sobre la configuración de TypeScript

Dado que axios publica tanto en formato ESM como CJS, hay algunas consideraciones según tu configuración:

- La configuración recomendada es `"moduleResolution": "node16"` (implícita en `"module": "node16"`). Esto requiere TypeScript 4.7 o superior.
- Si compilas TypeScript a CJS y no puedes usar `"moduleResolution": "node16"`, habilita `"esModuleInterop": true`.
- Si usas TypeScript para verificar tipos en código JavaScript CJS, tu única opción es `"moduleResolution": "node16"`.
