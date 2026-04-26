# Promises

axios est construit sur l'API Promise native d'ES6. Chaque requête axios retourne une Promise qui se résout vers un objet de réponse ou se rejette avec une erreur. Si votre environnement ne supporte pas les Promises ES6, vous devrez les polyfiller — par exemple avec [es6-promise](https://github.com/stefanpenner/es6-promise).

## then / catch / finally

Comme axios retourne une Promise standard, vous pouvez utiliser `.then()`, `.catch()` et `.finally()` pour gérer le résultat :

```js
axios.get("/api/users")
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error("Request failed:", error.message);
  })
  .finally(() => {
    console.log("Request finished");
  });
```

## async / await

L'approche recommandée pour la plupart des bases de code est `async/await`, qui rend le code asynchrone lisible comme du code synchrone :

```js
async function fetchUser(id) {
  try {
    const response = await axios.get(`/api/users/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user:", error.message);
    throw error;
  }
}
```

## Requêtes parallèles

Comme axios retourne une Promise standard, vous pouvez utiliser `Promise.all` pour effectuer plusieurs requêtes simultanément et attendre qu'elles se terminent toutes :

```js
const [users, posts] = await Promise.all([
  axios.get("/api/users"),
  axios.get("/api/posts"),
]);

console.log(users.data, posts.data);
```

::: tip
`Promise.all` rejettera dès que l'une des requêtes échoue. Si vous souhaitez gérer les échecs partiels, utilisez plutôt `Promise.allSettled`.
:::

```js
const results = await Promise.allSettled([
  axios.get("/api/users"),
  axios.get("/api/posts"),
]);

results.forEach((result) => {
  if (result.status === "fulfilled") {
    console.log(result.value.data);
  } else {
    console.error("Request failed:", result.reason.message);
  }
});
```

## Chaînage de requêtes

Vous pouvez chaîner des appels `.then()` pour exécuter des requêtes séquentiellement, en passant les données d'une requête à la suivante :

```js
axios.get("/api/user/1")
  .then(({ data: user }) => axios.get(`/api/posts?userId=${user.id}`))
  .then(({ data: posts }) => {
    console.log("Posts for user:", posts);
  })
  .catch(console.error);
```
