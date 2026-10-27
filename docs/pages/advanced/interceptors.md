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

The number returned by `use()` is an opaque interceptor ID. Pass it back to `eject()` unchanged; do not use it as an index into the `handlers` array. Prefer `eject()` and `clear()` over editing `handlers` directly:

- Ejecting an unknown ID, or ejecting the same ID twice, does nothing.
- A stale ID never removes a different interceptor, even after other interceptors were ejected or the manager was cleared.
- If `handlers` is replaced with `null` or `undefined`, that interceptor chain is skipped, and the next `use()` call restores an empty array before adding the new interceptor.

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

### Synchronous interceptor errors

When a synchronous request interceptor throws, axios calls that interceptor's paired `onRejected` handler and stops running the remaining request interceptors. If the handler returns normally—including returning `undefined` or a fulfilled Promise—the error is handled and axios dispatches with the last valid config. The handler's return value does not replace that config.

To prevent dispatch, omit the rejection handler or have it throw or return a rejected Promise. The terminal error then continues through response rejection interceptors.

Use a rejected Promise when validation must block the request:

```js
axios.interceptors.request.use(
  function validate(config) {
    if (!config.headers.has("Authorization")) {
      throw new Error("Authorization is required");
    }
    return config;
  },
  function rejectInvalidRequest(error) {
    return Promise.reject(error);
  },
  { synchronous: true }
);
```

A logging-only rejection handler can return normally to retain the existing continuation behavior:

```js
axios.interceptors.request.use(
  function prepare(config) {
    throw new Error("Optional preparation failed");
  },
  function logPreparationFailure(error) {
    console.warn(error);
    // Returning normally dispatches with the last valid config.
  },
  { synchronous: true }
);
```

## Returning a different config object

A request interceptor usually modifies and returns the config it receives. That config is a writable null-prototype object created by axios, and returning it unchanged preserves its identity: the adapter and `response.config` receive the same object.

```js
let seen;

const instance = axios.create({
  adapter: async (config) => {
    console.log(config === seen); // true
    return { data: null, status: 200, statusText: 'OK', headers: {}, config };
  },
});

instance.interceptors.request.use((config) => {
  config.headers.set('X-Trace', '1');
  seen = config;
  return config;
});
```

Whether axios reuses or copies the returned object depends on its shape, not on whether it is the object the interceptor received. A writable, extensible null-prototype object whose properties are all plain writable data properties and that has no unsafe keys is dispatched as is: axios updates fields such as `headers` and `data` on it, and the adapter receives that same object. This also applies to a different null-prototype object returned by an interceptor, so do not return an object that must stay unchanged.

Any other object, such as an object literal, a `{ ...config }` copy, or a class instance, is copied into a new writable null-prototype snapshot before dispatch. Own fields are kept, except the unsafe keys `__proto__`, `constructor`, and `prototype`, which are always dropped. Fields inherited from an application-defined prototype are copied as own fields, but the snapshot does not keep the original object's identity, prototype, `instanceof` checks, accessors, or property attributes:

```js
const template = { tenant: 'acme' };

instance.interceptors.request.use((config) => {
  // `tenant` is inherited from `template`; a custom adapter
  // reads it as an own field of the snapshot: config.tenant === 'acme'
  return Object.assign(Object.create(template), config);
});
```

Fields inherited from `Object.prototype`, or from a prototype that itself has a `null` prototype (such as one created with `Object.create(null)`), are ignored:

```js
const nullTemplate = Object.create(null);
nullTemplate.tenant = 'acme';

instance.interceptors.request.use((config) => {
  // `tenant` is ignored because `nullTemplate` has a null prototype:
  // a custom adapter sees config.tenant === undefined
  return Object.assign(Object.create(nullTemplate), config);
});
```

A null-prototype config is also copied when it is frozen, sealed, uses accessors or non-writable properties, or contains one of the unsafe keys, because axios must update fields such as `headers` and `data` during dispatch. These rules are an intentional security boundary that prevents values injected into shared prototypes from changing request behavior; they do not make modifying `Object.prototype` safe or supported.

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

## Interceptor execution order

::: warning Request and response interceptors run in **opposite** orders
Request interceptors are executed in **reverse order** (LIFO — last in, first out). The _last_ request interceptor added is executed _first_.

Response interceptors are executed in the **order they were added** (FIFO — first in, first out). The _first_ response interceptor added is executed _first_.
:::

The following example shows the full execution order for three request interceptors and three response interceptors:

```js
const instance = axios.create();

const interceptor = (id) => (base) => {
  console.log(id);
  return base;
};

instance.interceptors.request.use(interceptor("Request Interceptor 1"));
instance.interceptors.request.use(interceptor("Request Interceptor 2"));
instance.interceptors.request.use(interceptor("Request Interceptor 3"));
instance.interceptors.response.use(interceptor("Response Interceptor 1"));
instance.interceptors.response.use(interceptor("Response Interceptor 2"));
instance.interceptors.response.use(interceptor("Response Interceptor 3"));

// Console output:
// Request Interceptor 3
// Request Interceptor 2
// Request Interceptor 1
// [HTTP request is made]
// Response Interceptor 1
// Response Interceptor 2
// Response Interceptor 3
```

## Multiple interceptors

You may add multiple interceptors to the same request or response. The following will hold true for multiple interceptors in the same chain in the order below:

- Each interceptor is executed
- Request interceptors are executed in reverse order (LIFO).
- Response interceptors are executed in the order they were added (FIFO).
- only the last interceptor's result is returned
- every interceptor receives the result of its predecessor
- when the fulfilment-interceptor throws
  - the following fulfilment-interceptor is not called
  - the following rejection-interceptor is called
  - once caught, another following fulfil-interceptor is called again (just like in a promise chain).

::: tip
To gain an in-depth understanding of how interceptors work, you can read the test cases over [here](https://github.com/axios/axios/blob/v1.x/tests/browser/interceptors.browser.test.js).
:::
