# axios

[![npm version](https://img.shields.io/npm/v/axios.svg?style=flat-square)](https://www.npmjs.org/package/axios)
[![build status](https://img.shields.io/travis/axios/axios.svg?style=flat-square)](https://travis-ci.org/axios/axios)
[![code coverage](https://img.shields.io/coveralls/mzabriskie/axios.svg?style=flat-square)](https://coveralls.io/r/mzabriskie/axios)
[![npm downloads](https://img.shields.io/npm/dm/axios.svg?style=flat-square)](http://npm-stat.com/charts.html?package=axios)
[![gitter chat](https://img.shields.io/gitter/room/mzabriskie/axios.svg?style=flat-square)](https://gitter.im/mzabriskie/axios)

基于Promise的浏览器和node.js的HTTP客户端

## 特性

- 在浏览器中使用 [XMLHttpRequests](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) 对象
- 在nodejs中使用 [http](http://nodejs.org/api/http.html) 对象
- 支持 [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) API
- 拦截请求 (request) 和响应 (response)
- 转换请求 (request) 和响应 (response) 的数据
- 取消请求
- 自动转换 JSON 数据
- 支持对 [XSRF](http://en.wikipedia.org/wiki/Cross-site_request_forgery) 的保护

## 浏览器支持

![Chrome](https://raw.github.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![Safari](https://raw.github.com/alrra/browser-logos/master/src/safari/safari_48x48.png) | ![Opera](https://raw.github.com/alrra/browser-logos/master/src/opera/opera_48x48.png) | ![Edge](https://raw.github.com/alrra/browser-logos/master/src/edge/edge_48x48.png) | ![IE](https://raw.github.com/alrra/browser-logos/master/src/archive/internet-explorer_9-11/internet-explorer_9-11_48x48.png) |
--- | --- | --- | --- | --- | --- |
Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | 8+ ✔ |

[![Browser Matrix](https://saucelabs.com/open_sauce/build_matrix/axios.svg)](https://saucelabs.com/u/axios)

## 安装

使用 npm:

```bash
$ npm install axios
```

使用 bower:

```bash
$ bower install axios
```

使用 cdn:

```html
<script src="https://unpkg.com/axios/dist/axios.min.js"></script>
```

## 例子

发起一个 `GET` 请求

```js
// 通过指定一个 ID 请求一个 user
axios.get('/user?ID=12345')
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  });

// 上面的请求也可以像下面这样
axios.get('/user', {
    params: {
      ID: 12345
    }
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  });
```

发起一个 `POST` 请求

```js
axios.post('/user', {
    firstName: 'Fred',
    lastName: 'Flintstone'
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  });
```

执行并发请求

```js
function getUserAccount() {
  return axios.get('/user/12345');
}

function getUserPermissions() {
  return axios.get('/user/12345/permissions');
}

axios.all([getUserAccount(), getUserPermissions()])
  .then(axios.spread(function (acct, perms) {
    // 所有的请求在这里都执行完毕了
    // spread 方法中的fn的参数 为按顺序接收的 请求的响应 
    // acct 对应 getUserAccount 的响应 perms 对应 getUserPermissions 的响应
  }));
```

## axios API

可以通过传递相关的 config 来发起 `axios` 请求 .

##### axios(config)

```js
// 发送一个 POST 请求
axios({
  method: 'post',
  url: '/user/12345',
  data: {
    firstName: 'Fred',
    lastName: 'Flintstone'
  }
});
```

```js
// GET 请求远程的图片
axios({
  method:'get',
  url:'http://bit.ly/2mTM3nY',
  responseType:'stream'
})
  .then(function(response) {
  response.data.pipe(fs.createWriteStream('ada_lovelace.jpg'))
});
```

##### axios(url[, config])

```js
// 发送一个 GET 请求 (默认 method)
axios('/user/12345');
```

### 请求 method 的别名

方便起见 `axios` 提供了所有支持的 method 的别名.

##### axios.request(config)
##### axios.get(url[, config])
##### axios.delete(url[, config])
##### axios.head(url[, config])
##### axios.options(url[, config])
##### axios.post(url[, data[, config]])
##### axios.put(url[, data[, config]])
##### axios.patch(url[, data[, config]])

###### 提示
当使用别名方法时，`url`, `method`, 和 `data` 属性不需要在去 config 里声明了.

### 并发

处理并发请求的辅助 function.

##### axios.all(iterable)
##### axios.spread(callback)

### 创建一个 `axios` 实例

你可以使用自定义的 config 来创建一个 `axios` 实例.

##### axios.create([config])

```js
var instance = axios.create({
  baseURL: 'https://some-domain.com/api/',
  timeout: 1000,
  headers: {'X-Custom-Header': 'foobar'}
});
```

### 实例方法

下列就是可以使用的实例方法.下面方法中声明的 config 会和你创建 `axios` 实例时使用的 config 混合到一起.

##### axios#request(config)
##### axios#get(url[, config])
##### axios#delete(url[, config])
##### axios#head(url[, config])
##### axios#options(url[, config])
##### axios#post(url[, data[, config]])
##### axios#put(url[, data[, config]])
##### axios#patch(url[, data[, config]])

## 请求配置

下面这些就是创建请求可以使用的配置选项. 只有 `url` 是必须的. 如果 `method` 字段没有声明, 请求会默认使用 `GET` .
```js
{
  // `url` 是请求所需要的服务器的 URL
  url: '/user',

  // `method` 是创建请求时所使用的 method
  method: 'get', // 默认的

  // `baseURL` 会在加在 url 的前面, 除非 url 是绝对地址.
  // 设置 `baseurl` 会很方便的将相对 url 传递给实例的不同方法.
  baseURL: 'https://some-domain.com/api/',

  // `transformRequest` 允许在发送到服务器前改变请求 (request) 数据
  // 仅适用 'PUT', 'POST', 和 'PATCH' 方法
  // 数组中的最后一个 function 必须返回 string 或 Buffer, ArrayBuffer, FormData 或 Stream 的实例
  // 你可能需要修改请求的 headers (将 content-type 设置为对应的数据形式).
  transformRequest: [function (data, headers) {
    // 可以做任何你想要改变数据的行为

    return data;
  }],

  // `transformResponse` 在响应到达 then 或catch 之前 可以改变响应的数据
  transformResponse: [function (data) {
    // 可以做任何你想要改变数据的行为

    return data;
  }],

  // `headers` 指定的自定义 headers
  headers: {'X-Requested-With': 'XMLHttpRequest'},

  // `params` 是请求中使用的 URL 的参数
  // 必须为简单的对象或一个 URLSearchParams 对象
  params: {
    ID: 12345
  },

  // `paramsSerializer` 是在序列化 `params` 时 一个可选的 function
  // (e.g. https://www.npmjs.com/package/qs, http://api.jquery.com/jquery.param/)
  paramsSerializer: function(params) {
    return Qs.stringify(params, {arrayFormat: 'brackets'})
  },

  // `data` 是请求的 body 中的数据
  // 仅适用 'PUT', 'POST', 和 'PATCH' 方法
  // 如果没有设置 `transformRequest`, data 必须为下列中的任意一种类型:
  // - 字符串, 简单的对象, ArrayBuffer, ArrayBufferView, URLSearchParams
  // - 浏览器中: FormData, File, Blob
  // - Node中: Stream, Buffer
  data: {
    firstName: 'Fred'
  },

  // `timeout` 声明请求超时的 毫秒 数.
  // 如果请求的时间超过 `timeout`, 那么请求则会被终止 (abort).
  timeout: 1000,

  // `withCredentials` 是否使用凭据来进行跨域访问请求
  withCredentials: false, // 默认的

  // `adapter` 允许自定义处理请求，这样比较容易测试.
  // 返回一个 Promise 和 支持的 响应 (参阅 lib/adapters/README.md).
  adapter: function (config) {
    /* ... */
  },

  // `auth` 指定 HTTP 使用基本验证, 并提供凭据.
  // 这会设置一个 `Authorization` 头, 会覆盖你在设置中 headers 中设置的 `Authorization` 头.
  auth: {
    username: 'janedoe',
    password: 's00pers3cret'
  },

  // `responseType` 指定服务器所返回的数据类型
  // 选项为 'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'
  responseType: 'json', // 默认为json

  // `xsrfCookieName` 是作为 xsrf token 所使用的 cookie 的名称
  xsrfCookieName: 'XSRF-TOKEN', // 默认为 XSRF-TOKEN

  // `xsrfHeaderName` 是http协议头中携带 xsrf token 值的 header 名称
  xsrfHeaderName: 'X-XSRF-TOKEN', // 默认为 X-XSRF-TOKEN

  // `onUploadProgress` 允许处理上传过程中的进度事件
  onUploadProgress: function (progressEvent) {
    // 做任何你需要处理原生进度事件的行为
  },

  // `onDownloadProgress` 允许处理下载过程中的进度事件
  onDownloadProgress: function (progressEvent) {
    // 做任何你需要处理原生进度事件的行为
  },

  // `maxContentLength` 定义响应数据的最大长度
  maxContentLength: 2000,

  // `validateStatus` 定义是否通过给定的响应码去 resolve 或 reject Promise.
  // 如果 `validateStatus` 返回 `true` (或者设置为 `null` 或 `undefined`) 将会 resolve Promise
  // 否则会 reject Promise
  validateStatus: function (status) {
    return status >= 200 && status < 300; // 默认的
  },

  // `maxRedirects` 设置在 node.js 中的最大重定向次数.
  // 如果设置为 0 则不进行重定向.
  maxRedirects: 5, // 默认的

  // `httpAgent` 和 `httpsAgent` 定义一个在 nodejs 中, 发起 http 和 https 请求所分别使用的自定义 agent. 
  // 这允许增加一个选项 比如 `keepAlive`. 
  // 默认是不使用的.
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),

  // 'proxy' 定义代理的域名和端口
  // 设置 `false` 来禁用代理, 忽略环境变量.
  // `auth` 指定连接代理服务器时所使用的基本认证, 并提供凭据. 
  // 这会设置一个 `Proxy-Authorization` 头, 会覆盖你在设置中 headers 中设置的 `Proxy-Authorization` 头.
  proxy: {
    host: '127.0.0.1',
    port: 9000,
    auth: {
      username: 'mikeymike',
      password: 'rapunz3l'
    }
  },

  // `cancelToken` 声明一个可以取消此次请求的 cancelToken
  // (更多细节参阅下面的 Cancellation 章节)
  cancelToken: new CancelToken(function (cancel) {
  })
}
```

## 响应结构

一个请求的响应包含如下信息.

```js
{
  // `data` 是服务器所提供的返回数据
  data: {},

  // `status` 是服务器返回的状态码
  status: 200,

  // `statusText` 是服务器返回的状态码消息
  statusText: 'OK',

  // `headers` 时服务器返回的协议头
  // 所有的协议头名称都是小写的 (eg: content-type)
  headers: {},

  // `config` 是创建 `axios` 请求时提供的 config
  config: {},

  // `request` 是此次返回所使用的请求对象
  // 在 node.js 是最后一次请求的请求对象 (重定向)
  // 在浏览器中 是 XMLHttpRequest 对象
  request: {}
}
```

当使用 `then` 时, 你可以像下面这样接收 response 对象:

```js
axios.get('/user/12345')
  .then(function(response) {
    console.log(response.data);
    console.log(response.status);
    console.log(response.statusText);
    console.log(response.headers);
    console.log(response.config);
  });
```

当使用 `catch` 时, 或传递 [rejection callback](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then) 作为 `then` 的第二参数时, 响应讲作为 `error` 对象正如我们在 [Handling Errors](#handling-errors) 章节所讲的那样.

## 默认设置

你可以为每个请求声明默认设置.

### 全局axios默认设置

```js
axios.defaults.baseURL = 'https://api.example.com';
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

### 自定义实例设置

```js
// 在创建实例时设置
var instance = axios.create({
  baseURL: 'https://api.example.com'
});

// 在实例创建完毕后改变默认设置
instance.defaults.headers.common['Authorization'] = AUTH_TOKEN;
```

### 配置的优先级

Config 会通过优先级来合并. 顺序为库中的默认值 (可以在 `lib/defaults.js` 中查看), 然后是 `defaults` (实例的属性), 最后是 `config` (请求时的参数). 后者将优先于前者. 下面是一个例子.

```js
// 创建一个使用默认库中的 config 的实例
// 此时, timeout 因为通过默认的库的设置, 所以为 0
var instance = axios.create();

// 覆盖默认库的设置
// 此时所有的请求的超时均为 2.5 秒
instance.defaults.timeout = 2500;

// 覆盖此次请求的 timeout 的值, 假设我们知道这个请求会比其他请求要久一些
instance.get('/longRequest', {
  timeout: 5000
});
```

## 拦截器

你可以拦截在 `then` 或 `catch` 处理之前拦截请求和响应.

```js
// 增加一个请求拦截器
axios.interceptors.request.use(function (config) {
    // 在请求发出前做一些处理
    return config;
  }, function (error) {
    // 当请求发生错误时 做一些处理
    return Promise.reject(error);
  });

// 增加一个响应拦截器
axios.interceptors.response.use(function (response) {
    // 对响应的数据做一些处理
    return response;
  }, function (error) {
    // 当响应发生错误时 做一些处理
    return Promise.reject(error);
  });
```

如果你过一会需要移除拦截器, 你可以这样做.

```js
var myInterceptor = axios.interceptors.request.use(function () {/*...*/});
axios.interceptors.request.eject(myInterceptor);
```

你可以为自定义的 `axios` 实例 添加一个拦截器.

```js
var instance = axios.create();
instance.interceptors.request.use(function () {/*...*/});
```

## 错误处理

```js
axios.get('/user/12345')
  .catch(function (error) {
    if (error.response) {
      // 请求已经发出, 但是服务器返回了一个不在 2XX 范围内的状态码
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      // 请求已经发出, 但是没有任何响应
      // `error.request` 在浏览器中是 XMLHttpRequest 实例, 在 nodejs 中是 http.ClientRequest 实例
      console.log(error.request);
    } else {
      // 在配置请求的过程中发生了一些错误
      console.log('Error', error.message);
    }
    console.log(error.config);
  });
```

你可以自己定义一个状态码的错误范围, 在 config 选项中的 `validateStatus` 设置.

```js
axios.get('/user/12345', {
  validateStatus: function (status) {
    return status < 500; // 当错误码大于 500 时才reject
  }
})
```

## 取消机制

使用 *cancel token* 你可以取消一个请求.

> axios 的 cancel token API 是基于被撤回的 [可取消的 Promise 提案](https://github.com/tc39/proposal-cancelable-promises) .

你可以像下面这样, 通过使用 `CancelToken.source` 来创建一个 cancel token :

```js
var CancelToken = axios.CancelToken;
var source = CancelToken.source();

axios.get('/user/12345', {
  cancelToken: source.token
}).catch(function(thrown) {
  if (axios.isCancel(thrown)) {
    console.log('Request canceled', thrown.message);
  } else {
    // 处理错误
  }
});

// 取消这个请求 (消息参数是可选的)
source.cancel('Operation canceled by the user.');
```

你也可以通过给 `CancelToken` 的构造器传递一个 executor函数 来创建一个 cancel token:

```js
var CancelToken = axios.CancelToken;
var cancel;

axios.get('/user/12345', {
  cancelToken: new CancelToken(function executor(c) {
    // executor函数 接收一个 cancel 函数作为参数
    cancel = c;
  })
});

// 取消请求
cancel();
```

> 提示: 你可以使用相同的 cancel token 来取消某几个请求.

## 使用 application/x-www-form-urlencoded 格式

默认情况下, axios 会将 JavaScript 对象转换为 `JSON` . 如果想使用 `application/x-www-form-urlencoded` 格式来发送请求, 你可以使用下列任意一中方式.

### 浏览器

在浏览器中, 你可以使用 [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) API, 像下面这样:

```js
var params = new URLSearchParams();
params.append('param1', 'value1');
params.append('param2', 'value2');
axios.post('/foo', params);
```

> 提示一下 `URLSearchParams` 并不是被所有浏览器都支持 (参阅 [caniuse.com](http://www.caniuse.com/#feat=urlsearchparams)), 但有一个 [polyfill](https://github.com/WebReflection/url-search-params) 可以使用 (一定确保全局环境使用了 polyfill).

另外, 你可以使用 [`qs`](https://github.com/ljharb/qs) 库:

```js
var qs = require('qs');
axios.post('/foo', qs.stringify({ 'bar': 123 }));
```

### Node.js

node.js 中, 你可以使用 [`querystring`](https://nodejs.org/api/querystring.html) 模块, 像下面这样:

```js
var querystring = require('querystring');
axios.post('http://something.com/', querystring.stringify({ foo: 'bar' }));
```

你也可以使用 [`qs`](https://github.com/ljharb/qs) 库.

## 版本控制

除非 axios 到达 `1.0` 版本, 否则新的版本不会有较大改变. 比如 `0.5.1`, 和 `0.5.4` 会使用相同的 API, 但是 `0.6.0` 就会有较大改动.

## Promises

axios 依赖于原生的 ES6 的 Promise 的实施方案 [Promise 支持](http://caniuse.com/promises).
如果你的环境不支持原生的 ES6 Promises, 你可以使用 [polyfill](https://github.com/jakearchibald/es6-promise).

## TypeScript
axios 包含 [TypeScript](http://typescriptlang.org) 定义.
```typescript
import axios from 'axios';
axios.get('/user?ID=12345');
```

## 资源

* [改动日志](https://github.com/axios/axios/blob/master/CHANGELOG.md)
* [升级指南](https://github.com/axios/axios/blob/master/UPGRADE_GUIDE.md)
* [生态系统](https://github.com/axios/axios/blob/master/ECOSYSTEM.md)
* [贡献代码指南](https://github.com/axios/axios/blob/master/CONTRIBUTING.md)
* [编码指导](https://github.com/axios/axios/blob/master/CODE_OF_CONDUCT.md)

## Credits

axios 深受 [Angular](https://angularjs.org/) 的 [$http 服务](https://docs.angularjs.org/api/ng/service/$http) 的启发. 从根本上上来说, axios 是希望在 Angular 之外提供一套标准的类 `$http` 服务的实现.

## License

MIT
