# TypeScript

`axios` fournit des définitions de types TypeScript dans le package npm via `index.d.ts` (ESM) et `index.d.cts` (CJS), de sorte que la vérification de types et le support de l'éditeur fonctionnent immédiatement pour les deux formats de modules.

## Nuances de résolution de modules

Comme axios publie à la fois avec un export par défaut ESM et un `module.exports` CJS, il existe quelques nuances de configuration à prendre en compte :

- Le paramètre recommandé est `"moduleResolution": "node16"` (impliqué par `"module": "node16"`). Cela nécessite TypeScript 4.7 ou supérieur.
- Si vous utilisez ESM, vos paramètres devraient convenir.
- Si vous compilez TypeScript en CJS et ne pouvez pas utiliser `"moduleResolution": "node16"`, vous devez activer `esModuleInterop`.
- Si vous utilisez TypeScript pour vérifier les types de code JavaScript CJS, votre seule option est `"moduleResolution": "node16"`.

## Type guards pour les erreurs axios

Utilisez le type guard `axios.isAxiosError` pour affiner en toute sécurité les erreurs `unknown` dans les blocs `catch`. Après l'affinement, vous pouvez accéder aux propriétés spécifiques à axios telles que `error.response`, `error.config` et `error.code` avec une sécurité de type complète.

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

Utilisez `axios.isCancel<T>()` pour affiner les erreurs d'annulation en `CanceledError<T>` :

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

## Typage des données de requête et des paramètres de requête

`AxiosRequestConfig<D = any, P = any>` utilise `D` pour les données de requête et `P` pour les paramètres de requête. Un sérialiseur de paramètres personnalisé reçoit le même `P` :

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
  // @ts-expect-error `query` doit être une chaîne
  params: { query: 123 },
};
```

Les résultats de requête par défaut conservent `D` et `P` dans `response.config`, y compris lorsque les alias de requête infèrent ces types depuis une configuration typée. `RawAxiosRequestConfig`, `InternalAxiosRequestConfig`, `AxiosDefaults`, `CreateAxiosDefaults`, `AxiosResponse`, `AxiosPromise`, `AxiosError`, `CanceledError`, les instances appelables, les adaptateurs et `mergeConfig()` conservent également le type des paramètres.

Les méthodes de requête ajoutent `P` comme dernier générique —`<T, R, D, P>`— afin que les positions existantes des données de réponse (`T`), de la réponse personnalisée (`R`) et des données de requête (`D`) restent inchangées. Un type de réponse personnalisé fourni explicitement continue de contrôler la valeur résolue. `P` vaut `any` par défaut pour préserver la compatibilité.

Un adaptateur ou une autre promise explicitement typée peut conserver les deux types de requête :

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

## Instances et intercepteurs typés

Annotez le résultat de `axios.create` avec `AxiosInstance`, et annotez les intercepteurs de requête avec `InternalAxiosRequestConfig` pour obtenir une vérification de types de bout en bout sur un client personnalisé :

```ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const apiClient: AxiosInstance = axios.create({
  baseURL: "https://api.example.com",
  timeout: 10000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Ajouter un token d'authentification, journaliser, etc.
  return config;
});
```

## Configuration de requête personnalisée avec des clés symboles

axios préserve les propriétés symboles propres et énumérables lorsqu'il fusionne les valeurs par défaut et la configuration de chaque requête. Une application peut augmenter le module `AxiosRequestConfig` avec une clé symbole précise, puis lire cette option depuis `InternalAxiosRequestConfig` dans un intercepteur ou un adaptateur :

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

Seules les propriétés symboles propres et énumérables sont copiées. Les propriétés symboles héritées ou non énumérables ne le sont pas.

## Typage des données de réponse

Les méthodes de requête axios sont génériques par rapport au type de données de réponse. Passez un paramètre de type à `axios.get<T>` (et aux autres alias) pour typer `response.data` :

```ts
interface User {
  id: number;
  name: string;
}

const { data } = await apiClient.get<User>("/users/1");
// `data` est typé comme `User`
```
