import http from "http";
import http2 from "http2";
import stream from "stream";
import getStream from "get-stream";
import {Throttle} from "stream-throttle";
import formidable from "formidable";
import selfsigned from 'selfsigned';


export const LOCAL_SERVER_URL = 'http://localhost:4444';

export const SERVER_HANDLER_STREAM_ECHO = (req, res) => req.pipe(res);

export const setTimeoutAsync = (ms) => new Promise(resolve=> setTimeout(resolve, ms));

const certificate = selfsigned.generate(null, { keySize: 2048 });

export const startHTTPServer = (handlerOrOptions, options) => {

  const {
    handler,
    useBuffering = false,
    rate = undefined,
    port = 4444,
    keepAlive = 1000,
    useHTTP2,
    key = certificate.private,
    cert = certificate.cert,
  } =
    Object.assign(typeof handlerOrOptions === 'function' ? {
      handler: handlerOrOptions
    } : handlerOrOptions || {}, options);

  return new Promise((resolve, reject) => {
    const serverHandler = handler || async function (req, res) {
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
    }

    const server = useHTTP2 ?
      http2.createSecureServer({key, cert} , serverHandler) :
      http.createServer(serverHandler);

    const sessions = new Set();

    if(useHTTP2) {
      server.on('session', (session) => {
        sessions.add(session);

        session.once('close', () => {
          sessions.delete(session);
        });
      });

      server.closeAllSessions = () => {
        for (const session of sessions) {
          session.destroy();
        }
      }
    } else {
      server.keepAliveTimeout = keepAlive;
    }

    server.listen(port, function (err) {
      err ? reject(err) : resolve(this);
    });

  });
}

export const stopHTTPServer = async (server, timeout = 10000) => {
  if (server) {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }

    if (typeof server.closeAllSessions === 'function') {
      server.closeAllSessions();
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


export const startTestServer = async (port) => {
  const handler = async (req) => {
    const parsed = new URL(req.url, `http://localhost:${port}`);

    const params = Object.fromEntries(parsed.searchParams);

    let response = {
      url: req.url,
      pathname: parsed.pathname,
      params,
      method: req.method,
      headers: req.headers,
    }

    const contentType = req.headers['content-type'] || '';

    const {delay = 0} = params;

    if (+delay) {
      await setTimeoutAsync(+delay);
    }

    switch (parsed.pathname.replace(/\/$/, '')) {
      case '/echo/json':
      default:
        if (contentType.startsWith('multipart/')) {
          let {fields, files} = await handleFormData(req);
          response.form = fields;
          response.files = files;
        } else {
          response.body = (await getStream(req, {encoding: 'buffer'})).toString('hex');
        }

        return {
          body: response
        }
    }
  };

  return await startHTTPServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', `*`); // Allows all origins, or specify a domain like 'http://example.com'
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Allowed HTTP methods
    res.setHeader('Access-Control-Allow-Headers', '*'); // Allowed request headers
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight requests for 24 hours

    // Handle preflight requests (OPTIONS method)
    if (req.method === 'OPTIONS') {
      res.writeHead(204); // No content
      res.end();
      return;
    }

    Promise.resolve(handler(req, res)).then(response=>{
      const {status = 200, headers = {}, body} = response || {};


      res.statusCode = status;

      Object.entries(headers).forEach((header, value) => {
        res.setHeader(header, value);
      });

      res.end(JSON.stringify(body, null, 2))
    })
  }, {port});
}
