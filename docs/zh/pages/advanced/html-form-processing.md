# HTML 表单提交（浏览器） <Badge type="tip" text="新特性" />

你也可以直接从 HTML 表单元素提交数据，无需任何额外的 JavaScript 代码即可提交页面中的表单。

```js
await axios.postForm('https://httpbin.org/post', document.querySelector('#htmlForm'));
```

`FormData` 和 `HTMLForm` 对象也可以通过显式将 `Content-Type` 请求头设置为 `application/json` 来以 `JSON` 格式发送：

```js
await axios.post('https://httpbin.org/post', document.querySelector('#htmlForm'), {
  headers: {
    'Content-Type': 'application/json',
  },
});
```

以下是一个有效的、可被上述代码提交的表单示例：

```html
<form id="htmlForm">
  <input type="text" name="foo" value="1" />
  <input type="text" name="deep.prop" value="2" />
  <input type="text" name="deep prop spaced" value="3" />
  <input type="text" name="baz" value="4" />
  <input type="text" name="baz" value="5" />

  <select name="user.age">
    <option value="value1">Value 1</option>
    <option value="value2" selected>Value 2</option>
    <option value="value3">Value 3</option>
  </select>

  <input type="submit" value="Save" />
</form>
```

上述表单将以如下格式提交：

```json
{
  "foo": "1",
  "deep": {
    "prop": {
      "spaced": "3"
    }
  },
  "baz": ["4", "5"],
  "user": {
    "age": "value2"
  }
}
```

::: tip 路径冲突会覆盖先前的值
字段名会按 `.`、方括号或空白拆分为属性路径。两个路径重叠的输入会发生冲突：在上面的示例中，`deep.prop` 解析为 `["deep", "prop"]`，而 `deep prop spaced` 解析为 `["deep", "prop", "spaced"]`，因此更深的赋值会将 `deep.prop = "2"` 替换为嵌套对象 `{ spaced: "3" }`。如果你需要同时保留两个值，请使用互不重叠的字段名。
:::

::: warning
目前不支持将 Blob/File 以 JSON（base64）格式发送。
:::
