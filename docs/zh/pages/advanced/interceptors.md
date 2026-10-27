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

`use()` 返回的数字是一个不透明的拦截器 ID。请将其原样传回给 `eject()`；不要将其用作 `handlers` 数组的索引。建议使用 `eject()` 和 `clear()`，而不是直接编辑 `handlers`：

- 移除未知 ID 或重复移除同一个 ID 不会产生任何效果。
- 即使其他拦截器已被移除或管理器已被清空，过期的 ID 也永远不会移除另一个拦截器。
- 如果 `handlers` 被替换为 `null` 或 `undefined`，该拦截器链会被跳过，下一次调用 `use()` 时会先恢复为空数组，再添加新的拦截器。

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

### 同步拦截器错误

同步请求拦截器抛出错误时，axios 会调用与该拦截器配对的 `onRejected` 处理器，并停止运行其余请求拦截器。如果处理器正常返回（包括返回 `undefined` 或已兑现的 Promise），该错误会被视为已处理，axios 将使用最后一个有效配置发送请求。处理器的返回值不会替换该配置。

若要阻止发送请求，请省略拒绝处理器，或让它抛出错误或返回已拒绝的 Promise。最终错误随后会继续传递给响应拒绝拦截器。

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

仅记录错误的拒绝处理器可以正常返回，以保留现有的继续请求行为：

```js
axios.interceptors.request.use(
  function prepare(config) {
    throw new Error("Optional preparation failed");
  },
  function logPreparationFailure(error) {
    console.warn(error);
    // 正常返回将使用最后一个有效配置发送请求。
  },
  { synchronous: true }
);
```

## 返回不同的配置对象

请求拦截器通常会修改并返回它接收到的配置。该配置是由 axios 创建的、可写的、原型为 null 的对象，原样返回它会保留其身份：适配器和 `response.config` 接收到的是同一个对象。

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

axios 是复用还是复制返回的对象，取决于对象的形态，而不是它是否为拦截器接收到的那个对象。一个可写、可扩展、原型为 null 的对象，如果其所有属性都是可写的数据属性且不包含不安全的键，就会被原样分发：axios 会在该对象上更新 `headers` 和 `data` 等字段，适配器接收的也是同一个对象。这同样适用于拦截器返回的另一个原型为 null 的对象，因此不要返回需要保持不变的对象。

其他任何对象，例如对象字面量、`{ ...config }` 副本或类实例，都会在分发请求前被复制到一个新的、可写的、原型为 null 的快照中。自身字段会被保留，但不安全的键 `__proto__`、`constructor` 和 `prototype` 始终会被丢弃。从应用程序定义的原型继承的字段会被复制为自身字段，但快照不会保留原始对象的身份、原型、`instanceof` 检查、访问器或属性特性：

```js
const template = { tenant: 'acme' };

instance.interceptors.request.use((config) => {
  // `tenant` 继承自 `template`；自定义适配器
  // 会将其作为快照的自身字段读取：config.tenant === 'acme'
  return Object.assign(Object.create(template), config);
});
```

从 `Object.prototype` 继承的字段，或从自身原型为 `null` 的原型（例如使用 `Object.create(null)` 创建的原型）继承的字段会被忽略：

```js
const nullTemplate = Object.create(null);
nullTemplate.tenant = 'acme';

instance.interceptors.request.use((config) => {
  // `tenant` 会被忽略，因为 `nullTemplate` 的原型为 null：
  // 自定义适配器看到的是 config.tenant === undefined
  return Object.assign(Object.create(nullTemplate), config);
});
```

当原型为 null 的配置被冻结、被密封、使用了访问器或不可写属性，或包含某个不安全的键时，它同样会被复制，因为 axios 在分发请求期间必须更新 `headers` 和 `data` 等字段。这些规则是有意设置的安全边界，可防止注入到共享原型中的值改变请求行为；它们并不意味着修改 `Object.prototype` 是安全的或受支持的。

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

## 拦截器执行顺序

::: warning 请求拦截器与响应拦截器的执行顺序**相反**
请求拦截器按**逆序**执行（LIFO——后进先出）。**最后**添加的请求拦截器**最先**执行。

响应拦截器按**添加顺序**执行（FIFO——先进先出）。**最先**添加的响应拦截器**最先**执行。
:::

下面的示例展示了三个请求拦截器和三个响应拦截器的完整执行顺序：

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

// 控制台输出：
// Request Interceptor 3
// Request Interceptor 2
// Request Interceptor 1
// [发起 HTTP 请求]
// Response Interceptor 1
// Response Interceptor 2
// Response Interceptor 3
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
要深入了解拦截器的工作原理，可以查阅[这里](https://github.com/axios/axios/blob/v1.x/tests/browser/interceptors.browser.test.js)的测试用例。
:::
