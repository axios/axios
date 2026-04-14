# Exemples JavaScript

## Importer la bibliothèque

Pour importer la bibliothèque dans un environnement CommonJS, vous pouvez utiliser la fonction `require`, ou l'instruction `import` si vous utilisez un bundler comme Webpack ou Rollup.

#### Sans bundler

```js
const axios = require("axios");
```

#### Avec bundler (webpack, rollup, vite, etc.)

```js
import axios from "axios";
```

## Utiliser then/catch/finally

Comme axios retourne une Promise en son coeur, vous pouvez choisir d'utiliser des callbacks avec `then`, `catch` et `finally` pour gérer vos données de réponse, les erreurs et la fin de la requête.

### Requête GET

```js
axios
  .get("https://jsonplaceholder.typicode.com/posts", {
    params: {
      postId: 5,
    },
  })
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  })
  .finally(() => {
    console.log("Request completed");
  });
```

### Requête POST

```js
axios
  .post("https://jsonplaceholder.typicode.com/posts", {
    title: "foo",
    body: "bar",
    userId: 1,
  })
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  })
  .finally(() => {
    console.log("Request completed");
  });
```

### Requête PUT

```js
axios
  .put("https://jsonplaceholder.typicode.com/posts/1", {
    title: "foo",
    body: "bar",
    userId: 1,
  })
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  })
  .finally(() => {
    console.log("Request completed");
  });
```

### Requête PATCH

```js
axios
  .patch("https://jsonplaceholder.typicode.com/posts/1", {
    title: "foo",
  })
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  })
  .finally(() => {
    console.log("Request completed");
  });
```

### Requête DELETE

```js
axios
  .delete("https://jsonplaceholder.typicode.com/posts/1")
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  })
  .finally(() => {
    console.log("Request completed");
  });
```

## Utiliser async/await

Une autre façon de gérer les promises est d'utiliser `async` et `await`. Cela vous permet d'utiliser des blocs try/catch/finally pour gérer les erreurs et la fin de la requête. Cette approche rend votre code plus lisible et plus facile à comprendre, et permet également d'éviter ce qu'on appelle le « callback hell ».

::: tip
Remarque : async/await fait partie d'ECMAScript 2017 et n'est pas supporté par Internet Explorer et les navigateurs plus anciens. À utiliser avec précaution.
:::

### Requête GET

```js
const getPosts = async () => {
  try {
    const response = await axios.get(
      "https://jsonplaceholder.typicode.com/posts",
      {
        params: {
          postId: 5,
        },
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error(error);
  } finally {
    console.log("Request completed");
  }
};
```

### Requête POST

```js
const createPost = async () => {
  try {
    const response = await axios.post(
      "https://jsonplaceholder.typicode.com/posts",
      {
        title: "foo",
        body: "bar",
        userId: 1,
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error(error);
  } finally {
    console.log("Request completed");
  }
};
```

### Requête PUT

```js
const updatePost = async () => {
  try {
    const response = await axios.put(
      "https://jsonplaceholder.typicode.com/posts/1",
      {
        title: "foo",
        body: "bar",
        userId: 1,
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error(error);
  } finally {
    console.log("Request completed");
  }
};
```

### Requête PATCH

```js
const updatePost = async () => {
  try {
    const response = await axios.patch(
      "https://jsonplaceholder.typicode.com/posts/1",
      {
        title: "foo",
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error(error);
  } finally {
    console.log("Request completed");
  }
};
```

### Requête DELETE

```js
const deletePost = async () => {
  try {
    const response = await axios.delete(
      "https://jsonplaceholder.typicode.com/posts/1"
    );
    console.log(response.data);
  } catch (error) {
    console.error(error);
  } finally {
    console.log("Request completed");
  }
};
```
