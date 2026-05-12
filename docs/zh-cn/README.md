<div align="center">
   <a href="https://axios-http.com"><img src="https://axios-http.com/assets/logo.svg" alt="Axios" /></a><br>
</div>

<p align="center">基于 Promise 的 HTTP 客户端，适用于浏览器和 Node.js</p>

<p align="center">
    <a href="https://axios-http.com/"><b>官方网站</b></a> •
    <a href="https://axios-http.com/docs/intro"><b>文档</b></a>
</p>

<div align="center">

[![npm 版本](https://img.shields.io/npm/v/axios.svg?style=flat-square)](https://www.npmjs.org/package/axios)
[![npm 下载量](https://img.shields.io/npm/dm/axios.svg?style=flat-square)](https://npm-stat.com/charts.html?package=axios)

</div>

---

> 📖 **本文为中文翻译版本**
> 
> 如果你发现翻译有误或需要更新，请提交 Issue 或 PR。
> 
> [英文原版 README](../../README.md)

---

## 目录

- [特性](#特性)
- [浏览器支持](#浏览器支持)
- [安装](#安装)
  - [包管理器](#包管理器)
  - [CDN](#cdn)
- [示例](#示例)
- [Axios API](#axios-api)
- [请求方法别名](#请求方法别名)
- [创建实例](#创建实例)
- [实例方法](#实例方法)
- [请求配置](#请求配置)
- [响应结构](#响应结构)
- [配置默认值](#配置默认值)
- [拦截器](#拦截器)
- [错误处理](#错误处理)
- [取消请求](#取消请求)
- [TypeScript 支持](#typescript-支持)
- [许可证](#许可证)

---

## 特性

- **浏览器请求：** 从浏览器发起 [XMLHttpRequest](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest) 请求
- **Node.js 请求：** 从 Node.js 环境发起 [http](https://nodejs.org/api/http.html) 请求
- **基于 Promise：** 完全支持 [Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise) API，简化异步代码
- **拦截器：** 拦截请求和响应，添加自定义逻辑或转换数据
- **数据转换：** 自动转换请求和响应数据
- **请求取消：** 使用内置机制取消请求
- **自动 JSON 处理：** 自动序列化和解析 [JSON](https://www.json.org/json-en.html) 数据
- **表单序列化：** 🆕 自动将数据对象序列化为 `multipart/form-data` 或 `x-www-form-urlencoded` 格式
- **XSRF 防护：** 客户端支持防御[跨站请求伪造](https://zh.wikipedia.org/wiki/%E8%B7%A8%E7%AB%99%E8%AF%B7%E6%B1%82%E4%BC%AA%E9%80%A0)

---

## 浏览器支持

| Chrome | Firefox | Safari | Opera | Edge |
| :----: | :-----: | :----: | :---: | :--: |
| Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ |

---

## 安装

### 包管理器

使用 npm：

```bash
npm install axios
```

使用 yarn：

```bash
yarn add axios
```

使用 pnpm：

```bash
pnpm add axios
```

使用 bun：

```bash
bun add axios
```

安装完成后，你可以使用 `import` 或 `require` 导入库：

```js
import axios from "axios";

// 或者导入具名导出
import { isCancel, AxiosError } from "axios";
```

如果你使用 `require` 导入，**只有默认导出可用**：

```js
const axios = require("axios");
```

### CDN

使用 jsDelivr CDN：

```html
<script src="https://cdn.jsdelivr.net/npm/axios@1.13.2/dist/axios.min.js"></script>
```

使用 unpkg CDN：

```html
<script src="https://unpkg.com/axios@1.13.2/dist/axios.min.js"></script>
```

---

## 示例

### 发起 GET 请求

```js
import axios from "axios";

// 向给定 ID 的用户发起请求
axios.get("/user?ID=12345")
  .then(function (response) {
    // 处理成功情况
    console.log(response);
  })
  .catch(function (error) {
    // 处理错误情况
    console.log(error);
  })
  .finally(function () {
    // 总是会执行
  });

// 上面的请求也可以这样做
axios.get("/user", {
    params: {
      ID: 12345
    }
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  })
  .finally(function () {
    // 总是会执行
  });
```

### 发起 POST 请求

```js
axios.post("/user", {
    firstName: "Fred",
    lastName: "Flintstone"
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  });
```

### 发起多个并发请求

```js
function getUserAccount() {
  return axios.get("/user/12345");
}

function getUserPermissions() {
  return axios.get("/user/12345/permissions");
}

const [acct, perm] = await axios.all([getUserAccount(), getUserPermissions()]);

// 或者使用展开语法
const [acct, perm] = await Promise.all([getUserAccount(), getUserPermissions()]);
```

---

## Axios API

可以通过向 `axios` 传递相关配置来发起请求。

### axios(config)

```js
// 发起 POST 请求
axios({
  method: "post",
  url: "/user/12345",
  data: {
    firstName: "Fred",
    lastName: "Flintstone"
  }
});
```

```js
// 发起 GET 请求（默认方法）
axios("/user/12345");
```

### axios(url[, config])

```js
// 发起 GET 请求（默认方法）
axios("/user/12345");
```

---

## 请求方法别名

为了方便起见，为所有常用请求方法提供了别名。

- `axios.request(config)`
- `axios.get(url[, config])`
- `axios.delete(url[, config])`
- `axios.head(url[, config])`
- `axios.options(url[, config])`
- `axios.post(url[, data[, config]])`
- `axios.put(url[, data[, config]])`
- `axios.patch(url[, data[, config]])`
- `axios.postForm(url[, data[, config]])`
- `axios.putForm(url[, data[, config]])`
- `axios.patchForm(url[, data[, config]])`

> **注意：** 当使用别名方法时，`url`、`method` 和 `data` 属性不需要在 config 中指定。

---

## 创建实例

可以使用自定义配置创建 axios 实例。

### axios.create([config])

```js
const instance = axios.create({
  baseURL: "https://some-domain.com/api/",
  timeout: 1000,
  headers: {"X-Custom-Header": "foobar"}
});
```

---

## 实例方法

可用的实例方法如下。指定的配置将与实例配置合并。

- `axios#request(config)`
- `axios#get(url[, config])`
- `axios#delete(url[, config])`
- `axios#head(url[, config])`
- `axios#options(url[, config])`
- `axios#post(url[, data[, config]])`
- `axios#put(url[, data[, config]])`
- `axios#patch(url[, data[, config]])`
- `axios#getUri([config])`

---

## 请求配置

这些是创建请求时可以用的配置选项。只有 `url` 是必需的。如果没有指定 `method`，请求将默认使用 `GET` 方法。

```js
{
  // `url` 是用于请求的服务器 URL
  url: "/user",

  // `method` 是创建请求时使用的方法
  method: "get", // 默认值

  // `baseURL` 将自动加在 `url` 前面，除非 `url` 是一个绝对 URL
  baseURL: "https://some-domain.com/api/",

  // `transformRequest` 允许在向服务器发送前修改请求数据
  transformRequest: [function (data, headers) {
    return data;
  }],

  // `transformResponse` 在传递给 then/catch 前修改响应数据
  transformResponse: [function (data) {
    return data;
  }],

  // 自定义请求头
  headers: {"X-Requested-With": "XMLHttpRequest"},

  // `params` 是与请求一起发送的 URL 参数
  params: {
    ID: 12345
  },

  // `paramsSerializer` 是一个可选配置，用来序列化 `params`
  paramsSerializer: {
    indexes: null // 数组参数不添加索引
  },

  // `data` 是作为请求体被发送的数据
  data: {
    firstName: "Fred"
  },

  // `timeout` 指定请求超时的毫秒数
  timeout: 1000, // 默认值是 `0` (无超时)

  // `withCredentials` 表示跨域请求时是否需要使用凭证
  withCredentials: false, // 默认值

  // `adapter` 允许自定义处理请求，这使测试更加容易
  adapter: function (config) {
    /* ... */
  },

  // `auth` 表示应该使用 HTTP 基础验证，并提供凭据
  auth: {
    username: "janedoe",
    password: "s00pers3cret"
  },

  // `responseType` 表示服务器响应的数据类型
  responseType: "json", // 默认值

  // `responseEncoding` 表示用于解码响应的编码
  responseEncoding: "utf8", // 默认值

  // `xsrfCookieName` 是用作 xsrf token 的值的cookie的名称
  xsrfCookieName: "XSRF-TOKEN", // 默认值

  // `xsrfHeaderName` 是携带 xsrf token 值的 http 头的名称
  xsrfHeaderName: "X-XSRF-TOKEN", // 默认值

  // `onUploadProgress` 允许为上传处理进度事件
  onUploadProgress: function (progressEvent) {
  },

  // `onDownloadProgress` 允许为下载处理进度事件
  onDownloadProgress: function (progressEvent) {
  },

  // `maxContentLength` 定义允许的响应内容的最大尺寸
  maxContentLength: 2000,

  // `maxBodyLength` 定义允许的请求内容的最大尺寸
  maxBodyLength: 2000,

  // `validateStatus` 定义对于给定的HTTP 响应状态码是 resolve 还是 reject
  validateStatus: function (status) {
    return status >= 200 && status < 300; // 默认值
  },

  // `maxRedirects` 定义在 node.js 中 follow 的最大重定向数目
  maxRedirects: 5, // 默认值

  // `signal` 可以用来取消请求
  signal: new AbortController().signal,

  // `decompress` 表示是否应该自动解压响应体
  decompress: true // 默认值
}
```

---

## 响应结构

一个请求的响应包含以下信息。

```js
{
  // `data` 由服务器提供的响应
  data: {},

  // `status` 来自服务器响应的 HTTP 状态码
  status: 200,

  // `statusText` 来自服务器响应的 HTTP 状态信息
  statusText: "OK",

  // `headers` 服务器响应头
  headers: {},

  // `config` 是 `axios` 请求的配置信息
  config: {},

  // `request` 是生成此响应的请求
  request: {}
}
```

当使用 `then` 时，你将接收如下响应：

```js
axios.get("/user/12345")
  .then(function (response) {
    console.log(response.data);
    console.log(response.status);
    console.log(response.statusText);
    console.log(response.headers);
    console.log(response.config);
  });
```

---

## 配置默认值

你可以指定将应用于每个请求的配置默认值。

### 全局 axios 默认值

```js
axios.defaults.baseURL = "https://api.example.com";
axios.defaults.headers.common["Authorization"] = AUTH_TOKEN;
axios.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
```

### 自定义实例默认值

```js
// 创建实例时设置配置默认值
const instance = axios.create({
  baseURL: "https://api.example.com"
});

// 实例创建后修改默认值
instance.defaults.headers.common["Authorization"] = AUTH_TOKEN;
```

### 配置优先级

配置将会按优先级合并。顺序是：

1. 在 [lib/defaults/index.js](https://github.com/axios/axios/blob/main/lib/defaults/index.js#L49) 中找到的库默认值
2. 实例的 `defaults` 属性
3. 请求的 `config` 参数

后面的优先级高于前面的。

---

## 拦截器

在请求或响应被 `then` 或 `catch` 处理前拦截它们。

```js
// 添加请求拦截器
axios.interceptors.request.use(function (config) {
    // 在发送请求之前做些什么
    return config;
  }, function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  });

// 添加响应拦截器
axios.interceptors.response.use(function (response) {
    // 2xx 范围内的状态码都会触发该函数
    return response;
  }, function (error) {
    // 超出 2xx 范围的状态码都会触发该函数
    return Promise.reject(error);
  });
```

如果你需要稍后移除拦截器，可以这样做：

```js
const myInterceptor = axios.interceptors.request.use(function () {/*...*/});
axios.interceptors.request.eject(myInterceptor);
```

---

## 错误处理

```js
axios.get("/user/12345")
  .catch(function (error) {
    if (error.response) {
      // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      // 请求已经成功发起，但没有收到响应
      console.log(error.request);
    } else {
      // 发送请求时出了点问题
      console.log("Error", error.message);
    }
    console.log(error.config);
  });
```

使用 `validateStatus` 配置选项，可以自定义抛出错误的 HTTP 状态码范围：

```js
axios.get("/user/12345", {
  validateStatus: function (status) {
    return status < 500; // 状态码大于等于 500 时才会 reject
  }
});
```

---

## 取消请求

### 使用 AbortController

从 `v0.22.0` 开始，Axios 支持以 fetch API 方式取消请求：

```js
const controller = new AbortController();

axios.get("/foo/bar", {
  signal: controller.signal
}).then(function (response) {
  // 处理响应
});

// 取消请求
controller.abort();
```

---

## TypeScript 支持

Axios 包含 TypeScript 类型定义。

```ts
const user = await axios.get<User>("/user/1");
console.log(user.data.id);
```

---

## 许可证

[MIT](../../LICENSE)

---

## 📝 贡献者

感谢所有为 Axios 做出贡献的开发者！

[![Contributors](https://img.shields.io/github/contributors/axios/axios.svg?style=flat-square)](../../CONTRIBUTORS.md)
