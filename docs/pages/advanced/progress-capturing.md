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
