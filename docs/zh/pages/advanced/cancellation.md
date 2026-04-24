# 取消请求

从 v0.22.0 起，axios 支持使用 AbortController 以简洁的方式取消请求。该功能在浏览器和 Node.js（使用支持 AbortController 的 axios 版本）中均可使用。要取消请求，需要创建一个 `AbortController` 实例，并将其 `signal` 传入请求的 `signal` 选项。

```js
const controller = new AbortController();

axios
  .get("/foo/bar", {
    signal: controller.signal,
  })
  .then(function (response) {
    //...
  });
// 取消请求
controller.abort();
```

## CancelToken <Badge type="danger" text="已废弃" />

你也可以使用 `CancelToken` API 来取消请求。该 API 已废弃，将在下一个主版本中移除，建议改用 `AbortController`。可以使用 `CancelToken.source` 工厂方法创建取消令牌，如下所示：

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
      // 处理错误
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

// 取消请求（message 参数可选）
source.cancel("Operation canceled by the user.");
```

也可以通过向 `CancelToken` 构造函数传入执行函数来创建取消令牌：

```js
const CancelToken = axios.CancelToken;
let cancel;

axios.get("/user/12345", {
  cancelToken: new CancelToken(function executor(c) {
    // 执行函数接收一个 cancel 函数作为参数
    cancel = c;
  }),
});

// 取消请求
cancel();
```

你可以使用同一个取消令牌或 AbortController 取消多个请求。如果在 axios 请求开始时取消令牌已处于已取消状态，则请求会立即被取消，不会尝试发起实际的网络请求。
