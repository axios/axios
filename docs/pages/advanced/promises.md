# Promises

axios is built on top of the native ES6 Promise API. Every axios request returns a Promise that resolves to a response object or rejects with an error. If your environment doesn't support ES6 Promises, you will need to polyfill them — for example with [es6-promise](https://github.com/stefanpenner/es6-promise).

## then / catch / finally

Because axios returns a standard Promise, you can use `.then()`, `.catch()`, and `.finally()` to handle the result:

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

The recommended approach for most codebases is `async/await`, which makes asynchronous code read like synchronous code:

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

## Parallel requests

Because axios returns a standard Promise, you can use `Promise.all` to make multiple requests at the same time and wait for all of them to complete:

```js
const [users, posts] = await Promise.all([
  axios.get("/api/users"),
  axios.get("/api/posts"),
]);

console.log(users.data, posts.data);
```

::: tip
`Promise.all` will reject as soon as any one of the requests fails. If you want to handle partial failures, use `Promise.allSettled` instead.
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

## Chaining requests

You can chain `.then()` calls to run requests sequentially, passing data from one to the next:

```js
axios.get("/api/user/1")
  .then(({ data: user }) => axios.get(`/api/posts?userId=${user.id}`))
  .then(({ data: posts }) => {
    console.log("Posts for user:", posts);
  })
  .catch(console.error);
```
