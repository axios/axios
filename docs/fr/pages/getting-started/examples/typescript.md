# Exemple TypeScript

## Importer les types

axios inclut des définitions TypeScript prêtes à l'emploi. Vous pouvez importer les types dont vous avez besoin directement depuis `"axios"` :

```ts
import axios from "axios";
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
```

## Typer une requête

Utilisez un paramètre de type générique sur la réponse pour indiquer à TypeScript la forme que prendront vos données :

```ts
import axios from "axios";

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

const response = await axios.get<Post>("https://jsonplaceholder.typicode.com/posts/1");

console.log(response.data.title); // TypeScript sait que c'est une string
```

## Typer une fonction

Encapsulez les requêtes dans des fonctions avec des types de retour explicites pour une sécurité de type maximale :

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

## Typer une requête POST

Vous pouvez typer à la fois le corps de la requête et la réponse attendue :

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

## Instance axios typée

Créez une instance typée afin d'y intégrer votre URL de base et vos en-têtes :

```ts
import axios from "axios";
import type { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
});
```

## Intercepteurs typés

Utilisez `InternalAxiosRequestConfig` (et non `AxiosRequestConfig`) pour les intercepteurs de requête dans v1.x :

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

## Typer les erreurs

Utilisez `axios.isAxiosError()` pour affiner le type d'une erreur capturée :

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
    // error.response?.data est typé comme ApiError
    console.error(error.response?.data.message);
    console.error(error.response?.status);
  } else {
    throw error;
  }
}
```

## Notes sur la configuration TypeScript

Comme axios publie à la fois des versions ESM et CJS, il existe quelques nuances selon votre configuration :

- Le paramètre recommandé est `"moduleResolution": "node16"` (impliqué par `"module": "node16"`). Cela nécessite TypeScript 4.7 ou supérieur.
- Si vous compilez TypeScript vers CJS et ne pouvez pas utiliser `"moduleResolution": "node16"`, activez `"esModuleInterop": true`.
- Si vous utilisez TypeScript pour vérifier les types de code JavaScript CJS, votre seule option est `"moduleResolution": "node16"`.
