# 速率限制 <Badge type="tip" text="新特性" />

axios 通过 HTTP 适配器在 Node.js 环境中支持带宽限制。你可以限制数据的上传或下载速度，适用于批量操作、后台任务或不希望占满带宽的礼貌抓取等场景。

## `maxRate`

`maxRate` 选项接受一个数字（字节/秒）或一个数组，数组第一个值为上传限制，第二个值为下载限制。使用 `[uploadRate]` 仅限制上传，使用 `[uploadRate, downloadRate]` 同时限制两个方向。传入单个数字时，该限制同时应用于上传和下载。

```js
// 将上传和下载速度均限制为 100 KB/s
await axios.get(URL, { maxRate: 100 * 1024 });

// 上传限制 100 KB/s，下载限制 500 KB/s
await axios.get(URL, { maxRate: [100 * 1024, 500 * 1024] });
```

::: warning
`maxRate` 仅支持 Node.js HTTP 适配器，在浏览器环境中无效。
:::

## 上传速率限制

限制上传速度的同时记录进度：

```js
const { data } = await axios.post(SERVER_URL, myBuffer, {
  onUploadProgress: ({ progress, rate }) => {
    const percent = (progress * 100).toFixed(1);
    const kbps = (rate / 1024).toFixed(1);
    console.log(`Upload [${percent}%] at ${kbps} KB/s`);
  },

  maxRate: [100 * 1024], // 上传限制 100 KB/s
});
```

## 下载速率限制

限制大响应体的下载速度：

```js
const { data } = await axios.get(FILE_URL, {
  onDownloadProgress: ({ progress, rate }) => {
    const percent = (progress * 100).toFixed(1);
    const kbps = (rate / 1024).toFixed(1);
    console.log(`Download [${percent}%] at ${kbps} KB/s`);
  },

  maxRate: [Infinity, 200 * 1024], // 不限制上传，下载限制 200 KB/s
  responseType: "arraybuffer",
});
```

## 同时限制上传和下载

将两个限制作为数组传入，可同时控制两个方向：

```js
await axios.post(SERVER_URL, largeBuffer, {
  maxRate: [50 * 1024, 500 * 1024], // 上传 50 KB/s，下载 500 KB/s
});
```
