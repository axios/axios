# Rate limiting <Badge type="tip" text="New" />

axios supports bandwidth limiting in the Node.js environment via the HTTP adapter. This lets you cap how fast data is uploaded or downloaded, which is useful for bulk operations, background jobs, or polite scraping that shouldn't saturate a connection.

## `maxRate`

The `maxRate` option accepts either a number (bytes per second) or an array where the first value is the upload limit and the second value is the download limit. Use `[uploadRate]` to limit upload only, or `[uploadRate, downloadRate]` to limit both directions. When a single number is passed, the same limit applies to both upload and download.

```js
// Limit both upload and download to 100 KB/s
await axios.get(URL, { maxRate: 100 * 1024 });

// Limit upload to 100 KB/s, download to 500 KB/s
await axios.get(URL, { maxRate: [100 * 1024, 500 * 1024] });
```

::: warning
`maxRate` is only supported by the Node.js HTTP adapter. It has no effect in browser environments.
:::

## Upload rate limiting

Cap the upload speed and log progress at the same time:

```js
const { data } = await axios.post(SERVER_URL, myBuffer, {
  onUploadProgress: ({ progress, rate }) => {
    const percent = (progress * 100).toFixed(1);
    const kbps = (rate / 1024).toFixed(1);
    console.log(`Upload [${percent}%] at ${kbps} KB/s`);
  },

  maxRate: [100 * 1024], // cap upload at 100 KB/s
});
```

## Download rate limiting

Cap the download speed for large responses:

```js
const { data } = await axios.get(FILE_URL, {
  onDownloadProgress: ({ progress, rate }) => {
    const percent = (progress * 100).toFixed(1);
    const kbps = (rate / 1024).toFixed(1);
    console.log(`Download [${percent}%] at ${kbps} KB/s`);
  },

  maxRate: [Infinity, 200 * 1024], // no upload limit, 200 KB/s download limit
  responseType: "arraybuffer",
});
```

## Combined upload and download limiting

Pass both limits as an array to control both directions simultaneously:

```js
await axios.post(SERVER_URL, largeBuffer, {
  maxRate: [50 * 1024, 500 * 1024], // 50 KB/s up, 500 KB/s down
});
```
