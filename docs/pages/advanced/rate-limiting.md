# Rate limiting <Badge type="tip" text="New" />

Axios supports rate limiting in the Node.js environment via the HTTP adapter. This is useful when you want to limit the rate at which you either upload or download data. An example of rate limiting is shown below:

```js
const { data } = await axios.post(LOCAL_SERVER_URL, myBuffer, {
  onUploadProgress: ({ progress, rate }) => {
    console.log(
      `Upload [${(progress * 100).toFixed(2)}%]: ${(rate / 1024).toFixed(
        2
      )}KB/s`
    );
  },

  maxRate: [100 * 1024], // 100KB/s limit
});
```
