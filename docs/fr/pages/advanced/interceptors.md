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

Le nombre retourné par `use()` est un identifiant d'intercepteur opaque. Repassez-le tel quel à `eject()` ; ne l'utilisez pas comme index dans le tableau `handlers`. Préférez `eject()` et `clear()` à la modification directe de `handlers` :

- Éjecter un identifiant inconnu, ou éjecter deux fois le même identifiant, n'a aucun effet.
- Un identifiant périmé ne supprime jamais un autre intercepteur, même après l'éjection d'autres intercepteurs ou le vidage du gestionnaire.
- Si `handlers` est remplacé par `null` ou `undefined`, cette chaîne d'intercepteurs est ignorée, et le prochain appel à `use()` restaure un tableau vide avant d'ajouter le nouvel intercepteur.

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

### Erreurs des intercepteurs synchrones

Lorsqu'un intercepteur de requête synchrone lève une erreur, axios appelle le gestionnaire `onRejected` associé à cet intercepteur et cesse d'exécuter les intercepteurs de requête restants. Si le gestionnaire retourne normalement —y compris `undefined` ou une Promise résolue— l'erreur est considérée comme gérée et axios envoie la requête avec la dernière configuration valide. La valeur retournée par le gestionnaire ne remplace pas cette configuration.

Pour empêcher l'envoi, omettez le gestionnaire de rejet ou faites-lui lever une erreur ou retourner une Promise rejetée. L'erreur terminale continue alors à travers les intercepteurs de rejet de réponse.

```js
axios.interceptors.request.use(
  function validate(config) {
    if (!config.headers.has("Authorization")) {
      throw new Error("Authorization is required");
    }
    return config;
  },
  function rejectInvalidRequest(error) {
    return Promise.reject(error);
  },
  { synchronous: true }
);
```

Un gestionnaire qui se contente de journaliser l'erreur peut retourner normalement pour conserver le comportement existant de poursuite :

```js
axios.interceptors.request.use(
  function prepare(config) {
    throw new Error("Optional preparation failed");
  },
  function logPreparationFailure(error) {
    console.warn(error);
    // Un retour normal envoie la requête avec la dernière configuration valide.
  },
  { synchronous: true }
);
```

## Retourner un autre objet de configuration

Un intercepteur de requête modifie et retourne généralement la configuration qu'il reçoit. Cette configuration est un objet modifiable à prototype nul créé par axios, et la retourner telle quelle préserve son identité : l'adaptateur et `response.config` reçoivent le même objet.

```js
let seen;

const instance = axios.create({
  adapter: async (config) => {
    console.log(config === seen); // true
    return { data: null, status: 200, statusText: 'OK', headers: {}, config };
  },
});

instance.interceptors.request.use((config) => {
  config.headers.set('X-Trace', '1');
  seen = config;
  return config;
});
```

Le fait qu'axios réutilise ou copie l'objet retourné dépend de sa forme, et non du fait qu'il s'agisse de l'objet reçu par l'intercepteur. Un objet modifiable et extensible à prototype nul, dont toutes les propriétés sont des propriétés de données modifiables et qui ne contient aucune clé dangereuse, est envoyé tel quel : axios y met à jour des champs comme `headers` et `data`, et l'adaptateur reçoit ce même objet. Cela s'applique aussi à un autre objet à prototype nul retourné par un intercepteur ; ne retournez donc pas un objet qui doit rester inchangé.

Tout autre objet, comme un littéral d'objet, une copie `{ ...config }` ou une instance de classe, est copié dans un nouvel instantané modifiable à prototype nul avant l'envoi. Les champs propres sont conservés, à l'exception des clés dangereuses `__proto__`, `constructor` et `prototype`, qui sont toujours supprimées. Les champs hérités d'un prototype défini par l'application sont copiés comme champs propres, mais l'instantané ne conserve ni l'identité de l'objet d'origine, ni son prototype, ni les vérifications `instanceof`, ni les accesseurs, ni les attributs de propriété :

```js
const template = { tenant: 'acme' };

instance.interceptors.request.use((config) => {
  // `tenant` est hérité de `template` ; un adaptateur personnalisé
  // le lit comme un champ propre de l'instantané : config.tenant === 'acme'
  return Object.assign(Object.create(template), config);
});
```

Les champs hérités d'`Object.prototype`, ou d'un prototype dont le propre prototype est `null` (comme un prototype créé avec `Object.create(null)`), sont ignorés :

```js
const nullTemplate = Object.create(null);
nullTemplate.tenant = 'acme';

instance.interceptors.request.use((config) => {
  // `tenant` est ignoré car `nullTemplate` a un prototype nul :
  // un adaptateur personnalisé voit config.tenant === undefined
  return Object.assign(Object.create(nullTemplate), config);
});
```

Une configuration à prototype nul est également copiée lorsqu'elle est gelée, scellée, qu'elle utilise des accesseurs ou des propriétés non modifiables, ou qu'elle contient l'une des clés dangereuses, car axios doit mettre à jour des champs tels que `headers` et `data` pendant l'envoi. Ces règles constituent une limite de sécurité intentionnelle qui empêche les valeurs injectées dans des prototypes partagés de modifier le comportement des requêtes ; elles ne rendent pas la modification d'`Object.prototype` sûre ni prise en charge.

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

## Ordre d'exécution des intercepteurs

::: warning Les intercepteurs de requête et de réponse s'exécutent dans des ordres **opposés**
Les intercepteurs de requête sont exécutés dans l'**ordre inverse** (LIFO — last in, first out). Le _dernier_ intercepteur de requête ajouté est exécuté en _premier_.

Les intercepteurs de réponse sont exécutés dans l'**ordre où ils ont été ajoutés** (FIFO — first in, first out). Le _premier_ intercepteur de réponse ajouté est exécuté en _premier_.
:::

L'exemple suivant montre l'ordre d'exécution complet pour trois intercepteurs de requête et trois intercepteurs de réponse :

```js
const instance = axios.create();

const interceptor = (id) => (base) => {
  console.log(id);
  return base;
};

instance.interceptors.request.use(interceptor("Request Interceptor 1"));
instance.interceptors.request.use(interceptor("Request Interceptor 2"));
instance.interceptors.request.use(interceptor("Request Interceptor 3"));
instance.interceptors.response.use(interceptor("Response Interceptor 1"));
instance.interceptors.response.use(interceptor("Response Interceptor 2"));
instance.interceptors.response.use(interceptor("Response Interceptor 3"));

// Sortie console :
// Request Interceptor 3
// Request Interceptor 2
// Request Interceptor 1
// [La requête HTTP est effectuée]
// Response Interceptor 1
// Response Interceptor 2
// Response Interceptor 3
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
Pour une compréhension approfondie du fonctionnement des intercepteurs, vous pouvez lire les cas de test disponibles [ici](https://github.com/axios/axios/blob/v1.x/tests/browser/interceptors.browser.test.js).
:::
