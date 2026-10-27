# Gestion des erreurs

axios peut lever de nombreux types d'erreurs différents. Certaines de ces erreurs sont causées par axios lui-même, tandis que d'autres sont causées par le serveur ou le client. Le tableau suivant liste la structure générale de l'erreur levée :

| Propriété | Définition                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| message   | Un résumé rapide du message d'erreur et du statut avec lequel elle a échoué.                                                                  |
| name      | Définit l'origine de l'erreur. Pour axios, ce sera toujours une `AxiosError`.                                                                 |
| stack     | Fournit la trace de pile de l'erreur.                                                                                                         |
| config    | Un objet de configuration axios avec les configurations d'instance spécifiques définies par l'utilisateur au moment de la requête.            |
| code      | Représente une erreur identifiée par axios. Le tableau ci-dessous liste les définitions spécifiques des erreurs internes d'axios.             |
| status    | Code de statut de la réponse HTTP. Consultez [ici](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes) pour la signification des codes de statut HTTP courants. |

Voici une liste des erreurs potentielles identifiées par axios :

| Code                      | Définition                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| ERR_BAD_OPTION_VALUE      | Valeur invalide ou non supportée fournie dans la configuration axios.                         |
| ERR_BAD_OPTION            | Option invalide fournie dans la configuration axios.                                          |
| ECONNABORTED              | Indique généralement que la requête a expiré (sauf si `transitional.clarifyTimeoutError` est défini) ou a été abandonnée par le navigateur ou son plugin. |
| ETIMEDOUT                 | La requête a expiré en dépassant la limite de temps par défaut d'axios. `transitional.clarifyTimeoutError` doit être défini à `true`, sinon une erreur générique `ECONNABORTED` sera levée à la place. |
| ERR_NETWORK               | Problème lié au réseau. Dans le navigateur, cette erreur peut également être causée par une violation de politique [CORS](https://developer.mozilla.org/ru/docs/Web/HTTP/Guides/CORS) ou de [contenu mixte](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content). Le navigateur ne permet pas au code JS de clarifier la raison réelle de l'erreur pour des raisons de sécurité ; veuillez vérifier la console. |
| ERR_FR_TOO_MANY_REDIRECTS | La requête est redirigée trop de fois ; dépasse le nombre maximum de redirections spécifié dans la configuration axios. |
| ERR_DEPRECATED            | Fonctionnalité ou méthode dépréciée utilisée dans axios.                                      |
| ERR_BAD_RESPONSE          | La réponse ne peut pas être analysée correctement ou est dans un format inattendu. Généralement lié à une réponse avec un code de statut `5xx`. |
| ERR_BAD_REQUEST           | La requête a un format inattendu ou des paramètres requis manquants. Généralement lié à une réponse avec un code de statut `4xx`. |
| ERR_CANCELED              | Fonctionnalité ou méthode annulée explicitement par l'utilisateur via un AbortSignal (ou un CancelToken). |
| ERR_NOT_SUPPORT           | Fonctionnalité ou méthode non supportée dans l'environnement axios actuel.                    |
| ERR_INVALID_URL           | URL invalide fournie pour la requête axios.                                                   |
| ERR_FORM_DATA_DEPTH_EXCEEDED | Un objet dépasse la `maxDepth` configurée lors de la sérialisation de `params` ou des données de formulaire. La limite par défaut est de 100 niveaux. Voir [`paramsSerializer`](/pages/advanced/request-config#paramsserializer) et [`formSerializer`](/pages/advanced/request-config#formserializer). |

## Gérer les erreurs

Le comportement par défaut d'axios est de rejeter la promise si la requête échoue. Cependant, vous pouvez également capturer l'erreur et la gérer comme bon vous semble. Voici un exemple de capture d'une erreur :

```js
axios.get("/user/12345").catch(function (error) {
  if (error.response) {
    // La requête a été effectuée et le serveur a répondu avec un code de statut
    // qui n'est pas dans la plage 2xx
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    // La requête a été effectuée mais aucune réponse n'a été reçue
    // `error.request` est une instance de XMLHttpRequest dans le navigateur et une instance de
    // http.ClientRequest dans Node.js
    console.log(error.request);
  } else {
    // Quelque chose s'est produit lors de la configuration de la requête qui a déclenché une erreur
    console.log("Error", error.message);
  }
  console.log(error.config);
});
```

## URL HTTP(S) mal formées

axios rejette une `url` ou une `baseURL` de requête `http:` ou `https:` qui omet `//` après le protocole. Par exemple, `https:example.com` et `https:/example.com` sont rejetées avec une `AxiosError` dont le code est `ERR_INVALID_URL`, au lieu d'être normalisées silencieusement par le parseur d'URL du navigateur ou de Node.js. Utilisez une URL bien formée comme `https://example.com`.

Le message identifie l'URL concernée, par exemple :

```text
Invalid URL "https:example.com": missing "//" after protocol
```

Ce comportement empêche les URL mal formées de contourner `baseURL` ou les listes d'URL autorisées. L'URL affichée est normalisée pour les caractères de contrôle et masque les identifiants, les valeurs des paramètres de requête et le contenu du fragment. Elle conserve le schéma, l'hôte, le chemin et les noms des paramètres afin que la requête reste identifiable. Ce masquage du message est systématique car `AxiosError.message` est toujours inclus par `toJSON()` ; l'option `redact` de la configuration ne peut pas nettoyer un message déjà créé.

En utilisant l'option de configuration `validateStatus`, vous pouvez remplacer la condition par défaut (status >= 200 && status < 300) et définir le ou les codes HTTP qui doivent lever une erreur.

```js
axios.get("/user/12345", {
  validateStatus: function (status) {
    return status < 500; // Résoudre uniquement si le code de statut est inférieur à 500
  },
});
```

En utilisant la méthode `toJSON`, vous pouvez obtenir un objet avec plus d'informations sur l'erreur.

```js
axios.get("/user/12345").catch(function (error) {
  console.log(error.toJSON());
});
```

Pour éviter de journaliser des secrets depuis `error.config`, passez un tableau `redact` dans la configuration de la requête. Les clés de configuration correspondantes sont masquées de manière insensible à la casse à n'importe quelle profondeur lorsque `AxiosError#toJSON()` est appelée.

```js
axios.get("/user/12345", {
  headers: { Authorization: "Bearer token" },
  redact: ["authorization"]
}).catch(function (error) {
  console.log(error.toJSON().config.headers.Authorization); // [REDACTED ****]
});
```

## Durée de la réponse en cas d'erreur

Lorsqu'une erreur comporte une réponse, par exemple un statut hors de la plage 2xx rejeté par `validateStatus`, `error.response.duration` contient le temps écoulé dans l'adaptateur, en millisecondes. Toutes les erreurs n'ont pas de réponse : les erreurs réseau, les délais d'attente dépassés et les annulations n'ont pas d'`error.response` et donc pas de durée. Vérifiez la présence d'une réponse avant de la lire :

```js
try {
  await axios.get('/users');
} catch (error) {
  if (axios.isAxiosError(error) && error.response) {
    console.log(error.response.status, error.response.duration);
  }
}
```

Les échecs d'analyse JSON stricte conservent la durée sur la réponse attachée à l'erreur. Consultez [Durée de la réponse](/fr/pages/advanced/response-schema#duree-de-la-reponse) pour savoir ce que mesure cette valeur.

## Piles des erreurs encapsulées

Lorsqu'axios encapsule une erreur de plus bas niveau, comme un échec de socket ou de DNS dans Node.js, l'erreur d'origine reste disponible dans `error.cause`. L'`error.stack` de l'erreur englobante inclut également la pile de l'erreur encapsulée après une ligne `Caused by:`, afin que les outils de rapport d'erreurs qui ne lisent que `stack` puissent voir l'échec sous-jacent. Les frames d'axios et les frames reconstituées de l'appelant viennent en premier, suivies de la pile encapsulée telle quelle :

```text
Error: getaddrinfo ENOTFOUND api.example.invalid
    at AxiosError.from (.../axios/lib/core/AxiosError.js)
    ...
    at Axios.request (.../axios/lib/core/Axios.js)
    at async loadUser (/app/users.js:4:5)
Caused by: Error: getaddrinfo ENOTFOUND api.example.invalid
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:...)
```

Utilisez `error.cause` pour un accès programmatique ; il s'agit du même objet d'erreur d'origine :

```js
try {
  await axios.get('https://api.example.invalid/users');
} catch (error) {
  if (axios.isAxiosError(error) && error.cause) {
    console.log(error.cause.code); // par ex. 'ENOTFOUND'
  }
}
```

Gardez à l'esprit les points suivants :

- La chaîne combinée est également retournée par `error.toJSON().stack`. Il s'agit d'une sortie de diagnostic brute : `redact` ne nettoie pas les chaînes de pile.
- Les outils qui tiennent compte de la cause et affichent déjà `error.cause` peuvent afficher une partie du contenu de la pile en double.
- Seules les erreurs encapsulées via `AxiosError.from()` dont la cause possède une pile exploitable reçoivent une section. Les piles absentes, vides ou illisibles sont ignorées.
- Encapsuler une erreur déjà encapsulée ajoute à chaque fois une nouvelle section imbriquée, si bien que la chaîne s'allonge à chaque encapsulation.
- Une `stack` passée dans l'argument `customProps` d'`AxiosError.from()` remplace toujours la pile générée.
- Le marqueur `Caused by:` est un texte de diagnostic, pas un format stable à analyser.
- L'encapsulation ne peut pas récupérer des détails que la plateforme n'a jamais fournis. Par exemple, une `Network Error` XHR dans le navigateur n'a généralement pas de pile d'erreur sous-jacente, de sorte que les causes CORS, DNS ou TLS masquées restent indisponibles.

## Gestion des délais d'attente

Lorsqu'une requête dépasse son `timeout` configuré, axios rejette avec `ECONNABORTED` par défaut. Définissez `transitional.clarifyTimeoutError: true` pour recevoir `ETIMEDOUT` à la place, ce qui rend les erreurs de délai d'attente plus faciles à distinguer des autres abandons.

```js
async function fetchWithTimeout() {
  try {
    const response = await axios.get("https://example.com/data", {
      timeout: 5000, // 5 secondes
      transitional: {
        // définir à true si vous préférez ETIMEDOUT à ECONNABORTED
        clarifyTimeoutError: true,
      },
    });

    console.log("Response:", response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        console.error("Request timed out. Please try again.");
        return;
      }

      console.error("Axios error:", error.message);
      return;
    }

    console.error("Unexpected error:", error);
  }
}
```

::: tip Définissez toujours un `timeout` en production
Sans cela, une requête bloquée peut rester en attente indéfiniment. Consultez [`timeout`](/pages/advanced/request-config#timeout) et [`transitional.clarifyTimeoutError`](/pages/advanced/request-config#transitional) pour les options de configuration correspondantes.
:::
