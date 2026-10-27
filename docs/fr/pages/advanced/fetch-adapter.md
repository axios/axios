# Adaptateur Fetch <Badge type="tip" text="Nouveau" />

L'adaptateur `fetch` est un nouvel adaptateur introduit à partir de la version 1.7.0. Il permet d'utiliser axios avec l'API `fetch`, vous offrant ainsi le meilleur des deux mondes. Par défaut, `fetch` sera utilisé si les adaptateurs `xhr` et `http` ne sont pas disponibles dans le build, ou non supportés par l'environnement. Pour l'utiliser par défaut, il doit être sélectionné explicitement en définissant l'option `adapter` à `fetch` lors de la création d'une instance axios.

```js
import axios from 'axios';

const instance = axios.create({
  adapter: 'fetch',
});
```

L'adaptateur supporte les mêmes fonctionnalités que l'adaptateur `xhr`, notamment la capture de la progression des envois et téléchargements. Il supporte également des types de réponse supplémentaires tels que `stream` et `formdata` (si l'environnement les prend en charge).

Lorsque `auth` est omis, l'adaptateur fetch peut lire les identifiants HTTP Basic depuis l'URL de requête, par exemple `https://user:pass@example.com`. Les identifiants d'URL encodés en pourcentage sont décodés avant la génération de l'en-tête `Authorization`, et `auth` prend le dessus sur les identifiants intégrés à l'URL.

## Limites de taille de réponse

Lorsque `maxContentLength` est défini, l'adaptateur fetch rejette avec `ERR_BAD_RESPONSE` si la réponse dépasse la limite, y compris pendant la lecture du corps. L'erreur conserve la `config` et la `request` courantes même lorsque le runtime encapsule ou supprime l'erreur de stream d'origine, de sorte qu'elle n'est pas signalée comme une erreur réseau. Contrairement à une erreur `ERR_BAD_RESPONSE` causée par un statut 5xx, une erreur de limite de taille n'a pas d'`error.response`.

```js
try {
  await axios.get('https://example.com/large-file', {
    adapter: 'fetch',
    maxContentLength: 10 * 1024 * 1024, // 10 Mo
  });
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_BAD_RESPONSE' && !error.response) {
      console.error('Response too large:', error.message);
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Network failure');
    }
  }
}
```

Avec `responseType: 'stream'` ou `'response'`, la requête est résolue dès que le flux de la réponse est disponible. axios ne rejette la requête de manière anticipée que lorsqu'un `Content-Length` déclaré dépasse déjà la limite. Sinon, la vérification de taille a lieu pendant la lecture du flux, et un corps trop volumineux fait échouer la lecture avec le même `ERR_BAD_RESPONSE` après la résolution de la promesse de la requête. Gérez donc aussi les erreurs pendant la consommation du flux :

```js
const response = await axios.get('https://example.com/large-file', {
  adapter: 'fetch',
  responseType: 'stream',
  maxContentLength: 10 * 1024 * 1024, // 10 Mo
});

const reader = response.data.getReader();

try {
  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    // traiter chunk.value
  }
} catch (error) {
  if (axios.isAxiosError(error) && error.code === 'ERR_BAD_RESPONSE') {
    console.error('Response too large:', error.message);
  }
}
```

## Redirections

Par défaut, l'adaptateur fetch laisse le runtime suivre les redirections. Définir `maxRedirects: 0` demande le mode de redirection manuel de la plateforme (`redirect: 'manual'`). Ce que vous recevez dépend alors du runtime fetch :

- Node.js peut exposer le statut `3xx` et son en-tête `Location`. Avec le `validateStatus` par défaut, cette réponse est rejetée ; acceptez les statuts `3xx` pour la gérer vous-même.
- Les navigateurs retournent une redirection opaque avec le statut `0` et des en-têtes inaccessibles, si bien que l'emplacement cible ne peut pas être lu.

```js
const response = await axios.get('https://example.com/old-path', {
  adapter: 'fetch',
  maxRedirects: 0,
  validateStatus: (status) => status < 400,
});

// Dans Node.js, par exemple : 301 'https://example.com/new-path'
console.log(response.status, response.headers.get('location'));
```

Ne vous appuyez pas sur le comportement de Node.js dans du code destiné au navigateur. Les valeurs positives de `maxRedirects` ne limitent pas le nombre de redirections dans l'adaptateur fetch ; seule la valeur `0` modifie son comportement.

## Fetch personnalisé <Badge type="tip" text="v1.12.0+" />

À partir de `v1.12.0`, vous pouvez personnaliser l'adaptateur fetch pour utiliser une fonction `fetch` personnalisée au lieu de celle de l'environnement global. Vous pouvez passer une fonction `fetch`, ainsi que des constructeurs `Request` et `Response` personnalisés via l'option de configuration `env`. Cela est utile lorsque vous travaillez avec des environnements personnalisés ou des frameworks d'application qui fournissent leur propre implémentation de `fetch`.

::: info
Lorsque vous utilisez une fonction `fetch` personnalisée, vous devrez peut-être également fournir des constructeurs `Request` et `Response` correspondants. Si vous les omettez, les constructeurs globaux seront utilisés. Si votre `fetch` personnalisé est incompatible avec les constructeurs globaux, passez `null` pour les désactiver.

**Remarque :** Définir `Request` et `Response` à `null` rendra impossible pour l'adaptateur fetch de capturer la progression des envois et téléchargements.
:::

### Arguments passés à un fetch personnalisé

Lorsqu'un constructeur `Request` est disponible, axios appelle votre `fetch` avec la `Request` entièrement résolue comme premier argument et une copie filtrée de `fetchOptions` comme second. Le second argument conserve vos propres champs personnalisés, mais omet les champs qu'axios gère via la `Request` : `method`, `headers`, `body`, `signal`, `duplex` et `credentials`. Lisez ces valeurs depuis la `Request` :

```js
const instance = axios.create({
  adapter: 'fetch',
  fetchOptions: { cache: 'no-store', tag: 'reports' },
  env: {
    fetch: (request, options) => {
      console.log(request.method, request.headers.get('content-type'));
      console.log(options.cache, options.tag); // 'no-store' 'reports'
      return fetch(request, options);
    },
  },
});
```

Lorsque `Request` est désactivé (`Request: null`), axios appelle plutôt `fetch(url, options)` avec l'ensemble des options résolues.

### Constructeurs `Response` personnalisés

axios encapsule le corps de la réponse dans un `ReadableStream<Uint8Array>` suivi et le passe à `env.Response` lorsque le runtime prend en charge les streams de réponse, que la réponse a un corps et que l'une des conditions suivantes s'applique :

- `maxContentLength` est activé (un nombre supérieur à `-1`), même sans callback de progression ;
- `onDownloadProgress` est défini ;
- `responseType` vaut `'stream'` ou `'response'` et la requête utilise un `signal`, un `cancelToken` ou un `timeout`.

Un constructeur `Response` personnalisé doit accepter ce stream et le transmettre sans modification ; sinon, les limites de taille, la progression et le suivi de l'annulation ne peuvent pas fonctionner. La signature TypeScript d'`env.Response` conserve son type de corps historique pour des raisons de compatibilité : un constructeur qui passe la vérification de types n'est donc pas garanti de prendre en charge les corps de type stream à l'exécution.

```js
class CustomResponse extends Response {
  constructor(body, init) {
    // `body` peut être un ReadableStream suivi : transmettez-le tel quel
    super(body, init);
  }
}

const instance = axios.create({
  adapter: 'fetch',
  maxContentLength: 10 * 1024 * 1024,
  onDownloadProgress: (e) => console.log(e.loaded),
  env: { fetch: customFetch, Response: CustomResponse },
});
```

### Exemple de base

```js
import customFetchFunction from 'customFetchModule';

const instance = axios.create({
  adapter: 'fetch',
  onDownloadProgress(e) {
    console.log('downloadProgress', e);
  },
  env: {
    fetch: customFetchFunction,
    Request: null, // null -> désactiver le constructeur
    Response: null,
  },
});
```

### Utilisation avec Tauri

[Tauri](https://tauri.app/plugin/http-client/) fournit une fonction `fetch` de plateforme qui contourne les restrictions CORS du navigateur pour les requêtes effectuées depuis la couche native. L'exemple ci-dessous montre une configuration minimale pour utiliser axios dans une application Tauri avec ce fetch personnalisé.

```js
import { fetch } from '@tauri-apps/plugin-http';
import axios from 'axios';

const instance = axios.create({
  adapter: 'fetch',
  onDownloadProgress(e) {
    console.log('downloadProgress', e);
  },
  env: {
    fetch,
  },
});

const { data } = await instance.get('https://google.com');
```

### Utilisation avec SvelteKit

[SvelteKit](https://svelte.dev/docs/kit/web-standards#Fetch-APIs) fournit une implémentation `fetch` personnalisée pour les fonctions `load` côté serveur qui gère la transmission des cookies et les URLs relatives. Comme son `fetch` est incompatible avec l'API `URL` standard, axios doit être configuré pour l'utiliser explicitement, et les constructeurs `Request` et `Response` globaux doivent être désactivés.

```js
export async function load({ fetch }) {
  const { data: post } = await axios.get('https://jsonplaceholder.typicode.com/posts/1', {
    adapter: 'fetch',
    env: {
      fetch,
      Request: null,
      Response: null,
    },
  });

  return { post };
}
```
