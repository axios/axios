# 请求配置

请求配置用于配置 HTTP 请求的各项参数。虽然有大量可用选项，但唯一必填的选项是 `url`。如果配置对象中没有 `method` 字段，默认使用 `GET` 方法。

::: warning 安全提示：解压炸弹防护是可选的
默认情况下 `maxContentLength` 为 `-1`（不限制）。恶意或被攻陷的服务器可能返回一个很小的 gzip/deflate/brotli 响应，解压后可达数 GB，从而耗尽 Node.js 进程的内存。

如果你向不完全可信的服务器发起请求，**请设置上限**：

```js
axios.defaults.maxContentLength = 10 * 1024 * 1024; // 10 MB
axios.defaults.maxBodyLength = 10 * 1024 * 1024;
```

详见[安全指南](/pages/misc/security)。
:::

### `url`

`url` 是请求的目标 URL，可以是字符串或 `URL` 实例。

### `method`

`method` 是请求使用的 HTTP 方法，默认为 `GET`。

### `baseURL`

`baseURL` 是拼接在 `url` 前面的基础 URL，除非 `url` 是绝对 URL。这对于向同一域名发起请求非常实用，无需在每次请求时重复写域名和 API 版本前缀。

### `allowAbsoluteUrls`

`allowAbsoluteUrls` 决定绝对 URL 是否可以覆盖已配置的 `baseUrl`。设置为 `true`（默认值）时，绝对 `url` 会覆盖 `baseUrl`；设置为 `false` 时，绝对 `url` 始终会拼接在 `baseUrl` 之后。

### `transformRequest`

`transformRequest` 函数允许你在数据发送到服务器之前对其进行修改，仅适用于 `PUT`、`POST`、`PATCH` 和 `DELETE` 请求方法。数组中的最后一个函数必须返回字符串、Buffer、ArrayBuffer、FormData 或 Stream 实例。

### `transformResponse`

`transformResponse` 函数允许你在数据传递给 `then` 或 `catch` 函数之前对响应数据进行修改，函数以响应数据为唯一参数。

### `parseReviver`

`parseReviver` 函数允许你向默认 `transformResponse` 所使用的原生 `JSON.parse()` 调用直接提供一个自定义的 "reviver" 函数。

这对于执行高性能的类型水合（例如将 ISO 字符串转换为 `Temporal` 或 `Date` 对象）或防止解析过程中的精度丢失尤为有用。

在支持 `JSON.parse` reviver `context` 参数的环境中，reviver 函数会接收第三个 `context` 参数，用于访问原始 JSON `source`，从而能够精确转换那些以标准 JavaScript 数字解析时会丢失精度的大整数（BigInt）。

> 注意：`Temporal` 尚未在所有环境中可用，必要时请考虑使用 polyfill。

```js
const client = axios.create({
  parseReviver: (key, value, context) => {
    // 示例：精度安全的 BigInt 解析
    if (typeof value === 'number' && context?.source) {
      const isInteger = Number.isInteger(value);
      const isUnsafe = !Number.isSafeInteger(value);
      const isValidIntegerString = /^-?\d+$/.test(context.source);

      if (isInteger && isUnsafe && isValidIntegerString) {
        try {
          return BigInt(context.source);
        } catch {
          // 兜底：如果解析失败则返回原始值
        }
      }
    }

    // 示例：将日期水合为 Temporal 对象
    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      typeof Temporal !== 'undefined' &&
      Temporal?.PlainDate
    ) {
      return Temporal.PlainDate.from(value);
    }

    return value;
  },
});
```

### `headers`

`headers` 是随请求发送的 HTTP 请求头，默认将 `Content-Type` 设置为 `application/json`。

### `params`

`params` 是随请求发送的 URL 查询参数，必须是普通对象或 URLSearchParams 对象。如果 `url` 中已包含查询参数，它们将与 `params` 对象合并。

### `paramsSerializer`

`paramsSerializer` 函数允许你在参数发送到服务器之前自定义 `params` 对象的序列化方式，有多个可用选项，详见本页末尾的完整请求配置示例。

#### 严格的 RFC 3986 百分号编码

axios 默认会将 `%3A`、`%24`、`%2C` 和 `%20` 解码回 `:`、`$`、`,` 和 `+`，以提升可读性（其中 `+` 遵循查询字符串中表示空格的 `application/x-www-form-urlencoded` 约定）。这些字符在 [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986#section-3.4) 中对查询组件而言都是合法的，因此默认输出是正确的。但部分后端要求严格的百分号编码，会拒绝这种可读形式。

可通过 `encode` 选项覆盖默认编码器：

```js
// 单次请求：对查询值使用严格的 RFC 3986 百分号编码
axios.get('/foo', {
  params: { filter: JSON.stringify({ startedAt: '2026-01-23' }) },
  paramsSerializer: { encode: encodeURIComponent }
});

// 也可在实例默认值中设置
const client = axios.create({
  paramsSerializer: { encode: encodeURIComponent }
});
```

### `data`

`data` 是作为请求体发送的数据，可以是字符串、普通对象、Buffer、ArrayBuffer、FormData、Stream 或 URLSearchParams，仅适用于 `PUT`、`POST`、`DELETE` 和 `PATCH` 请求方法。在未设置 `transformRequest` 的情况下，必须是以下类型之一：

- string、普通对象、ArrayBuffer、ArrayBufferView、URLSearchParams
- 仅浏览器：FormData、File、Blob
- 仅 Node.js：Stream、Buffer、FormData（form-data 包）

对于提供了 `getHeaders()` 方法的 Node.js `FormData` 对象，axios 默认会复制其返回的所有请求头，以保持 v1 兼容性。如果 `FormData` 对象是自定义的或不完全可信，可设置 `formDataHeaderPolicy: 'content-only'`，仅复制 `Content-Type` 和 `Content-Length`，其他请求头则通过请求 `headers` 配置显式设置。

### `formDataHeaderPolicy` <Badge type="warning" text="仅 Node.js" />

控制 axios 如何复制 Node.js `FormData#getHeaders()` 返回的请求头。默认值为 `'legacy'`，即复制所有返回的请求头以保留现有的 v1 行为。设置为 `'content-only'` 时，仅从 `getHeaders()` 复制 `Content-Type` 和 `Content-Length`。

### `timeout`

`timeout` 是请求超时前等待的毫秒数。如果请求耗时超过 `timeout`，请求将被中止。

### `withCredentials`

`withCredentials` 属性指示跨域 Access-Control 请求是否应携带 cookie、授权请求头或 TLS 客户端证书等凭据。该设置对同源请求无效。

### `adapter`

`adapter` 允许自定义请求处理方式，便于测试。返回一个 Promise 并提供有效的响应，详见[适配器](/pages/advanced/adapters)文档。我们还提供了多个内置适配器，Node.js 默认使用 `http`，浏览器默认使用 `xhr`。内置适配器列表如下：

- fetch
- http
- xhr

你也可以传入一个适配器数组，axios 将使用当前环境支持的第一个适配器。

### `auth`

`auth` 表示使用 HTTP Basic 认证，并提供凭据。这将设置 `Authorization` 请求头，覆盖任何通过 `headers` 自定义的 `Authorization` 请求头。请注意，仅 HTTP Basic 认证可通过此参数配置，Bearer 令牌等请改用自定义 `Authorization` 请求头。

### `responseType`

`responseType` 指示服务器响应的数据类型，可以是以下之一：

- arraybuffer
- document
- json
- text
- stream
- blob（仅浏览器）
- formdata（仅 fetch 适配器）

### `responseEncoding` <Badge type="warning" text="仅 Node.js" />

`responseEncoding` 指示解码响应时使用的编码，支持以下选项：

- ascii
- ASCII
- ansi
- ANSI
- binary
- BINARY
- base64
- BASE64
- base64url
- BASE64URL
- hex
- HEX
- latin1
- LATIN1
- ucs-2
- UCS-2
- ucs2
- UCS2
- utf-8
- UTF-8
- utf8
- UTF8
- utf16le
- UTF16LE

::: tip
注意：当 `responseType` 为 `stream` 或客户端请求时，此选项将被忽略
:::

### `xsrfCookieName`

`xsrfCookieName` 是用作 `XSRF` 令牌值的 cookie 名称。

### `xsrfHeaderName`

`xsrfHeaderName` 是用作 `XSRF` 令牌值的请求头名称。

### `withXSRFToken`

`withXSRFToken` 控制 axios 在浏览器请求中是否读取 XSRF cookie 并设置 XSRF 请求头。可选值如下：

- `undefined` _（默认）_ — 仅在同源请求时设置 XSRF 请求头。
- `true` — 始终设置 XSRF 请求头，包括跨域请求。
- `false` — 永不设置 XSRF 请求头。
- `(config: InternalAxiosRequestConfig) => boolean | undefined` — 回调函数，按请求决定是否设置，会接收内部 config 对象。

```ts
withXSRFToken: boolean | undefined | ((config: InternalAxiosRequestConfig) => boolean | undefined);
```

::: warning 跨域 XSRF 与 `withCredentials`
`withCredentials` 控制跨站请求是否携带凭据（cookie、HTTP 认证）。在较旧版本的 axios 中，设置 `withCredentials: true` 会隐式地让 axios 在跨域请求中设置 XSRF 请求头。新版本 axios 将这两个关注点分开：要在跨域请求中发送 XSRF 请求头，必须**同时**设置 `withCredentials: true` 和 `withXSRFToken: true`。

```js
axios.get('/user', { withCredentials: true, withXSRFToken: true });
```
:::

### `onUploadProgress`

`onUploadProgress` 函数允许你监听上传进度。

### `onDownloadProgress`

`onDownloadProgress` 函数允许你监听下载进度。

### `maxContentLength` <Badge type="warning" text="仅 Node.js" />

`maxContentLength` 属性定义服务器在响应中允许接收的最大字节数。

> ⚠️ **安全提示：** 默认值为 `-1`（不限制）。响应不加限制再加上 gzip/deflate/brotli 解压，会带来解压炸弹导致的拒绝服务风险。
> 在访问不完全可信的服务器时，请显式设置该限制。

### `maxBodyLength` <Badge type="warning" text="仅 Node.js" />

`maxBodyLength` 属性定义服务器在请求中允许接收的最大字节数。

### `redact`

`redact` 属性是一个可选的配置键名数组，用于在 `AxiosError` 通过 `toJSON()` 序列化时对匹配的键进行脱敏。匹配不区分大小写，并会在序列化后的请求配置中递归进行，命中的值会被替换为 `[REDACTED ****]`。

`redact` 仅影响错误序列化，不会修改请求数据、请求头或原始配置对象。

```js
axios.get('/user/12345', {
  headers: { Authorization: 'Bearer token' },
  auth: { username: 'me', password: 'secret' },
  redact: ['authorization', 'password']
}).catch((error) => {
  console.log(error.toJSON().config);
});
```

### `validateStatus`

`validateStatus` 函数允许你覆盖默认的状态码验证逻辑。默认情况下，axios 会在状态码不在 200-299 范围内时拒绝 Promise。你可以提供自定义的 `validateStatus` 函数来覆盖此行为，该函数应在状态码在你希望接受的范围内时返回 `true`。

### `maxRedirects` <Badge type="warning" text="仅 Node.js" />

`maxRedirects` 属性定义最大重定向次数，设置为 0 时不跟随任何重定向。

### `beforeRedirect`

`beforeRedirect` 函数允许你在请求重定向前对其进行修改，可用于调整重定向时的请求选项、检查最新的响应头或通过抛出错误来取消请求。当 `maxRedirects` 设置为 0 时，不会使用 `beforeRedirect`。

```js
beforeRedirect: (options, { headers }) => {
  if (
    options.hostname === "example.com" &&
    options.protocol === "https:"
  ) {
    options.auth = "user:password";
  }
}
```

::: warning 安全提示：在重定向时重新注入凭据
`beforeRedirect` 钩子在重定向过程中**敏感请求头被剥离之后**运行。出于安全考虑，`follow-redirects` 库会在协议降级（HTTPS → HTTP）时移除凭据。由于 `beforeRedirect` 在此之后运行，如果不检查目标协议就重新注入凭据，可能会泄露敏感数据。仅对可信的 HTTPS 目标重新添加凭据，避免在被降级的重定向上重新添加凭据。
:::

### `socketPath` <Badge type="warning" text="仅 Node.js" />

`socketPath` 属性定义用于替代 TCP 连接的 UNIX 套接字路径，例如 `/var/run/docker.sock`，用于向 Docker 守护进程发送请求。`socketPath` 和 `proxy` 只能指定其中一个，如果两者都指定，则使用 `socketPath`。

:::warning 安全提示
设置 `socketPath` 后，请求 URL 中的主机名和端口将被忽略，axios 会直接与指定的 Unix 域套接字通信。如果请求配置中有任何部分来自用户输入（例如在转发或合并请求选项的代理/Webhook 处理程序中），攻击者可以注入 `socketPath` 将流量重定向到特权本地套接字，如 `/var/run/docker.sock`、`/run/containerd/containerd.sock` 或 `/run/systemd/private`，从而完全绕过基于主机名的 SSRF 防护（CWE-918）。应对来自不可信输入的配置进行过滤或仅允许特定键，并/或使用 `allowedSocketPaths`（见下文）限制接受的套接字路径。
:::

### `allowedSocketPaths` <Badge type="warning" text="仅 Node.js" />

限制可通过 `socketPath` 使用的套接字路径。接受一个字符串或字符串数组。设置后，axios 会解析 `socketPath` 并与每个条目（同样解析后）比较；若无匹配，请求将以 `ERR_BAD_OPTION_VALUE` 错误码的 `AxiosError` 被拒绝。未设置（默认）时，`socketPath` 行为与以往一致。

```js
const client = axios.create({
  allowedSocketPaths: ['/var/run/docker.sock']
});

// 允许
await client.get('http://localhost/v1.45/info', { socketPath: '/var/run/docker.sock' });

// 拒绝 — 不在白名单中
await client.get('http://localhost/pods', { socketPath: '/var/run/kubelet.sock' });
```

空数组 (`allowedSocketPaths: []`) 会阻止所有套接字路径。

### `transport`

`transport` 属性定义请求使用的传输方式，适用于通过不同协议（如 `http2`）发起请求的场景。

### `httpAgent` 和 `httpsAgent`

`httpAgent` 和 `httpsAgent` 分别定义在 Node.js 中执行 HTTP 和 HTTPS 请求时使用的自定义代理，可用于添加 `keepAlive` 等默认未启用的选项。

### `proxy`

`proxy` 定义代理服务器的主机名、端口和协议，也可以通过常规的 `http_proxy` 和 `https_proxy` 环境变量来定义代理。

如果你使用环境变量配置代理，还可以定义 `no_proxy` 环境变量，以逗号分隔的方式列出不需要代理的域名。

设置为 `false` 可禁用代理，忽略环境变量。`auth` 表示使用 HTTP Basic 认证连接代理并提供凭据，这将设置 `Proxy-Authorization` 请求头，覆盖任何通过 `headers` 自定义的 `Proxy-Authorization` 请求头。如果代理服务器使用 HTTPS，则必须将协议设置为 `https`。

通过代理转发时，如果用户在 `headers` 中提供了 `Host` 请求头，axios 会保留它（不区分大小写匹配 `host` / `Host` / `HOST`）。这样你就可以指向一个与请求 URL 不同的虚拟主机——例如，访问 `127.0.0.1:4000`，但让代理将请求当作 `example.com` 处理。如果未提供 `Host` 请求头，axios 仍会像以前一样将其默认设为请求 URL 的 `hostname:port`。

```js
proxy: {
  protocol: "https",
  host: "127.0.0.1",
  hostname: "localhost", // 如果同时定义了 "host" 和 "hostname"，则优先使用 "hostname"
  port: 9000,
  auth: {
    username: "mikeymike",
    password: "rapunz3l"
  }
},
```

### `cancelToken`

`cancelToken` 属性允许你创建一个取消令牌，用于取消请求。详见[取消请求](/pages/advanced/cancellation)文档。

### `signal`

`signal` 属性允许你向请求传入一个 `AbortSignal` 实例，从而通过 `AbortController` API 取消请求。

### `decompress` <Badge type="warning" text="仅 Node.js" />

`decompress` 属性指示是否自动解压响应数据，默认值为 `true`。

### `insecureHTTPParser`

指示是否使用接受无效 HTTP 请求头的不安全 HTTP 解析器，可用于与不符合规范的 HTTP 实现互通。不建议使用不安全解析器。

请注意，`insecureHTTPParser` 选项仅在 Node.js 12.10.0 及更高版本中可用。请阅读 [Node.js 文档](https://nodejs.org/en/blog/vulnerability/february-2020-security-releases/#strict-http-header-parsing-none)以获取更多信息。完整选项列表见[此处](https://nodejs.org/dist/latest-v12.x/docs/api/http.html#http_http_request_url_options_callback)。

### `transitional`

`transitional` 属性允许你启用或禁用某些过渡性功能，可用选项如下：

- `silentJSONParsing`：若设置为 `true` _（默认）_，axios 会在 JSON 解析失败时静默忽略错误，并保留原始响应字符串。设置为 `false` 则会抛出 `SyntaxError`。

  ::: tip 重要说明
  此选项仅在 `responseType` **显式**设置为 `'json'` 时生效。当未指定 `responseType` 时，axios 会通过 `forcedJSONParsing` 尝试解析为 JSON，若失败则不论此设置如何，都会静默返回原始字符串。如果希望无效 JSON 抛出错误，请同时设置：

  ```js
  { responseType: 'json', transitional: { silentJSONParsing: false } }
  ```
  :::

- `forcedJSONParsing`：强制 axios 将响应解析为 JSON，即使响应不是有效的 JSON。适用于返回无效 JSON 的 API。
- `clarifyTimeoutError`：在请求超时时提供更清晰的错误信息，适用于调试超时问题。
- `legacyInterceptorReqResOrdering`：设置为 true 时使用旧版拦截器请求/响应排序。

### `env`

`env` 属性允许你设置一些配置选项，例如用于自动将数据序列化为 FormData 对象的 FormData 类。

- FormData: window?.FormData || global?.FormData

### `formSerializer`

`formSerializer` 选项允许你配置普通对象作为请求 `data` 时如何序列化为 `multipart/form-data`。可用选项：

- `visitor` — 对每个值递归调用的自定义访问者函数
- `dots` — 使用点号表示法代替方括号表示法
- `metaTokens` — 保留特殊的键后缀（如 `{}`）
- `indexes` — 控制数组键的方括号格式（`null` / `false` / `true`）
- `maxDepth` _（默认：`100`）_ — 抛出 `AxiosError`（错误码 `ERR_FORM_DATA_DEPTH_EXCEEDED`）前的最大嵌套深度。设置为 `Infinity` 可禁用。

详见 [multipart/form-data](/pages/advanced/multipart-form-data-format) 页面以及本页末尾的完整请求配置示例。

### `maxRate` <Badge type="warning" text="仅 Node.js" />

`maxRate` 属性定义上传和/或下载的最大**带宽**（字节/秒）。接受单个数字（同时适用于两个方向）或两元素数组 `[uploadRate, downloadRate]`，每个元素为字节/秒限制。例如，`100 * 1024` 表示 100 KB/s。详见[速率限制](/pages/advanced/rate-limiting)中的示例。

## 完整请求配置示例

```js
{
  url: "/posts",
  method: "get",
  baseURL: "https://jsonplaceholder.typicode.com",
  allowAbsoluteUrls: true,
  transformRequest: [function (data, headers) {
    return data;
  }],
  transformResponse: [function (data) {
    return data;
  }],
  headers: {"X-Requested-With": "XMLHttpRequest"},
  params: {
    postId: 5
  },
  paramsSerializer: {
    // 自定义编码函数，以迭代方式逐个序列化键值对。
    encode?: (param: string): string => { /* 在此执行自定义操作并返回转换后的字符串 */ },

    // 对整个参数进行自定义序列化的函数，允许用户模拟 1.x 之前的行为。
    serialize?: (params: Record<string, any>, options?: ParamsSerializerOptions ),

    // 配置数组索引在参数中的格式。
    // 三种可用选项：
      // (1) indexes: null（不添加方括号）
      // (2)（默认）indexes: false（添加空方括号）
      // (3) indexes: true（添加带索引的方括号）
    indexes: false,

    // 序列化参数时的最大对象嵌套深度。超过时抛出 AxiosError
    // (ERR_FORM_DATA_DEPTH_EXCEEDED)。默认：100。设置为 Infinity 可禁用。
    maxDepth: 100

  },
  data: {
    firstName: "Fred"
  },
  formDataHeaderPolicy: "legacy",
  // 另一种将数据发送到请求体的语法，仅适用于 POST 方法，只发送值，不发送键
  data: "Country=Brasil&City=Belo Horizonte",
  timeout: 1000,
  withCredentials: false,
  adapter: function (config) {
    // 在此执行自定义逻辑
  },
  adapter: "xhr",
  auth: {
    username: "janedoe",
    password: "s00pers3cret"
  },
  responseType: "json",
  responseEncoding: "utf8",
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  withXSRFToken: boolean | undefined | ((config: InternalAxiosRequestConfig) => boolean | undefined),
  onUploadProgress: function ({loaded, total, progress, bytes, estimated, rate, upload = true}) {
    // 在此处理 axios 进度事件
  },
  onDownloadProgress: function ({loaded, total, progress, bytes, estimated, rate, download = true}) {
    // 在此处理 axios 进度事件
  },
  maxContentLength: 2000,
  maxBodyLength: 2000,
  redact: ['authorization', 'password'],
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  },
  maxRedirects: 21,
  beforeRedirect: (options, { headers }) => {
    if (options.hostname === "typicode.com") {
      options.auth = "user:password";
    }
  },
  socketPath: null,
  allowedSocketPaths: null,
  transport: undefined,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  proxy: {
    protocol: "https",
    host: "127.0.0.1",
    // hostname: "127.0.0.1" // 如果同时定义了 "host" 和 "hostname"，则优先使用 "hostname"
    port: 9000,
    auth: {
      username: "mikeymike",
      password: "rapunz3l"
    }
  },
  cancelToken: new CancelToken(function (cancel) {
    cancel("Operation has been canceled.");
  }),
  signal: new AbortController().signal,
  decompress: true,
  insecureHTTPParser: undefined,
  transitional: {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false,
    legacyInterceptorReqResOrdering: true,
  },
  env: {
    FormData: window?.FormData || global?.FormData
  },
  formSerializer: {
      // 自定义访问者函数，用于序列化表单值
      visitor: (value, key, path, helpers) => {};

      // 使用点号表示法代替方括号格式
      dots: boolean;

      // 在参数键中保留特殊结尾（如 {}）
      metaTokens: boolean;

      // 使用数组索引格式：
        // null - 不添加方括号
        // false - 添加空方括号
        // true - 添加带索引的方括号
      indexes: boolean;

      // 最大对象嵌套深度。超过时抛出 AxiosError (ERR_FORM_DATA_DEPTH_EXCEEDED)。
      // 默认：100。设置为 Infinity 可禁用。
      maxDepth: 100;
  },
  maxRate: [
    100 * 1024, // 上传限制 100KB/s
    100 * 1024  // 下载限制 100KB/s
  ]
}
```
