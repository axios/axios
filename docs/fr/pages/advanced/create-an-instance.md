# Créer une instance

`axios.create()` vous permet de créer une instance axios préconfigurée. L'instance partage la même API de requête et de réponse que l'objet `axios` par défaut, mais utilise la configuration que vous fournissez comme base pour chaque requête. C'est la façon recommandée d'utiliser axios dans toute application dépassant un seul fichier.

```ts
import axios from "axios";

const instance = axios.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
  headers: { "X-Custom-Header": "foobar" },
});
```

La méthode `create` accepte l'objet complet de [Configuration de requête](/pages/advanced/request-config). Vous pouvez ensuite utiliser l'instance exactement comme l'objet axios par défaut :

```js
const response = await instance.get("/users/1");
```

## Pourquoi utiliser une instance ?

### URL de base par service

Dans la plupart des applications, vous communiquez avec plusieurs API. Créer une instance distincte par service évite de répéter l'URL de base à chaque appel :

```js
const githubApi = axios.create({ baseURL: "https://api.github.com" });
const internalApi = axios.create({ baseURL: "https://api.internal.example.com" });

const { data: repos } = await githubApi.get("/users/axios/repos");
const { data: users } = await internalApi.get("/users");
```

### En-têtes d'authentification partagés

Attachez un token d'authentification à chaque requête d'une instance sans toucher aux autres :

```js
const authApi = axios.create({
  baseURL: "https://api.example.com",
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});
```

### Délais d'attente et nouvelles tentatives par service

Différents services ont des caractéristiques de fiabilité différentes. Définissez un délai court pour les services temps réel et un délai long pour les traitements par lots :

```js
const realtimeApi = axios.create({ baseURL: "https://realtime.example.com", timeout: 2000 });
const batchApi    = axios.create({ baseURL: "https://batch.example.com",    timeout: 60000 });
```

### Intercepteurs isolés

Les intercepteurs ajoutés à une instance ne s'appliquent qu'à cette instance, ce qui permet de bien séparer les responsabilités :

```js
const loggingApi = axios.create({ baseURL: "https://api.example.com" });

loggingApi.interceptors.request.use((config) => {
  console.log(`→ ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});
```

## Surcharger les valeurs par défaut par requête

La configuration passée au moment de la requête remplace toujours les valeurs par défaut de l'instance :

```js
const api = axios.create({ timeout: 5000 });

// Cette requête spécifique utilise un délai de 30 secondes à la place
await api.get("/slow-endpoint", { timeout: 30000 });
```

::: tip
Les valeurs par défaut de l'instance peuvent également être modifiées après sa création en écrivant dans `instance.defaults` :

```js
instance.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
```
:::
