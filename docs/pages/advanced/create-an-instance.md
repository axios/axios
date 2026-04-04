# Creating an instance

To create a new instance, you can use the `create` method. Once the instance is created, you can use it to make HTTP requests. You can also use all the method aliases on the instance.

```ts
import axios from "axios";

const instance = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com/posts",
  timeout: 1000,
  headers: { "X-Custom-Header": "foobar" },
});
```

The `create` method takes a configuration object as an argument and returns a new instance of Axios. The configuration object is detailed in the [Request Config](/pages/advanced/request-config) section.

::: tip
Note: Your instance will carry with it the default configuration that you provided when creating it.
:::
