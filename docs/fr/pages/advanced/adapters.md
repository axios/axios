# Adaptateurs

Les adaptateurs vous permettent de personnaliser la façon dont axios gère les données de la requête. Par défaut, axios utilise une liste de priorité ordonnée `['xhr', 'http', 'fetch']` et sélectionne le premier adaptateur pris en charge par l'environnement actuel. En pratique, cela signifie que `xhr` est utilisé dans les navigateurs, `http` dans Node.js, et `fetch` dans les environnements où ni l'un ni l'autre n'est disponible (comme Cloudflare Workers ou Deno).

Écrire votre propre adaptateur vous donne un contrôle total sur la façon dont axios effectue une requête et traite la réponse — utile pour les tests, les transports personnalisés ou les environnements non standard.

## Adaptateurs intégrés

Vous pouvez sélectionner un adaptateur intégré par nom en utilisant l'option de configuration `adapter` :

```js
// Utiliser l'adaptateur fetch
const instance = axios.create({ adapter: "fetch" });

// Utiliser l'adaptateur XHR (par défaut dans les navigateurs)
const instance = axios.create({ adapter: "xhr" });

// Utiliser l'adaptateur HTTP (par défaut dans Node.js)
const instance = axios.create({ adapter: "http" });
```

Vous pouvez également passer un tableau de noms d'adaptateurs. axios utilisera le premier pris en charge par l'environnement actuel :

```js
const instance = axios.create({ adapter: ["fetch", "xhr", "http"] });
```

Pour plus de détails sur l'adaptateur `fetch`, consultez la page [Adaptateur Fetch](/pages/advanced/fetch-adapter).

## Créer un adaptateur personnalisé

Pour créer un adaptateur personnalisé, écrivez une fonction qui accepte un objet `config` et retourne une Promise qui se résout vers un objet de réponse axios valide.

```js
import axios from "axios";
import { settle } from "axios/unsafe/core/settle.js";

function myAdapter(config) {
  /**
   * À ce stade :
   * - la configuration a été fusionnée avec les valeurs par défaut
   * - les transformateurs de requête ont été exécutés
   * - les intercepteurs de requête ont été exécutés
   *
   * L'adaptateur est maintenant responsable de l'exécution de la requête
   * et du retour d'un objet de réponse valide.
   */

  return new Promise((resolve, reject) => {
    // Effectuez votre logique de requête personnalisée ici.
    // Cet exemple utilise l'API native fetch comme point de départ.
    fetch(config.url, {
      method: config.method?.toUpperCase() ?? "GET",
      headers: config.headers?.toJSON() ?? {},
      body: config.data,
      signal: config.signal,
    })
      .then(async (fetchResponse) => {
        const responseData = await fetchResponse.text();

        const response = {
          data: responseData,
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          headers: Object.fromEntries(fetchResponse.headers.entries()),
          config,
          request: null,
        };

        // settle résout ou rejette la promise selon le statut HTTP
        settle(resolve, reject, response);

        /**
         * Après ce point :
         * - les transformateurs de réponse seront exécutés
         * - les intercepteurs de réponse seront exécutés
         */
      })
      .catch(reject);
  });
}

const instance = axios.create({ adapter: myAdapter });
```

::: tip
Le helper `settle` résout la promise pour les codes de statut 2xx et la rejette pour tout le reste, conformément au comportement par défaut d'axios. Si vous souhaitez une validation de statut personnalisée, utilisez plutôt l'option de configuration `validateStatus`.
:::
