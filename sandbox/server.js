import fs from 'fs';
import url from 'url';
import path from 'path';
import http from 'http';
let server;

function pipeFileToResponse(res, file, type) {
  if (type) {
    res.writeHead(200, {
      'Content-Type': type
    });
  }

  fs.createReadStream(path.join(path.resolve() ,'sandbox', file)).pipe(res);
}

server = http.createServer(function (req, res) {
  req.setEncoding('utf8');

  const parsed = url.parse(req.url, true);
  let pathname = parsed.pathname;

  console.log('[' + new Date() + ']', req.method, pathname);

  if (pathname === '/') {
    pathname = '/index.html';
  }

  if (pathname === '/index.html') {
    pipeFileToResponse(res, './client.html');
  } else if (pathname === '/axios.js') {
    pipeFileToResponse(res, '../dist/axios.js', 'text/javascript');
  } else if (pathname === '/axios.js.map') {
    pipeFileToResponse(res, '../dist/axios.js.map', 'text/javascript');
  } else if (pathname === '/api') {
    let status;
    let result;
    let data = '';

    req.on('data', function (chunk) {
      data += chunk;
    });

    req.on('end', function () {
      try {
        status = 200;
        result = {
          url: req.url,
          data: data ? JSON.parse(data) : undefined,
          method: req.method,
          headers: req.headers
        };
      } catch (e) {
        console.error('Error:', e.message);
        status = 400;
        result = {
          error: e.message
        };
      }

      res.writeHead(status, {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify(result));
    });
  } else {
    res.writeHead(404);
    res.end('<h1>404 Not Found</h1>');
  }
});

const PORT = 3000;

server.listen(PORT, console.log(`Listening on localhost:${PORT}...`));
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`Address localhost:${PORT} in use please retry when the port is available!`);
    server.close();
  }
});
