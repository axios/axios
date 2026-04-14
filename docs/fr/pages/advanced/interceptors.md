# Intercepteurs

Les intercepteurs sont un mécanisme puissant permettant d'intercepter et de modifier les requêtes et réponses HTTP. Ils sont très similaires aux middlewares dans Express.js. Un intercepteur est une fonction exécutée avant l'envoi d'une requête et avant la réception d'une réponse. Les intercepteurs sont utiles pour de nombreuses tâches telles que la journalisation, la modification des en-têtes de requête et la modification de la réponse.

L'utilisation de base des intercepteurs est la suivante :

```js
// Ajouter un intercepteur de requête
axios.interceptors.request.use(
  function (config) {
    // Effectuez une action avant l'envoi de la requête
    return config;
  },
  function (error) {
    // Traitez l'erreur de requête
    return Promise.reject(error);
  }
);

// Ajouter un intercepteur de réponse
axios.interceptors.response.use(
  function (response) {
    // Tout code de statut dans la plage 2xx déclenchera cette fonction
    // Traitez les données de réponse
    return response;
  },
  function (error) {
    // Tout code de statut en dehors de la plage 2xx déclenchera cette fonction
    // Traitez l'erreur de réponse
    return Promise.reject(error);
  }
);
```

## Supprimer des intercepteurs

Vous pouvez supprimer n'importe quel intercepteur en utilisant la méthode `eject` sur l'intercepteur que vous souhaitez supprimer. Vous pouvez également supprimer tous les intercepteurs en appelant la méthode `clear` sur l'objet `axios.interceptors`. Voici un exemple de suppression d'un intercepteur :

```js
// Éjecter l'intercepteur de requête
const myInterceptor = axios.interceptors.request.use(function () {
  /*...*/
});
axios.interceptors.request.eject(myInterceptor);

// Éjecter l'intercepteur de réponse
const myInterceptor = axios.interceptors.response.use(function () {
  /*...*/
});
axios.interceptors.response.eject(myInterceptor);
```

Voici un exemple de suppression de tous les intercepteurs :

```js
const instance = axios.create();
instance.interceptors.request.use(function () {
  /*...*/
});
instance.interceptors.request.clear(); // Supprime les intercepteurs des requêtes
instance.interceptors.response.use(function () {
  /*...*/
});
instance.interceptors.response.clear(); // Supprime les intercepteurs des réponses
```

## Comportement par défaut des intercepteurs

Lorsque vous ajoutez des intercepteurs de requête, ils sont considérés comme asynchrones par défaut. Cela peut provoquer un délai dans l'exécution de votre requête axios lorsque le thread principal est bloqué (une promise est créée en coulisses pour l'intercepteur et votre requête est placée en bas de la pile d'appels). Si vos intercepteurs de requête sont synchrones, vous pouvez ajouter un indicateur à l'objet d'options qui indiquera à axios d'exécuter le code de manière synchrone et d'éviter tout délai dans l'exécution des requêtes.

```js
axios.interceptors.request.use(
  function (config) {
    config.headers.test = "I am only a header!";
    return config;
  },
  null,
  { synchronous: true }
);
```

## Intercepteurs avec `runWhen`

Si vous souhaitez exécuter un intercepteur particulier en fonction d'une vérification au moment de l'exécution, vous pouvez ajouter une fonction `runWhen` à l'objet d'options. L'intercepteur ne sera pas exécuté si et seulement si le résultat de `runWhen` est `false`. La fonction sera appelée avec l'objet de configuration (n'oubliez pas que vous pouvez également y lier vos propres arguments). Cela peut être utile lorsque vous avez un intercepteur de requête asynchrone qui ne doit s'exécuter que dans certaines conditions.

```js
function onGetCall(config) {
  return config.method === "get";
}
axios.interceptors.request.use(
  function (config) {
    config.headers.test = "special get headers";
    return config;
  },
  null,
  { runWhen: onGetCall }
);
```

## Intercepteurs multiples

Vous pouvez ajouter plusieurs intercepteurs à la même requête ou réponse. Les règles suivantes s'appliquent pour plusieurs intercepteurs dans la même chaîne, dans l'ordre indiqué ci-dessous :

- Chaque intercepteur est exécuté
- Les intercepteurs de requête sont exécutés dans l'ordre inverse (LIFO).
- Les intercepteurs de réponse sont exécutés dans l'ordre où ils ont été ajoutés (FIFO).
- Seul le résultat du dernier intercepteur est retourné
- Chaque intercepteur reçoit le résultat de son prédécesseur
- Lorsqu'un intercepteur de réussite lève une exception :
  - L'intercepteur de réussite suivant n'est pas appelé
  - L'intercepteur d'échec suivant est appelé
  - Une fois capturée, un autre intercepteur de réussite suivant est à nouveau appelé (comme dans une chaîne de promises).

::: tip
Pour une compréhension approfondie du fonctionnement des intercepteurs, vous pouvez lire les cas de test disponibles [ici](https://github.com/axios/axios/blob/v1.x/test/specs/interceptors.spec.js).
:::
