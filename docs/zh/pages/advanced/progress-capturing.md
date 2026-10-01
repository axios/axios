# 进度捕获 <Badge type="tip" text="新特性" />

axios 同时支持在浏览器和 Node.js 环境中捕获请求的上传/下载进度。进度事件的触发频率被限制为每秒最多 3 次，以避免浏览器被过多的进度事件压垮。以下是捕获进度事件的示例：

```js
await axios.post(url, data, {
  onUploadProgress: function (axiosProgressEvent) {
    /*{
      loaded: number;
      total?: number;
      progress?: number; // 范围 [0..1]
      bytes: number; // 自上次触发以来传输的字节数（增量）
      estimated?: number; // 预计剩余时间（秒）
      rate?: number; // 上传速度（字节/秒）
      upload: true; // 上传标识
    }*/
  },

  onDownloadProgress: function (axiosProgressEvent) {
    /*{
      loaded: number;
      total?: number;
      progress?: number;
      bytes: number; 
      estimated?: number;
      rate?: number; // 下载速度（字节/秒）
      download: true; // 下载标识
    }*/
  },
});
```

你也可以在 Node.js 中将上传和下载进度事件流式传输到可读流，以便以自定义方式显示进度。以下是流式传输进度事件的示例：

```js
const { data } = await axios.post(SERVER_URL, readableStream, {
  onUploadProgress: ({ progress }) => {
    console.log((progress * 100).toFixed(2));
  },

  headers: {
    "Content-Length": contentLength,
  },

  maxRedirects: 0, // 避免缓冲整个流
});
```

::: warning
Node.js 环境目前不支持捕获 FormData 上传进度
:::

::: danger
建议通过设置 `maxRedirects: 0` 来禁用重定向，以便在 Node.js 环境中上传流，因为 `follow-redirects` 包会不遵循"背压"算法而将整个流缓冲到内存中
:::
