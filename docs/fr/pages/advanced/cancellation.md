# Annulation

À partir de la version v0.22.0, Axios prend en charge AbortController pour annuler les requêtes de manière propre. Cette fonctionnalité est disponible dans le navigateur et dans Node.js lorsque vous utilisez une version d'Axios qui prend en charge AbortController. Pour annuler une requête, vous devez créer une instance d'`AbortController` et passer son `signal` à l'option `signal` de la requête.

```js
const controller = new AbortController();

axios
  .get("/foo/bar", {
    signal: controller.signal,
  })
  .then(function (response) {
    //...
  });
// annuler la requête
controller.abort();
```

## CancelToken <Badge type="danger" text="Déprécié" />

Vous pouvez également utiliser l'API `CancelToken` pour annuler les requêtes. Cette API est dépréciée et sera supprimée dans la prochaine version majeure. Il est recommandé d'utiliser `AbortController` à la place. Vous pouvez créer un token d'annulation en utilisant la factory `CancelToken.source` comme indiqué ci-dessous :

```js
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

axios
  .get("/user/12345", {
    cancelToken: source.token,
  })
  .catch(function (thrown) {
    if (axios.isCancel(thrown)) {
      console.log("Request canceled", thrown.message);
    } else {
      // gérer l'erreur
    }
  });

axios.post(
  "/user/12345",
  {
    name: "new name",
  },
  {
    cancelToken: source.token,
  }
);

// annuler la requête (le paramètre message est optionnel)
source.cancel("Operation canceled by the user.");
```

Vous pouvez également créer un token d'annulation en passant une fonction d'exécution au constructeur `CancelToken` :

```js
const CancelToken = axios.CancelToken;
let cancel;

axios.get("/user/12345", {
  cancelToken: new CancelToken(function executor(c) {
    // Une fonction d'exécution reçoit une fonction d'annulation comme paramètre
    cancel = c;
  }),
});

// annuler la requête
cancel();
```

Vous pouvez annuler plusieurs requêtes avec le même token d'annulation ou le même abort controller. Si un token d'annulation est déjà annulé au moment où une requête Axios démarre, alors la requête est annulée immédiatement, sans aucune tentative d'effectuer une vraie requête.
