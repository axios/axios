# Interceptors

Interceptors are a powerful mechanism that can be used to intercept and modify HTTP requests and responses. They are very similar to middleware in Express.js. The interceptor is a function that gets executed before a request is sent and before a response is received. Interceptors are useful for a variety of tasks such as logging, modifying request headers, and modifying the response.

Basic usage of interceptors is as follows:

```js
// Add a request interceptor
axios.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
axios.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error);
  }
);
```

## Removing Interceptors

You can remove any interceptor by using the `eject` method on the interceptor you want to remove. You can also remove all interceptors by calling the `clear` method on the `axios.interceptors` object. Here is an example of how to remove an interceptor:

```js
// Eject the request interceptor
const myInterceptor = axios.interceptors.request.use(function () {
  /*...*/
});
axios.interceptors.request.eject(myInterceptor);

// Eject the response interceptor
const myInterceptor = axios.interceptors.response.use(function () {
  /*...*/
});
axios.interceptors.response.eject(myInterceptor);
```

Here is an example of how to remove all interceptors:

```js
const instance = axios.create();
instance.interceptors.request.use(function () {
  /*...*/
});
instance.interceptors.request.clear(); // Removes interceptors from requests
instance.interceptors.response.use(function () {
  /*...*/
});
instance.interceptors.response.clear(); // Removes interceptors from responses
```

## Interceptors default behaviour

When you add request interceptors, they are presumed to be asynchronous by default. This can cause a delay in the execution of your axios request when the main thread is blocked (a promise is created under the hood for the interceptor and your request gets put on the bottom of the call stack). If your request interceptors are synchronous you can add a flag to the options object that will tell axios to run the code synchronously and avoid any delays in request execution.

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

## Interceptors using `runWhen`

If you want to execute a particular interceptor based on a runtime check, you can add a runWhen function to the options object. The interceptor will not be executed if and only if the return of runWhen is false. The function will be called with the config object (don't forget that you can bind your own arguments to it as well.) This can be handy when you have an asynchronous request interceptor that only needs to run at certain times.

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

## Multiple interceptors

You may add multiple interceptors to the same request or response. The following will hold true for multiple interceptors in the same chain in the order below:

- each interceptor is executed
- they are executed in the order they were added
- only the last interceptor's result is returned
- every interceptor receives the result of its predecessor
- when the fulfilment-interceptor throws
  - the following fulfilment-interceptor is not called
  - the following rejection-interceptor is called
  - once caught, another following fulfil-interceptor is called again (just like in a promise chain).

::: tip
To gain an in-depth understanding of how interceptors work, you can read the test cases over [here](https://github.com/axios/axios/blob/v1.x/test/specs/interceptors.spec.js).
:::
