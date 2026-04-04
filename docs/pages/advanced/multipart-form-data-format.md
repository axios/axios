# multipart-form-data format

axios can send requests in the `multipart/form-data` format. This format is commonly used when uploading files. To send a request in this format, you need to create a `FormData` object and append the data to it. Then you can pass the `FormData` object to the `data` property of the axios request config.

```js
const formData = new FormData();
formData.append("foo", "bar");

axios.post("https://httpbin.org/post", formData);
```

In node.js, you can use the `form-data` library as follows:

```js
const FormData = require("form-data");

const form = new FormData();
form.append("my_field", "my value");
form.append("my_buffer", new Buffer(10));
form.append("my_file", fs.createReadStream("/foo/bar.jpg"));

axios.post("https://example.com", form);
```

## Automatic serialization to FormData <Badge type="tip" text="New" />

Starting from v0.27.0, Axios supports automatic object serialization to a FormData object if the request Content-Type header is set to multipart/form-data. This means that you can pass a JavaScript object directly to the data property of the axios request config. For example when passing data to a POST request:

```js
import axios from "axios";

axios
  .post(
    "https://httpbin.org/post",
    { x: 1 },
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )
  .then(({ data }) => console.log(data));
```

In the node.js build, the ([`form-data`](https://github.com/form-data/form-data)) polyfill is used by default. You can overload the FormData class by setting the env.FormData config variable, but you probably won't need it in most cases:

```js
const axios = require("axios");
var FormData = require("form-data");

axios
  .post(
    "https://httpbin.org/post",
    { x: 1, buf: new Buffer(10) },
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )
  .then(({ data }) => console.log(data));
```

## Supported endings

Axios FormData serializer supports some special endings to perform the following operations:

- `{}` - serialize the value with JSON.stringify
- `[]` - unwrap the array-like object as separate fields with the same key

::: warning
Note: unwrap/expand operation will be used by default on arrays and FileList objects
:::

## Configuring the FormData serializer

FormData serializer supports additional options via config.formSerializer: object property to handle rare cases:

- `visitor: Function` - user-defined visitor function that will be called recursively to serialize the data object to a FormData object by following custom rules.
- `dots: boolean = false` - use dot notation instead of brackets to serialize arrays and objects;
- `metaTokens: boolean = true` - add the special ending (e.g `user{}: '{"name": "John"}'`) in the FormData key. The back-end body-parser could potentially use this meta-information to automatically parse the value as JSON.
- `indexes: null|false|true = false` - controls how indexes will be added to unwrapped keys of flat array-like objects
  - `null` - don't add brackets (`arr: 1`, `arr: 2`, `arr: 3`)
  - `false` (default) - add empty brackets (`arr[]: 1`, `arr[]: 2`, `arr[]: 3`)
  - `true` - add brackets with indexes (`arr[0]: 1`, `arr[1]: 2`, `arr[2]: 3`)

For example, if we have an object like this:

```js
const obj = {
  x: 1,
  arr: [1, 2, 3],
  arr2: [1, [2], 3],
  users: [
    { name: "Peter", surname: "Griffin" },
    { name: "Thomas", surname: "Anderson" },
  ],
  "obj2{}": [{ x: 1 }],
};
```

The following steps will be executed by the Axios serializer internally:

```js
const formData = new FormData();
formData.append("x", "1");
formData.append("arr[]", "1");
formData.append("arr[]", "2");
formData.append("arr[]", "3");
formData.append("arr2[0]", "1");
formData.append("arr2[1][0]", "2");
formData.append("arr2[2]", "3");
formData.append("users[0][name]", "Peter");
formData.append("users[0][surname]", "Griffin");
formData.append("users[1][name]", "Thomas");
formData.append("users[1][surname]", "Anderson");
formData.append("obj2{}", '[{"x":1}]');
```

Axios supports the following shortcut methods: `postForm`, `putForm`, `patchForm` which are just the corresponding http methods with the `Content-Type` header preset to `multipart/form-data`.
