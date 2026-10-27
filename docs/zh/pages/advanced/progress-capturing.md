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

## 增量读取响应数据

在浏览器中，XHR 适配器（默认适配器）会将原生进度事件作为 `axiosProgressEvent.event` 传入。你可以使用它的 `target`（即底层的 `XMLHttpRequest`）读取目前已收到的响应文本：

```js
let received = 0;

await axios.get('/api/stream', {
  responseType: 'text',
  onDownloadProgress: ({ event }) => {
    const xhr = event.target;
    const chunk = xhr.responseText.slice(received);
    received = xhr.responseText.length;

    if (chunk) {
      console.log('new data:', chunk);
    }
  },
});
```

由于进度回调经过节流，一次回调可能会在浏览器完成原始事件的分发之后才运行。在这种情况下，`event.currentTarget` 为 `null`（标准 DOM 行为），但 `event.target` 仍然引用该请求，因此请按上例使用 `target`。

当 XHR 下载成功完成时，axios 会在 `loadend` 处理器中发送一个包含完整传输状态的最终下载进度事件，因此最后一个数据块不会因节流而丢失。上传进度、失败的 XHR 下载以及被中止或出错的传输保持原有行为：只会发送已处于待发送状态的进度事件。
