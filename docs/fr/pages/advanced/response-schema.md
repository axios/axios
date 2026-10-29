# Schéma de réponse

Chaque requête axios se résout vers un objet de réponse ayant la structure suivante. Le schéma est cohérent aussi bien dans les environnements navigateur que Node.js.

```js
{
  // Les données de réponse fournies par le serveur.
  // Lors de l'utilisation de `transformResponse`, ce sera le résultat de la dernière transformation.
  data: {},

  // Le code de statut HTTP de la réponse du serveur (ex. 200, 404, 500).
  status: 200,

  // Le message de statut HTTP correspondant au code de statut (ex. "OK", "Not Found").
  statusText: "OK",

  // Les en-têtes de réponse envoyés par le serveur.
  // Les noms d'en-têtes sont en minuscules. Vous pouvez y accéder par notation crochet ou point.
  headers: {},

  // La configuration axios utilisée pour cette requête, incluant baseURL,
  // headers, timeout, params, et toutes autres options que vous avez fournies.
  config: {},

  // L'objet de requête sous-jacent.
  // Dans Node.js : la dernière instance de `http.ClientRequest` (après toute redirection).
  // Dans le navigateur : l'instance de `XMLHttpRequest`.
  request: {},

  // Temps approximatif en millisecondes mis par l'adaptateur pour terminer la requête.
  // Défini par axios pour les adaptateurs intégrés et personnalisés ; voir « Durée de la réponse » ci-dessous.
  duration: 42,
}
```

En TypeScript, `AxiosResponse<T, D, H, P>` type les données de réponse (`T`), les données de requête (`D`), les en-têtes de réponse (`H`) et les paramètres de requête (`P`). La configuration conserve les deux types liés à la requête :

```ts
interface AxiosResponse<T = any, D = any, H = {}, P = any> {
  data: T;
  status: number;
  statusText: string;
  duration?: number;
  headers: (H & RawAxiosResponseHeaders) | AxiosResponseHeaders;
  config: InternalAxiosRequestConfig<D, P>;
  request?: any;
}
```

## Accéder aux champs de la réponse

En pratique, vous déstructurerez généralement uniquement les parties dont vous avez besoin :

```js
const { data, status, headers } = await axios.get("/api/users/1");

console.log(status);          // 200
console.log(headers["content-type"]); // "application/json; charset=utf-8"
console.log(data);            // { id: 1, name: "Jay", email: "jay@example.com" }
```

## Durée de la réponse

`response.duration` est le temps écoulé dans l'adaptateur, en millisecondes :

```js
const response = await axios.get('/users');

console.log(response.duration); // par ex. 128
```

La mesure commence juste avant qu'axios invoque l'adaptateur, après l'exécution des intercepteurs de requête et de `transformRequest`. Elle s'arrête lorsque l'adaptateur se termine, avant l'exécution de `transformResponse` et des intercepteurs de réponse. Elle inclut donc le travail de l'adaptateur, comme la mise en file d'attente des connexions et le suivi des redirections.

- Pour les réponses mises en mémoire tampon, la valeur inclut la réception du corps de la réponse.
- Pour les réponses streamées (`responseType: "stream"` dans les adaptateurs HTTP et fetch), elle ne mesure que le temps jusqu'à ce que le stream soit disponible. La consommation ultérieure du stream, ou son échec, ne met pas à jour la valeur.
- Il ne s'agit pas d'une décomposition DNS, TCP, TLS ou du temps jusqu'au premier octet, ni du temps de traitement côté serveur.
- La valeur est un temps réel approximatif mesuré avec `Date.now()`. Les ajustements d'horloge vers l'arrière sont ramenés à `0`, mais les ajustements vers l'avant peuvent gonfler la valeur.

axios définit `duration` sur chaque réponse produite par un adaptateur, en écrasant toute propriété `duration` déjà définie par un adaptateur personnalisé. La propriété est optionnelle dans les déclarations TypeScript afin que les adaptateurs personnalisés et les réponses construites manuellement n'aient pas à la fournir. Les erreurs sans réponse, comme les erreurs réseau, les délais d'attente dépassés et les annulations, n'ont pas de durée ; consultez [Gestion des erreurs](/fr/pages/advanced/error-handling#duree-de-la-reponse-en-cas-d-erreur).

## Vérifier le code de statut

axios résout la promise pour toute réponse 2xx et rejette pour tout ce qui est en dehors de cette plage par défaut. Vous pouvez personnaliser ce comportement avec l'option de configuration `validateStatus` :

```js
const response = await axios.get("/api/resource", {
  validateStatus: (status) => status < 500, // résoudre pour tout statut inférieur à 500
});
```

## Accéder aux en-têtes de réponse

Tous les noms d'en-têtes de réponse sont en minuscules, quelle que soit la façon dont le serveur les a envoyés :

```js
const response = await axios.get("/api/resource");

// Ces deux lignes sont équivalentes
const contentType = response.headers["content-type"];
const contentType2 = response.headers.get("content-type");
```
