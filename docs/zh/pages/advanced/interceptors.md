# 拦截器

拦截器是一种强大的机制，可用于拦截和修改 HTTP 请求与响应，与 Express.js 中的中间件非常相似。拦截器是在请求发送前和响应接收前执行的函数，适用于日志记录、修改请求头、修改响应等多种场景。

拦截器的基本用法如下：

```js
// 添加请求拦截器
axios.interceptors.request.use(
  function (config) {
    // 在请求发送之前执行某些操作
    return config;
  },
  function (error) {
    // 处理请求错误
    return Promise.reject(error);
  }
);

// 添加响应拦截器
axios.interceptors.response.use(
  function (response) {
    // 状态码在 2xx 范围内的响应会触发此函数
    // 处理响应数据
    return response;
  },
  function (error) {
    // 状态码不在 2xx 范围内的响应会触发此函数
    // 处理响应错误
    return Promise.reject(error);
  }
);
```

## 移除拦截器

可以通过对要移除的拦截器调用 `eject` 方法来移除特定拦截器。也可以通过在 `axios.interceptors` 对象上调用 `clear` 方法来移除所有拦截器。以下是移除拦截器的示例：

```js
// 移除请求拦截器
const myInterceptor = axios.interceptors.request.use(function () {
  /*...*/
});
axios.interceptors.request.eject(myInterceptor);

// 移除响应拦截器
const myInterceptor = axios.interceptors.response.use(function () {
  /*...*/
});
axios.interceptors.response.eject(myInterceptor);
```

以下是移除所有拦截器的示例：

```js
const instance = axios.create();
instance.interceptors.request.use(function () {
  /*...*/
});
instance.interceptors.request.clear(); // 移除所有请求拦截器
instance.interceptors.response.use(function () {
  /*...*/
});
instance.interceptors.response.clear(); // 移除所有响应拦截器
```

## 拦截器的默认行为

添加请求拦截器时，默认被视为异步执行。当主线程被阻塞时（拦截器底层会创建一个 Promise，你的请求会被放到调用栈底部），这可能导致 axios 请求的执行出现延迟。如果你的请求拦截器是同步的，可以在选项对象中添加一个标志，告知 axios 同步运行该代码，从而避免请求执行的延迟。

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

## 使用 `runWhen` 的拦截器

如果你希望根据运行时条件决定是否执行某个拦截器，可以在选项对象中添加 `runWhen` 函数。仅当 `runWhen` 返回 `false` 时，拦截器不会执行。该函数会以 config 对象作为参数调用（你也可以为其绑定自定义参数）。这对于只需在特定时机运行的异步请求拦截器非常实用。

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

## 多个拦截器

你可以在同一个请求或响应上添加多个拦截器，同一拦截器链中的多个拦截器遵循以下规则：

- 每个拦截器都会执行
- 请求拦截器按照后进先出（LIFO）的顺序执行
- 响应拦截器按照添加顺序（FIFO）执行
- 只返回最后一个拦截器的结果
- 每个拦截器接收其前驱拦截器的结果
- 当成功回调中的拦截器抛出错误时
  - 后续的成功回调拦截器不会被调用
  - 后续的错误回调拦截器会被调用
  - 一旦被捕获，后续的成功回调拦截器将再次被调用（与 Promise 链的行为一致）

::: tip
要深入了解拦截器的工作原理，可以查阅[这里](https://github.com/axios/axios/blob/v1.x/test/specs/interceptors.spec.js)的测试用例。
:::
