# File posting

axios makes file uploads straightforward. Use `postForm` or `FormData` when you need `multipart/form-data` uploads.

## Single file (browser)

Pass a `File` object directly as a field value — axios will detect it and use the correct content type automatically:

```js
await axios.postForm("https://httpbin.org/post", {
  description: "My profile photo",
  file: document.querySelector("#fileInput").files[0],
});
```

## Multiple files (browser)

Pass a `FileList` to upload all selected files at once. They will all be sent under the same field name (`files[]`):

```js
await axios.postForm(
  "https://httpbin.org/post",
  document.querySelector("#fileInput").files
);
```

To use distinct field names for each file, build a `FormData` object manually:

```js
const formData = new FormData();
formData.append("avatar", avatarFile);
formData.append("cover", coverFile);

await axios.post("https://httpbin.org/post", formData);
```

## Tracking upload progress (browser)

Use the `onUploadProgress` callback to show a progress bar or percentage to your users:

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

See [Progress capturing](/pages/advanced/progress-capturing) for the full list of fields available on the progress event.

## Files in Node.js

In Node.js, use `fs.createReadStream` to upload a file from the filesystem without loading it entirely into memory:

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
The `form-data` npm package is required in Node.js environments to create `FormData` objects. In modern Node.js (v18+), the global `FormData` is available natively.
:::

## Uploading a Buffer (Node.js)

You can also upload an in-memory `Buffer` directly:

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
Capturing `FormData` upload progress is not currently supported in Node.js environments.
:::

::: danger
When uploading a readable stream in Node.js, set `maxRedirects: 0` to prevent the `follow-redirects` package from buffering the entire stream in RAM.
:::
