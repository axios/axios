# x-www-form-urlencoded format

## URLSearchParams

By default, axios serializes JavaScript objects to `JSON`. To send data in the [`application/x-www-form-urlencoded` format](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST) instead, you can use the [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) API, which is [supported](http://www.caniuse.com/#feat=urlsearchparams) in the vast majority of browsers,and [Node](https://nodejs.org/api/url.html#url_class_urlsearchparams) starting with v10 (released in 2018).

```js
const params = new URLSearchParams({ foo: "bar" });
params.append("extraparam", "value");
axios.post("/foo", params);
```

## Query string <Badge type="danger" text="Very old" />

For older browsers, you can use the [`querystring`](https://github.com/ljharb/qs) library to serialize objects to the `application/x-www-form-urlencoded` format.

```js
const qs = require("qs");
axios.post("/foo", qs.stringify({ bar: 123 }));
```

In very old versions of Node.js, you can use the `querystring` module that comes with Node.js.

```js
const querystring = require("querystring");
axios.post("https://something.com/", querystring.stringify({ foo: "bar" }));
```

## Automatic serialization to URLSearchParams <Badge type="tip" text="New" />

Starting from v0.21.0, axios automatically serializes JavaScript objects to `URLSearchParams` if the `Content-Type` header is set to `application/x-www-form-urlencoded`. This means that you can pass a JavaScript object directly to the `data` property of the axios request config. For example when passing data to a `POST` request:

```js
const data = {
  x: 1,
  arr: [1, 2, 3],
  arr2: [1, [2], 3],
  users: [
    { name: "Peter", surname: "Griffin" },
    { name: "Thomas", surname: "Anderson" },
  ],
};

await axios.postForm("https://postman-echo.com/post", data, {
  headers: { "content-type": "application/x-www-form-urlencoded" },
});
```

The `data` object will be automatically serialized to `URLSearchParams` and sent in the `application/x-www-form-urlencoded` format. The server will receive the following data:

```json
{
  "x": "1",
  "arr[]": ["1", "2", "3"],
  "arr2[0]": "1",
  "arr2[1][0]": "2",
  "arr2[2]": "3",
  "arr3[]": ["1", "2", "3"],
  "users[0][name]": "Peter",
  "users[0][surname]": "griffin",
  "users[1][name]": "Thomas",
  "users[1][surname]": "Anderson"
}
```

If your backend body-parser (like `body-parser` of `express.js`) supports nested objects decoding, you will get the same object on the server-side automatically

```js
var app = express();

app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.post("/", function (req, res, next) {
  // echo body as JSON
  res.send(JSON.stringify(req.body));
});

server = app.listen(3000);
```
