# multipart/form-data 格式

axios 支持以 `multipart/form-data` 格式发送请求，这种格式常用于文件上传。要以该格式发送请求，需要创建一个 `FormData` 对象并向其追加数据，然后将 `FormData` 对象传入 axios 请求配置的 `data` 属性。

```js
const formData = new FormData();
formData.append('foo', 'bar');

axios.post('https://httpbin.org/post', formData);
```

在 Node.js 中，可以使用 `form-data` 库，如下所示：

```js
const FormData = require('form-data');

const form = new FormData();
form.append('my_field', 'my value');
form.append('my_buffer', Buffer.alloc(10));
form.append('my_file', fs.createReadStream('/foo/bar.jpg'));

axios.post('https://example.com', form);
```

## 自动序列化为 FormData <Badge type="tip" text="新特性" />

从 v0.27.0 起，如果请求的 Content-Type 请求头设置为 `multipart/form-data`，axios 支持自动将对象序列化为 FormData 对象。这意味着你可以直接将 JavaScript 对象传入 axios 请求配置的 `data` 属性。例如，向 POST 请求传递数据时：

```js
import axios from 'axios';

axios
  .post(
    'https://httpbin.org/post',
    { x: 1 },
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  .then(({ data }) => console.log(data));
```

在 Node.js 构建中，默认使用 ([`form-data`](https://github.com/form-data/form-data)) 作为 polyfill。你可以通过设置 `env.FormData` 配置变量来覆盖 FormData 类，但大多数情况下不需要这样做：

```js
const axios = require('axios');
var FormData = require('form-data');

axios
  .post(
    'https://httpbin.org/post',
    { x: 1, buf: Buffer.alloc(10) },
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  .then(({ data }) => console.log(data));
```

## 支持的特殊结尾

axios FormData 序列化器支持以下特殊结尾，用于执行对应操作：

- `{}` - 使用 JSON.stringify 序列化该值
- `[]` - 将类数组对象展开为具有相同键的独立字段

::: warning
注意：展开/扩展操作默认应用于数组和 FileList 对象
:::

## 配置 FormData 序列化器

FormData 序列化器通过 `config.formSerializer` 对象属性支持以下额外选项，用于处理特殊情况：

- `visitor: Function` - 用户自定义的访问者函数，将递归调用以按照自定义规则将数据对象序列化为 FormData 对象。
- `dots: boolean = false` - 使用点号表示法代替方括号来序列化数组和对象；
- `metaTokens: boolean = true` - 在 FormData 键中添加特殊结尾（如 `user{}: '{"name": "John"}'`）。后端 body 解析器可以利用此元信息自动将值解析为 JSON。
- `indexes: null|false|true = false` - 控制如何为扁平类数组对象的展开键添加索引
  - `null` - 不添加方括号（`arr: 1`，`arr: 2`，`arr: 3`）
  - `false`（默认）- 添加空方括号（`arr[]: 1`，`arr[]: 2`，`arr[]: 3`）
  - `true` - 添加带索引的方括号（`arr[0]: 1`，`arr[1]: 2`，`arr[2]: 3`）
- `maxDepth: number = 100` - 序列化器递归的最大对象嵌套深度。如果输入超过此深度，将抛出 `code: 'ERR_FORM_DATA_DEPTH_EXCEEDED'` 的 `AxiosError`。这可以保护服务端应用免受深层嵌套载荷的 DoS 攻击。设置为 `Infinity` 可禁用此限制。

```js
// 当 schema 确实需要超过 100 层嵌套时，可提高限制：
axios.postForm('/api', data, { formSerializer: { maxDepth: 200 } });
```

::: warning 安全提示
默认限制 100 是有意为之。将客户端控制的 JSON 作为 `data` 转发给 axios 的服务端代码，如果没有此保护，容易发生调用栈溢出。除非你的 schema 确实需要，否则不要提高 `maxDepth`。
:::

例如，对于以下对象：

```js
const obj = {
  x: 1,
  arr: [1, 2, 3],
  arr2: [1, [2], 3],
  users: [
    { name: 'Peter', surname: 'Griffin' },
    { name: 'Thomas', surname: 'Anderson' },
  ],
  'obj2{}': [{ x: 1 }],
};
```

axios 序列化器内部将执行以下步骤：

```js
const formData = new FormData();
formData.append('x', '1');
formData.append('arr[]', '1');
formData.append('arr[]', '2');
formData.append('arr[]', '3');
formData.append('arr2[0]', '1');
formData.append('arr2[1][0]', '2');
formData.append('arr2[2]', '3');
formData.append('users[0][name]', 'Peter');
formData.append('users[0][surname]', 'Griffin');
formData.append('users[1][name]', 'Thomas');
formData.append('users[1][surname]', 'Anderson');
formData.append('obj2{}', '[{"x":1}]');
```

axios 支持以下快捷方法：`postForm`、`putForm`、`patchForm`，它们分别对应相应的 HTTP 方法，并预设 `Content-Type` 请求头为 `multipart/form-data`。
