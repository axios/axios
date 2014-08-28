var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');
var server;

server = http.createServer(function (req, res) {
  req.setEncoding('utf8');

  var parsed = url.parse(req.url, true);
  var pathname = parsed.pathname;

  console.log('[' + new Date() + ']', req.method, pathname);

  if (pathname === '/') {
    pathname = '/index.html';
  }

  if (pathname === '/index.html') {
    fs.createReadStream(path.join(__dirname, pathname)).pipe(res);
  } else if (pathname === '/axios.js') {
    res.writeHead(200, {
      'Content-Type': 'text/javascript'
    });
    fs.createReadStream(path.join(__dirname, '../dist/axios.js')).pipe(res);
  } else if (pathname === '/api') {
    var status;
    var result;
    var data = '';

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

server.listen(3000);