# Ejemplos en JavaScript

## Importar la librería

Para importar la librería en un entorno CommonJS, puedes usar la función `require`, o la declaración `import` si estás usando un empaquetador como Webpack o Rollup.

#### Sin empaquetador

```js
const axios = require("axios");
```

#### Con empaquetador (webpack, rollup, vite, etc)

```js
import axios from "axios";
```

## Usando then/catch/finally

Dado que axios devuelve una Promise en su núcleo, puedes optar por usar callbacks con `then`, `catch` y `finally` para manejar los datos de la respuesta, los errores y la finalización.

### Solicitud Get

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

### Solicitud Post

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

### Solicitud Put

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

### Solicitud Patch

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

### Solicitud Delete

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

## Usando async/await

Otra forma de manejar promises es mediante `async` y `await`. Esto te permite usar bloques try/catch/finally para manejar errores y la finalización. Esto puede hacer tu código más legible y fácil de entender, y también ayuda a evitar el llamado "callback hell".

::: tip
Nota: async/await forma parte de ECMAScript 2017 y no está disponible en Internet Explorer ni en navegadores más antiguos, así que úsalo con precaución.
:::

### Solicitud Get

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

### Solicitud Post

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

### Solicitud Put

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

### Solicitud Patch

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

### Solicitud Delete

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
