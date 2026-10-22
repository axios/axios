# JavaScript 示例

## 导入库

在 CommonJS 环境中，可以使用 `require` 函数导入库；如果使用 Webpack 或 Rollup 等打包工具，则可以使用 `import` 语句。

#### 不使用打包工具

```js
const axios = require("axios");
```

#### 使用打包工具（webpack、rollup、vite 等）

```js
import axios from "axios";
```

## 使用 then/catch/finally

axios 的核心返回的是一个 Promise，你可以使用 `then`、`catch` 和 `finally` 回调来处理响应数据、错误以及请求完成的逻辑。

### GET 请求

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

### POST 请求

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

### PUT 请求

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

### PATCH 请求

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

### DELETE 请求

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

## 使用 async/await

处理 Promise 的另一种方式是使用 `async` 和 `await`，配合 try/catch/finally 块来处理错误和完成逻辑。这种写法可以让代码更加清晰易读，同时有效避免所谓的"回调地狱"。

::: tip
注意：async/await 属于 ECMAScript 2017 规范，Internet Explorer 及部分旧版浏览器不支持，使用时请注意兼容性。
:::

### GET 请求

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

### POST 请求

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

### PUT 请求

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

### PATCH 请求

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

### DELETE 请求

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
