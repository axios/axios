# Progress capturing <Badge type="tip" text="New" />

Axios supports both browser and node environments to capture request upload/download progress. The frequency of progress events is forced to be limited to 3 times per second. This is to prevent the browser from being overwhelmed with progress events. An example of capturing progress events is shown below:

```js
await axios.post(url, data, {
  onUploadProgress: function (axiosProgressEvent) {
    /*{
      loaded: number;
      total?: number;
      progress?: number; // in range [0..1]
      bytes: number; // how many bytes have been transferred since the last trigger (delta)
      estimated?: number; // estimated time in seconds
      rate?: number; // upload speed in bytes
      upload: true; // upload sign
    }*/
  },

  onDownloadProgress: function (axiosProgressEvent) {
    /*{
      loaded: number;
      total?: number;
      progress?: number;
      bytes: number; 
      estimated?: number;
      rate?: number; // download speed in bytes
      download: true; // download sign
    }*/
  },
});
```

You can also stream the upload and download progress events to a readable stream in Node.js. This is useful when you want to display the progress in a custom way. An example of streaming progress events is shown below:

```js
const { data } = await axios.post(SERVER_URL, readableStream, {
  onUploadProgress: ({ progress }) => {
    console.log((progress * 100).toFixed(2));
  },

  headers: {
    "Content-Length": contentLength,
  },

  maxRedirects: 0, // avoid buffering the entire stream
});
```

::: warning
Capturing FormData upload progress is not currently supported in node.js environments
:::

::: danger
It is recommended to disable redirects by setting maxRedirects: 0 to upload the stream in the node.js environment, as the follow-redirects package will buffer the entire stream in RAM without following the "backpressure" algorithm
:::

## Reading response data incrementally

In the browser, the XHR adapter (the default) passes the native progress event as `axiosProgressEvent.event`. You can use its `target`, the underlying `XMLHttpRequest`, to read the response text received so far:

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

Because progress callbacks are throttled, a delivery can run after the browser finished dispatching the original event. In that case `event.currentTarget` is `null` (standard DOM behavior), but `event.target` still references the request, so use `target` as shown above.

When an XHR download completes successfully, axios delivers a final download progress event from the `loadend` handler with the complete transfer state, so the last chunk is not lost to throttling. Upload progress, failed XHR downloads, and aborted or errored transfers keep their previous behavior: only an already pending progress event is delivered.
