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
