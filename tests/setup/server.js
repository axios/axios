import http from 'http';
import http2 from 'http2';
import stream from 'stream';
import getStream, { getStreamAsBuffer } from 'get-stream';
import { Throttle } from 'stream-throttle';
import { IncomingForm } from 'formidable';
import selfsigned from 'selfsigned';

export const SERVER_HANDLER_STREAM_ECHO = (req, res) => req.pipe(res);

export const setTimeoutAsync = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const certificatePromise = selfsigned.generate(null, { keySize: 2048 });
const trackedServers = new Set();

const untrackServer = (server) => {
  trackedServers.delete(server);
};

export const startHTTPServer = async (handlerOrOptions, options) => {
  const certificate = await certificatePromise;

  const {
    handler,
    useBuffering = false,
    rate = undefined,
    // Default to 0 so the OS assigns a free ephemeral port. Tests that need
    // a deterministic port can still pass one explicitly. Sharing a fixed
    // port across many tests creates TIME_WAIT / pool-reuse races that
    // surface as EPIPE on the client under CI runner load.
    port = 0,
    keepAlive = 1000,
    useHTTP2,
    key = certificate.private,
    cert = certificate.cert,
  } = Object.assign(
    typeof handlerOrOptions === 'function'
      ? {
          handler: handlerOrOptions,
        }
      : handlerOrOptions || {},
    options
  );

  return new Promise((resolve, reject) => {
    const serverHandler =
      handler ||
      async function (req, res) {
        try {
          req.headers['content-length'] &&
            res.setHeader('content-length', req.headers['content-length']);

          let dataStream = req;

          if (useBuffering) {
            dataStream = stream.Readable.from(await getStream(req));
          }

          const streams = [dataStream];

          if (rate) {
            streams.push(new Throttle({ rate }));
          }

          streams.push(res);

          stream.pipeline(streams, (err) => {
            err && console.log('Server warning: ' + err.message);
          });
        } catch (err) {
          console.warn('HTTP server error:', err);
        }
      };

    const server = useHTTP2
      ? http2.createSecureServer({ key, cert }, serverHandler)
      : http.createServer(serverHandler);

    const sessions = new Set();

    if (useHTTP2) {
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
      };
    } else {
      server.keepAliveTimeout = keepAlive;
    }

    server.listen(port, function (err) {
      if (err) {
        reject(err);
        return;
      }

      trackedServers.add(this);
      resolve(this);
    });
  });
};

export const stopHTTPServer = async (server, timeout = 10000) => {
  if (!server) return;

  // Try a graceful close first so in-flight requests can finish writing and
  // clients see clean FINs instead of RSTs. Forcefully tearing down sockets
  // up-front (closeAllConnections) is what produces dangling RSTs that the
  // next test on the same port can observe as EPIPE on its client write.
  // Force-close only after a short grace period.
  const closed = new Promise((resolve) => server.close(resolve));
  const grace = Math.min(2000, Math.max(0, timeout / 2));

  const winner = await Promise.race([
    closed.then(() => 'graceful'),
    setTimeoutAsync(grace).then(() => 'grace_elapsed'),
  ]);

  if (winner === 'grace_elapsed') {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    if (typeof server.closeAllSessions === 'function') {
      server.closeAllSessions();
    }
    await Promise.race([closed, setTimeoutAsync(timeout - grace)]);
  }

  untrackServer(server);
};

export const stopAllTrackedHTTPServers = async (timeout = 10000) => {
  const servers = Array.from(trackedServers);
  await Promise.all(servers.map((server) => stopHTTPServer(server, timeout)));
};

export const handleFormData = (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();

    form.parse(req, (err, fields, files) => {
      if (err) {
        // Drain any unread bytes so the kernel doesn't send an RST when the
        // server closes the response. An unread request buffer is what causes
        // the client write side to surface EPIPE on a subsequent test.
        if (typeof req.resume === 'function') req.resume();
        return reject(err);
      }

      resolve({ fields, files });
    });
  });
};

export const nodeVersion = process.versions.node.split('.').map((v) => parseInt(v, 10));

export const generateReadable = (length = 1024 * 1024, chunkSize = 10 * 1024, sleep = 50) => {
  return stream.Readable.from(
    (async function* () {
      let dataLength = 0;

      while (dataLength < length) {
        const leftBytes = length - dataLength;

        const chunk = Buffer.alloc(leftBytes > chunkSize ? chunkSize : leftBytes);

        dataLength += chunk.length;

        yield chunk;

        if (sleep) {
          await setTimeoutAsync(sleep);
        }
      }
    })()
  );
};

export const makeReadableStream = (chunk = 'chunk', n = 10, timeout = 100) => {
  return new ReadableStream(
    {
      async pull(controller) {
        await setTimeoutAsync(timeout);
        n-- ? controller.enqueue(chunk) : controller.close();
      },
    },
    {
      highWaterMark: 1,
    }
  );
};

export const makeEchoStream = (echo) =>
  new WritableStream({
    write(chunk) {
      echo && console.log('Echo chunk', chunk);
    },
  });

export const startTestServer = async (port) => {
  const handler = async (req) => {
    const parsed = new URL(req.url, `http://localhost:${port}`);

    const params = Object.fromEntries(parsed.searchParams);

    const response = {
      url: req.url,
      pathname: parsed.pathname,
      params,
      method: req.method,
      headers: req.headers,
    };

    const contentType = req.headers['content-type'] || '';

    const { delay = 0 } = params;

    if (+delay) {
      await setTimeoutAsync(+delay);
    }

    switch (parsed.pathname.replace(/\/$/, '')) {
      case '/echo/json':
      default:
        if (contentType.startsWith('multipart/')) {
          const { fields, files } = await handleFormData(req);
          response.form = fields;
          response.files = files;
        } else {
          response.body = (await getStreamAsBuffer(req)).toString('hex');
        }

        return {
          body: response,
        };
    }
  };

  return await startHTTPServer(
    (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', `*`);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Max-Age', '86400');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      Promise.resolve(handler(req, res)).then((result) => {
        const { status = 200, headers = {}, body } = result || {};

        res.statusCode = status;

        Object.entries(headers).forEach(([header, value]) => {
          res.setHeader(header, value);
        });

        res.end(JSON.stringify(body, null, 2));
      });
    },
    { port }
  );
};
