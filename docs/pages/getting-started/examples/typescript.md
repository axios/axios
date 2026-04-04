# TypeScript example

## Importing types

axios provides a number of TypeScript types that you can use to type your requests and responses. To import these types, you can use the `import` statement. For example you can access the `AxiosRequestConfig` and `AxiosResponse` types like so:

```ts
import { AxiosRequestConfig, AxiosResponse } from "axios";
```

## Implementing types

By using the types provided by axios, you can type your requests and responses. For example, you can type a request like so:

```ts
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

const getPosts = async (postId: number): Promise<AxiosResponse<Post>> => {
  return axios().get("https://jsonplaceholder.typicode.com/posts", {
    params: {
      postId,
    },
  });
};
```

This will ensure that the response from the `getPosts` function is of type `AxiosResponse<Post>`, where `Post` is the type of the response data. This can help you catch errors early and ensure that your code is type safe.
