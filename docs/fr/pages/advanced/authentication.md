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
