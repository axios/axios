# Config defaults

axios allows you to specify config defaults that will be applied to every request. You can specify defaults for the `baseURL`, `headers`, `timeout`, and other properties. An example of using config defaults is shown below:

```js
axios.defaults.baseURL = "https://jsonplaceholder.typicode.com/posts";
axios.defaults.headers.common["Authorization"] = AUTH_TOKEN;
axios.defaults.headers.post["Content-Type"] =
  "application/x-www-form-urlencoded";
```

::: warning Global headers are sent to every host
If your application talks to more than one domain, setting `axios.defaults.headers.common["Authorization"]` will send the token to **all** of them, including third-party APIs you may not control. Use a [custom instance](#custom-instance-defaults) with a scoped `baseURL` for any client that carries credentials.
:::

## Method-specific header defaults

`headers.common` applies to every request, and `headers.get`, `headers.post`, and the other lower-case method names apply only to requests with that method. These defaults buckets must be plain objects, null-prototype objects, or `AxiosHeaders` instances. Any other value under one of these keys is treated as a literal header value instead; see [Headers named after HTTP methods](/pages/advanced/headers#headers-named-after-http-methods).

If you build defaults with your own class, convert the instance before assigning it as a bucket:

```js
import axios, { AxiosHeaders } from 'axios';

const instance = axios.create({
  headers: {
    // Both keep the instance's own enumerable header entries as POST defaults
    post: { ...customDefaults },
    // or: post: new AxiosHeaders({ ...customDefaults }),
  },
});
```

::: warning
An arbitrary class instance assigned under `common` or a method name is not used as a bucket. Its string representation is sent as a literal header (for example, `post: [object Object]`) on every request, including requests with other methods. A custom `toString()` can expose the instance's contents this way.
:::

## Custom instance defaults

axios instances are declared with their own defaults when created. These defaults may be overridden setting the `defaults` property to the instance. An example of using custom instance defaults is shown below:

```js
var instance = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com/posts",
  timeout: 1000,
  headers: { Authorization: "foobar" },
});

instance.defaults.headers.common["Authorization"] = AUTH_TOKEN;
```

## Config order of precedence

Config will be merged with an order of precedence. The order is as follows, first the library defaults are set, then default properties of the instance, and finally config argument for the request. An example of the order of precedence is shown below:

Some options are request-specific and are only taken from the request config. `data` is one of those options: axios does not inherit or deep-merge request bodies from global or instance defaults. If every request needs shared body fields, add them with a request interceptor or `transformRequest`, and scope that logic carefully so sensitive values are not sent to the wrong endpoint.

First lets create an instance with the defaults provided by the library. At this point the timeout config value is `0` as is the default for the library.

```js
const instance = axios.create();
```

Now we will override the timeout default for the instance to `2500` milliseconds. Now all requests using this instance will wait 2.5 seconds before timing out.

```js
instance.defaults.timeout = 2500;
```

Finally we will make a request with a timeout of `5000` milliseconds. This request will wait 5 seconds before timing out.

```js
instance.get("/longRequest", {
  timeout: 5000,
});
```
