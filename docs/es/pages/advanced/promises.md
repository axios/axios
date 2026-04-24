# Promises

axios está construido sobre la API nativa de Promise de ES6. Cada solicitud de axios devuelve una Promise que se resuelve en un objeto de respuesta o se rechaza con un error. Si tu entorno no admite Promises de ES6, necesitarás añadir un polyfill — por ejemplo con [es6-promise](https://github.com/stefanpenner/es6-promise).

## then / catch / finally

Dado que axios devuelve una Promise estándar, puedes usar `.then()`, `.catch()` y `.finally()` para manejar el resultado:

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

El enfoque recomendado para la mayoría de las bases de código es `async/await`, que hace que el código asíncrono se lea como código síncrono:

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

## Solicitudes en paralelo

Dado que axios devuelve una Promise estándar, puedes usar `Promise.all` para hacer múltiples solicitudes al mismo tiempo y esperar a que todas se completen:

```js
const [users, posts] = await Promise.all([
  axios.get("/api/users"),
  axios.get("/api/posts"),
]);

console.log(users.data, posts.data);
```

::: tip
`Promise.all` se rechazará tan pronto como cualquiera de las solicitudes falle. Si deseas manejar fallos parciales, usa `Promise.allSettled` en su lugar.
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

## Encadenar solicitudes

Puedes encadenar llamadas `.then()` para ejecutar solicitudes secuencialmente, pasando datos de una a la siguiente:

```js
axios.get("/api/user/1")
  .then(({ data: user }) => axios.get(`/api/posts?userId=${user.id}`))
  .then(({ data: posts }) => {
    console.log("Posts for user:", posts);
  })
  .catch(console.error);
```
