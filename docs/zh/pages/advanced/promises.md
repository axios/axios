# Promise

axios 基于原生 ES6 Promise API 构建。每个 axios 请求都返回一个 Promise，该 Promise 解析为响应对象或以错误拒绝。如果你的环境不支持 ES6 Promise，需要使用 polyfill，例如 [es6-promise](https://github.com/stefanpenner/es6-promise)。

## then / catch / finally

由于 axios 返回的是标准 Promise，你可以使用 `.then()`、`.catch()` 和 `.finally()` 来处理结果：

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

大多数代码库推荐使用 `async/await`，它使异步代码读起来像同步代码：

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

## 并行请求

由于 axios 返回标准 Promise，你可以使用 `Promise.all` 同时发起多个请求，并等待所有请求完成：

```js
const [users, posts] = await Promise.all([
  axios.get("/api/users"),
  axios.get("/api/posts"),
]);

console.log(users.data, posts.data);
```

::: tip
`Promise.all` 会在任何一个请求失败时立即 reject。如果你希望处理部分失败的情况，请改用 `Promise.allSettled`。
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

## 链式请求

可以链式调用 `.then()` 来顺序执行请求，将上一个请求的数据传递给下一个：

```js
axios.get("/api/user/1")
  .then(({ data: user }) => axios.get(`/api/posts?userId=${user.id}`))
  .then(({ data: posts }) => {
    console.log("Posts for user:", posts);
  })
  .catch(console.error);
```
