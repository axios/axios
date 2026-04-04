# File posting

Axios allows very simple file posting. You can easily submit a single file as below:

```js
await axios.postForm("https://httpbin.org/post", {
  myVar: "foo",
  file: document.querySelector("#fileInput").files[0],
});
```

You can also submit multiple files:

```js
await axios.postForm(
  "https://httpbin.org/post",
  document.querySelector("#fileInput").files
);
```

All files are sent as `multipart/form-data` and you can access them in the server side as you would with any other file upload. All files are sent with the same field name `files[]`.
