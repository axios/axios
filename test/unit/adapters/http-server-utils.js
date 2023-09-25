import http from 'http';
import stream from 'stream';
import getStream from 'get-stream';

import {Throttle} from 'stream-throttle';

export const LOCAL_SERVER_URL = 'http://localhost:4444';


export function startHTTPServer(options) {
  const {handler, useBuffering = false, rate = undefined, port = 4444} = typeof options === 'function' ? {
    handler: options
  } : options || {};

  return new Promise((resolve, reject) => {
    http.createServer(handler || async function (req, res) {
      try {
        req.headers['content-length'] && res.setHeader('content-length', req.headers['content-length']);

        var dataStream = req;

        if (useBuffering) {
          dataStream = stream.Readable.from(await getStream(req));
        }

        var streams = [dataStream];

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
  });
}
