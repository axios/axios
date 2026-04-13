# 入门指南

欢迎阅读 axios 文档！本指南将帮助你快速上手 axios，并发起第一个 API 请求。如果你是 axios 新手，建议从这里开始。

## 安装

你可以通过多种方式在项目中使用 axios。最常见的方式是通过 npm 安装，也支持 jsDelivr、unpkg 等 CDN。

#### 使用 npm

```bash
npm install axios
```

#### 使用 pnpm

```bash
pnpm install axios
```

#### 使用 yarn

```bash
yarn add axios
```

#### 使用 bun

```bash
bun add axios
```

#### 使用 deno

```bash
deno install npm:axios
```

#### 使用 jsDelivr

使用 jsDelivr 时，建议使用压缩版本并固定版本号，以避免意外更新。如需使用最新版本，可以去掉版本号，但强烈不建议在生产环境这样做，因为可能导致应用出现意外变化。

```html
<script src="https://cdn.jsdelivr.net/npm/axios@<x.x.x>/dist/axios.min.js"></script>
```

#### 使用 unpkg

使用 unpkg 时，建议使用压缩版本并固定版本号，以避免意外更新。如需使用最新版本，可以去掉版本号，但强烈不建议在生产环境这样做，因为可能导致应用出现意外变化。

```html
<script src="https://unpkg.com/axios@<x.x.x>/dist/axios.min.js"></script>
```

## 发起第一个请求

使用 axios 发起请求最少只需要两行代码。你可以通过提供 URL 和请求方法向任意 API 发送请求。例如，向 JSONPlaceholder API 发起一个 GET 请求：

```js
import axios from "axios";

const response = await axios.get(
  "https://jsonplaceholder.typicode.com/posts/1"
);

console.log(response.data);
```

axios 提供了简洁的请求 API。你可以使用 `axios.get` 发起 GET 请求，使用 `axios.post` 发起 POST 请求，依此类推。也可以使用 `axios.request` 方法发起任意类型的请求。

## 下一步

现在你已经用 axios 完成了第一个请求，可以继续探索 axios 文档的其余内容。了解更多关于发起请求、处理响应以及在项目中使用 axios 的知识，请查阅文档其他章节。
