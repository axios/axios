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
