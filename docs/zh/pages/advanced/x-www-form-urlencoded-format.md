# x-www-form-urlencoded 格式

## URLSearchParams

默认情况下，axios 会将 JavaScript 对象序列化为 `JSON`。如果需要以 [`application/x-www-form-urlencoded` 格式](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST)发送数据，可以使用 [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) API，绝大多数浏览器[已支持](http://www.caniuse.com/#feat=urlsearchparams)该 API，Node.js 从 v10（2018 年发布）开始也[支持](https://nodejs.org/api/url.html#url_class_urlsearchparams)。

```js
const params = new URLSearchParams({ foo: 'bar' });
params.append('extraparam', 'value');
axios.post('/foo', params);
```

## 查询字符串 <Badge type="danger" text="非常旧" />

对于不支持 `URLSearchParams` 的旧版浏览器或环境，可以使用 [`qs`](https://github.com/ljharb/qs) 库将对象序列化为 `application/x-www-form-urlencoded` 格式。

```js
const qs = require('qs');
axios.post('/foo', qs.stringify({ bar: 123 }));
```

在非常旧的 Node.js 版本中，可以使用 Node.js 内置的 `querystring` 模块。注意该模块在 Node.js v16 中已废弃——新代码请优先使用 `URLSearchParams` 或 `qs`。

```js
const querystring = require('querystring');
axios.post('https://something.com/', querystring.stringify({ foo: 'bar' }));
```

## 自动序列化为 URLSearchParams <Badge type="tip" text="新特性" />

从 v0.21.0 起，如果将 `Content-Type` 请求头设置为 `application/x-www-form-urlencoded`，axios 会自动将 JavaScript 对象序列化为 `URLSearchParams`。这意味着你可以直接将 JavaScript 对象传入 axios 请求配置的 `data` 属性。例如，向 `POST` 请求传递数据时：

```js
const data = {
  x: 1,
  arr: [1, 2, 3],
  arr2: [1, [2], 3],
  users: [
    { name: 'Peter', surname: 'Griffin' },
    { name: 'Thomas', surname: 'Anderson' },
  ],
};

await axios.postForm('https://postman-echo.com/post', data, {
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
});
```

`data` 对象将被自动序列化为 `URLSearchParams` 并以 `application/x-www-form-urlencoded` 格式发送。服务器将收到以下数据：

```json
{
  "x": "1",
  "arr[]": ["1", "2", "3"],
  "arr2[0]": "1",
  "arr2[1][0]": "2",
  "arr2[2]": "3",
  "users[0][name]": "Peter",
  "users[0][surname]": "Griffin",
  "users[1][name]": "Thomas",
  "users[1][surname]": "Anderson"
}
```

如果你的后端 body 解析器（如 `express.js` 的 `body-parser`）支持嵌套对象解码，服务器端将自动还原为相同的对象结构：

```js
var app = express();

app.use(bodyParser.urlencoded({ extended: true })); // 支持编码后的请求体

app.post('/', function (req, res, next) {
  // 将请求体以 JSON 格式回传
  res.send(JSON.stringify(req.body));
});

server = app.listen(3000);
```
