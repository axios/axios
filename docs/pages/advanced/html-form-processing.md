# HTML form posting (browser) <Badge type="tip" text="New" />

You can also post a form directly from a HTML form element. This is useful when you have a form in your page and you want to submit it without any JavaScript code.

```js
await axios.postForm(
  "https://httpbin.org/post",
  document.querySelector("#htmlForm")
);
```

`FormData` and `HTMLForm` objects can also be posted as `JSON` by explicitly setting the `Content-Type` header to `application/json`:

```js
await axios.post(
  "https://httpbin.org/post",
  document.querySelector("#htmlForm"),
  {
    headers: {
      "Content-Type": "application/json",
    },
  }
);
```

An example of a form that is valid and can be submitted by the above code is:

```html
<form id="form">
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

The above form will be submitted as:

```json
{
  "foo": "1",
  "deep": {
    "prop": "2",
    "prop spaced": "3"
  },
  "baz": ["4", "5"],
  "user": {
    "age": "value2"
  }
}
```

::: warning
Sending Blobs/Files as JSON (base64) is not currently supported.
:::
