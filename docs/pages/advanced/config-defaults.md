# Config defaults

axios allows you to specify config defaults that will be applied to ever request. You can specify defaults for the `baseURL`, `headers`, `timeout`, and other properties. An example of using config defaults is shown below:

```js
axios.defaults.baseURL = "https://jsonplaceholder.typicode.com/posts";
axios.defaults.headers.common["Authorization"] = AUTH_TOKEN;
axios.defaults.headers.post["Content-Type"] =
  "application/x-www-form-urlencoded";
```

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
