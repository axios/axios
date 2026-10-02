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

## Fetch personnalisé <Badge type="tip" text="v1.12.0+" />

À partir de `v1.12.0`, vous pouvez personnaliser l'adaptateur fetch pour utiliser une fonction `fetch` personnalisée au lieu de celle de l'environnement global. Vous pouvez passer une fonction `fetch`, ainsi que des constructeurs `Request` et `Response` personnalisés via l'option de configuration `env`. Cela est utile lorsque vous travaillez avec des environnements personnalisés ou des frameworks d'application qui fournissent leur propre implémentation de `fetch`.

::: info
Lorsque vous utilisez une fonction `fetch` personnalisée, vous devrez peut-être également fournir des constructeurs `Request` et `Response` correspondants. Si vous les omettez, les constructeurs globaux seront utilisés. Si votre `fetch` personnalisé est incompatible avec les constructeurs globaux, passez `null` pour les désactiver.

**Remarque :** Définir `Request` et `Response` à `null` rendra impossible pour l'adaptateur fetch de capturer la progression des envois et téléchargements.
:::

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
