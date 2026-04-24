# 文件上传

axios 让文件上传变得简单。需要 `multipart/form-data` 上传时，使用 `postForm` 或 `FormData` 即可。

## 单文件上传（浏览器）

直接将 `File` 对象作为字段值传入——axios 会自动检测并使用正确的内容类型：

```js
await axios.postForm("https://httpbin.org/post", {
  description: "My profile photo",
  file: document.querySelector("#fileInput").files[0],
});
```

## 多文件上传（浏览器）

传入 `FileList` 可一次性上传所有选中的文件，所有文件将使用相同的字段名（`files[]`）发送：

```js
await axios.postForm(
  "https://httpbin.org/post",
  document.querySelector("#fileInput").files
);
```

如需为每个文件使用不同的字段名，请手动构建 `FormData` 对象：

```js
const formData = new FormData();
formData.append("avatar", avatarFile);
formData.append("cover", coverFile);

await axios.post("https://httpbin.org/post", formData);
```

## 跟踪上传进度（浏览器）

使用 `onUploadProgress` 回调向用户显示进度条或百分比：

```js
await axios.postForm("https://httpbin.org/post", {
  file: document.querySelector("#fileInput").files[0],
}, {
  onUploadProgress: (progressEvent) => {
    const percent = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    console.log(`Upload progress: ${percent}%`);
  },
});
```

进度事件对象上可用的完整字段列表，请参阅[进度捕获](/pages/advanced/progress-capturing)。

## Node.js 中的文件上传

在 Node.js 中，使用 `fs.createReadStream` 上传文件系统中的文件，无需将整个文件加载到内存：

```js
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

const form = new FormData();
form.append("file", fs.createReadStream("/path/to/file.jpg"));
form.append("description", "My uploaded file");

await axios.post("https://httpbin.org/post", form);
```

::: tip
在 Node.js 环境中创建 `FormData` 对象需要 `form-data` npm 包。在现代 Node.js（v18+）中，全局 `FormData` 已原生可用。
:::

## 上传 Buffer（Node.js）

也可以直接上传内存中的 `Buffer`：

```js
const buffer = Buffer.from("Hello, world!");

const form = new FormData();
form.append("file", buffer, {
  filename: "hello.txt",
  contentType: "text/plain",
  knownLength: buffer.length,
});

await axios.post("https://httpbin.org/post", form);
```

::: warning
Node.js 环境目前不支持捕获 `FormData` 上传进度。
:::

::: danger
在 Node.js 中上传可读流时，请设置 `maxRedirects: 0`，以防止 `follow-redirects` 包将整个流缓冲到内存中。
:::
