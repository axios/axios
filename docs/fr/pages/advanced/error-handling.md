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
