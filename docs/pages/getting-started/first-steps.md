# First steps

Welcome to the axios documentation! This guide will help you get started with axios and make your first API request. If you're new to axios, we recommend starting here.

## Installing

You can use axios in your project in a few different ways. The most common way is to install it from npm and include it in your project. But we also support jsDelivr, unpkg, and more.

#### Using npm

```bash
npm install axios
```

#### Using yarn

```bash
yarn add axios
```

#### Using bower

```bash
bower install axios
```

#### Using jsDelivr

When using jsDelivr we recommend using the minified version as well as pinning the version number to avoid unexpected changes. If you would like to use the latest version you can do so by dropping the version number. This is strongly discouraged for production use as it can lead to unexpected changes in your application.

```html
<script src="https://cdn.jsdelivr.net/npm/axios@1.7.2/dist/axios.min.js"></script>
```

#### Using unpkg

When using unpkg we recommend using the minified version as well as pinning the version number to avoid unexpected changes. If you would like to use the latest version you can do so by dropping the version number. This is strongly discouraged for production use as it can lead to unexpected changes in your application.

```html
<script src="https://unpkg.com/axios@1.7.2/dist/axios.min.js"></script>
```

## Making your first request

An axios request can be made in as few as two lines of code. Making your first request with axios is very simple. You can make a request to any API by providing the URL and method. For example, to make a GET request to the JSONPlaceholder API, you can use the following code:

```js
import axios from "axios";

const response = await axios.get(
  "https://jsonplaceholder.typicode.com/posts/1"
);

console.log(response.data);
```

axios provides a simple API for making requests. You can use the `axios.get` method to make a GET request, the `axios.post` method to make a POST request, and so on. You can also use the `axios.request` method to make a request with any method.

## Next steps

Now that you've made your first request with axios, you're ready to start exploring the rest of the axios documentation. You can learn more about making requests, handling responses, and using axios in your projects. Check out the rest of the documentation to learn more.
