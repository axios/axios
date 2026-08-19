# Nouvelles tentatives et récupération sur erreur

Les requêtes réseau peuvent échouer pour des raisons transitoires — une défaillance momentanée du serveur, une brève interruption du réseau, ou une réponse de limitation de débit. Implémenter une stratégie de nouvelle tentative dans un intercepteur vous permet de gérer ces échecs de manière transparente, sans polluer votre code applicatif.

## Nouvelle tentative de base avec un intercepteur de réponse

L'approche la plus simple consiste à intercepter des codes de statut d'erreur spécifiques et à renvoyer immédiatement la requête originale un nombre limité de fois :

```js
import axios from "axios";

const api = axios.create({ baseURL: "https://api.example.com" });

const MAX_RETRIES = 3;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Ne réessayer que pour les erreurs réseau ou les erreurs serveur 5xx
    const shouldRetry =
      !error.response || (error.response.status >= 500 && error.response.status < 600);

    if (!shouldRetry) {
      return Promise.reject(error);
    }

    config._retryCount = config._retryCount ?? 0;

    if (config._retryCount >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    config._retryCount += 1;
    return api(config);
  }
);
```

## Délai exponentiel

Réessayer immédiatement après un échec peut surcharger un serveur déjà en difficulté. Le délai exponentiel attend progressivement plus longtemps entre chaque tentative :

```js
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    const shouldRetry =
      !error.response || (error.response.status >= 500 && error.response.status < 600);

    if (!shouldRetry) return Promise.reject(error);

    config._retryCount = config._retryCount ?? 0;

    if (config._retryCount >= 3) return Promise.reject(error);

    config._retryCount += 1;

    // Attendre 200ms, 400ms, 800ms, ... avant chaque nouvelle tentative
    const backoff = 100 * 2 ** config._retryCount;
    await delay(backoff);

    return api(config);
  }
);
```

## Nouvelle tentative sur 429 (limite de débit) avec Retry-After

Lorsque le serveur répond avec `429 Too Many Requests`, il inclut souvent un en-tête `Retry-After` indiquant exactement combien de temps attendre :

```js
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (error.response?.status !== 429) return Promise.reject(error);

    config._retryCount = config._retryCount ?? 0;
    if (config._retryCount >= 3) return Promise.reject(error);

    config._retryCount += 1;

    const retryAfterHeader = error.response.headers["retry-after"];
    const waitMs = retryAfterHeader
      ? parseFloat(retryAfterHeader) * 1000  // l'en-tête est en secondes
      : 1000;                                // par défaut 1 seconde

    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return api(config);
  }
);
```

## Désactiver les nouvelles tentatives pour une requête spécifique

Si certaines requêtes ne doivent jamais être réessayées (ex. des mutations non idempotentes que vous ne voulez pas dupliquer), ajoutez un indicateur à la configuration de la requête :

```js
// Ajoutez ceci dans votre intercepteur avant la logique de nouvelle tentative :
if (config._noRetry) return Promise.reject(error);

// Puis désactivez les nouvelles tentatives pour des appels spécifiques :
await api.post("/payments/charge", body, { _noRetry: true });
```

## Combiner nouvelles tentatives et annulation

Utilisez un `AbortController` pour annuler une requête qui attend un délai de backoff :

```js
const controller = new AbortController();

try {
  await api.get("/api/data", { signal: controller.signal });
} catch (error) {
  if (axios.isCancel(error)) {
    console.log("Request aborted by user");
  }
}

// Annuler la requête (et tout délai de nouvelle tentative en attente) depuis un autre endroit :
controller.abort();
```
