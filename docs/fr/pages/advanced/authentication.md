# Authentification

La plupart des APIs requièrent une forme d'authentification. Cette page couvre les schémas les plus courants pour attacher des identifiants aux requêtes axios.

## Tokens Bearer (JWT)

L'approche la plus courante consiste à attacher un JWT dans l'en-tête `Authorization`. La façon la plus propre de procéder est via un intercepteur de requête sur votre instance axios, afin que le token soit lu à jour à chaque requête :

```js
import axios from "axios";

const api = axios.create({ baseURL: "https://api.example.com" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});
```

## Authentification HTTP Basic

Pour les APIs utilisant l'authentification HTTP Basic, passez l'option `auth`. axios encodera les identifiants et définira automatiquement l'en-tête `Authorization` :

```js
const response = await axios.get("https://api.example.com/data", {
  auth: {
    username: "myUser",
    password: "myPassword",
  },
});
```

Si `auth` n'est pas fourni, les adaptateurs HTTP Node.js et fetch peuvent aussi déduire les identifiants Basic depuis l'URL de requête, par exemple `https://myUser:myPassword@api.example.com/data`. Les identifiants encodés en pourcentage dans l'URL sont décodés avant la génération de l'en-tête `Authorization`. Pour le nouveau code, préférez l'option explicite `auth` ; elle prend le dessus sur les identifiants intégrés à l'URL.

### Noms d'utilisateur UTF-8

Par défaut, les adaptateurs XHR et fetch conservent leur gestion existante des noms d'utilisateur pour des raisons de compatibilité :

- L'adaptateur XHR envoie le nom d'utilisateur sous forme de caractères historiques sur un octet (Latin-1) et le mot de passe en UTF-8.
- L'adaptateur fetch envoie des identifiants UTF-8, mais rejette les noms d'utilisateur contenant des caractères au-delà de U+00FF.

Dans les deux adaptateurs, un nom d'utilisateur non pris en charge est rejeté avec `ERR_BAD_OPTION_VALUE`. Si votre serveur attend des noms d'utilisateur Basic auth en UTF-8, définissez `transitional.encodeBasicAuthUsername: true` par requête ou sur une instance :

```js
await axios.get('/account', {
  auth: { username: 'π', password: 'secret' },
  transitional: { encodeBasicAuthUsername: true },
});
```

Une valeur `false` au niveau de la requête remplace l'activation au niveau de l'instance, par exemple pour un point de terminaison XHR historique qui attend des octets Latin-1 pour le nom d'utilisateur :

```js
const api = axios.create({
  transitional: { encodeBasicAuthUsername: true },
});

await api.get('/legacy/account', {
  auth: { username: 'café', password: 'secret' },
  transitional: { encodeBasicAuthUsername: false },
});
```

Gardez à l'esprit les points suivants :

- Si vous convertissez actuellement vous-même les noms d'utilisateur en chaînes d'octets UTF-8, supprimez cette conversion lorsque vous activez l'option afin d'éviter un double encodage.
- N'activez pas l'option pour les serveurs XHR qui attendent des octets Latin-1 historiques pour le nom d'utilisateur.
- Définir l'option à `false` ne fait pas envoyer du Latin-1 aux adaptateurs fetch ou HTTP Node.js.
- L'option n'affecte ni l'adaptateur HTTP Node.js ni les identifiants intégrés à l'URL d'une requête fetch.
- Les noms d'utilisateur ASCII et vides sont encodés de la même manière dans les deux cas. Les chaînes UTF-16 mal formées sont toujours rejetées avec `ERR_BAD_OPTION_VALUE`.
- axios ne négocie pas le jeu de caractères à partir du challenge d'authentification du serveur et ne normalise pas les chaînes Unicode.

::: tip
Pour les tokens Bearer et les clés API, utilisez un en-tête `Authorization` personnalisé plutôt que l'option `auth` — `auth` est réservé à l'authentification HTTP Basic.
:::

## Clés API

Les clés API sont généralement passées sous forme d'en-tête ou de paramètre de requête, selon ce qu'attend l'API :

```js
// En tant qu'en-tête
const api = axios.create({
  baseURL: "https://api.example.com",
  headers: { "X-API-Key": "your-api-key-here" },
});

// En tant que paramètre de requête
const response = await axios.get("https://api.example.com/data", {
  params: { apiKey: "your-api-key-here" },
});
```

## Renouvellement de token

Lorsque les tokens d'accès expirent, vous devez les renouveler silencieusement et réessayer la requête échouée. Un intercepteur de réponse est l'endroit idéal pour implémenter cela :

```js
import axios from "axios";

const api = axios.create({ baseURL: "https://api.example.com" });

// Suivre si un renouvellement est déjà en cours pour éviter des appels parallèles
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Mettre la requête en file d'attente jusqu'à la fin du renouvellement
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post("/auth/refresh", {
          refreshToken: localStorage.getItem("refresh_token"),
        });

        const newToken = data.access_token;
        localStorage.setItem("access_token", newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Rediriger vers la connexion ou émettre un événement
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

## Authentification par cookie

Pour les APIs basées sur les sessions qui s'appuient sur les cookies, définissez `withCredentials: true` pour inclure les cookies dans les requêtes cross-origin :

```js
const api = axios.create({
  baseURL: "https://api.example.com",
  withCredentials: true, // envoyer les cookies avec chaque requête
});
```

::: warning
`withCredentials: true` exige que le serveur réponde avec `Access-Control-Allow-Credentials: true` et un `Access-Control-Allow-Origin` spécifique (pas de joker).
:::
