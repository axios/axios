import http from "http";
import stream from "stream";
import getStream from "get-stream";
import {Throttle} from "stream-throttle";
import formidable from "formidable";

export const LOCAL_SERVER_URL = 'http://localhost:4444';

export const SERVER_HANDLER_STREAM_ECHO = (req, res) => req.pipe(res);

export const setTimeoutAsync = (ms) => new Promise(resolve=> setTimeout(resolve, ms));

export const startHTTPServer = (handlerOrOptions, options) => {

  const {handler, useBuffering = false, rate = undefined, port = 4444, keepAlive = 1000} =
    Object.assign(typeof handlerOrOptions === 'function' ? {
      handler: handlerOrOptions
    } : handlerOrOptions || {}, options);

  return new Promise((resolve, reject) => {
    const server = http.createServer(handler || async function (req, res) {
      try {
        req.headers['content-length'] && res.setHeader('content-length', req.headers['content-length']);

        let dataStream = req;

        if (useBuffering) {
          dataStream = stream.Readable.from(await getStream(req));
        }

        let streams = [dataStream];

        if (rate) {
          streams.push(new Throttle({rate}))
        }

        streams.push(res);

        stream.pipeline(streams, (err) => {
          err && console.log('Server warning: ' + err.message)
        });
      } catch (err){
        console.warn('HTTP server error:', err);
      }

    }).listen(port, function (err) {
      err ? reject(err) : resolve(this);
    });

    server.keepAliveTimeout = keepAlive;
  });
}

export const stopHTTPServer = async (server, timeout = 10000) => {
  if (server) {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }

    await Promise.race([new Promise(resolve => server.close(resolve)), setTimeoutAsync(timeout)]);
  }
}

export const handleFormData = (req) => {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }

      resolve({fields, files});
    });
  });
}

export const nodeVersion = process.versions.node.split('.').map(v => parseInt(v, 10));

export const generateReadable = (length = 1024 * 1024, chunkSize = 10 * 1024, sleep = 50) => {
  return stream.Readable.from(async function* (){
    let dataLength = 0;

    while(dataLength < length) {
      const leftBytes = length - dataLength;

      const chunk = Buffer.alloc(leftBytes > chunkSize? chunkSize : leftBytes);

      dataLength += chunk.length;

      yield chunk;

      if (sleep) {
        await setTimeoutAsync(sleep);
      }
    }
  }());
}

export const makeReadableStream = (chunk = 'chunk', n = 10, timeout = 100) => {
  return new ReadableStream({
      async pull(controller) {
        await setTimeoutAsync(timeout);
        n-- ? controller.enqueue(chunk) : controller.close();
      }
    },
    {
      highWaterMark: 1
    }
  )
}

export const makeEchoStream = (echo) => new WritableStream({
  write(chunk) {
    echo && console.log(`Echo chunk`, chunk);
  }
})
