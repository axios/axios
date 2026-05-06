# HTTP2 <Badge type="warning" text="实验性" /> <Badge type="tip" text="v1.13.0+" />

在 `1.13.0` 版本中，`http` 适配器新增了实验性的 HTTP/2 支持，仅在 Node.js 环境中可用。

## 基本用法

使用 `httpVersion` 选项来选择请求使用的协议版本，将其设置为 `2` 可启用 HTTP/2。

```js
const { data, headers, status } = await axios.post(
  "https://httpbin.org/post",
  form,
  {
    httpVersion: 2,
  },
);
```

## `http2Options`

可以通过 `http2Options` 配置对象传入内部 `session.request()` 调用的原生额外选项，其中还包括自定义的 `sessionTimeout` 参数，用于控制空闲 HTTP/2 会话在关闭前保持存活的时间（毫秒），默认值为 `1000ms`。

```js
{
  httpVersion: 2,
  http2Options: {
    rejectUnauthorized: false, // 接受自签名证书（仅用于开发环境）
    sessionTimeout: 5000,      // 空闲会话保持 5 秒
  },
}
```

::: warning
HTTP/2 支持目前仍为实验性功能，API 可能在未来的次要版本或补丁版本中发生变化。
:::

::: warning HTTP/2 不支持重定向
HTTP/2 适配器目前不会自动跟随重定向。如果使用 `httpVersion: 2` 发起的请求收到 `3xx` 响应，重定向不会被自动跟随。请手动处理这类响应，或对依赖重定向的端点继续使用 HTTP/1.x。
:::

## 完整示例

以下示例通过 HTTP/2 发送 `multipart/form-data` POST 请求，并同时跟踪上传和下载进度。

```js
const form = new FormData();
form.append("foo", "123");

const { data, headers, status } = await axios.post(
  "https://httpbin.org/post",
  form,
  {
    httpVersion: 2,
    http2Options: {
      // rejectUnauthorized: false,
      // sessionTimeout: 1000
    },
    onUploadProgress(e) {
      console.log("upload progress", e);
    },
    onDownloadProgress(e) {
      console.log("download progress", e);
    },
    responseType: "arraybuffer",
  },
);
```

## 配置参考

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `httpVersion` | `number` | `1` | 使用的 HTTP 协议版本，设置为 `2` 可启用 HTTP/2。 |
| `http2Options.sessionTimeout` | `number` | `1000` | 空闲 HTTP/2 会话关闭前等待的时间（毫秒）。 |

Node.js 内置 `http2` 模块支持的其他原生 `session.request()` 选项也可以通过 `http2Options` 传入。
