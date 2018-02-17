var axios = require('../../../index');
var http = require('http');
var net = require('net');
var url = require('url');
var zlib = require('zlib');
var fs = require('fs');
var server, proxy;

module.exports = {
  tearDown: function (callback) {
    server.close();
    server = null;
    if (proxy) {
      proxy.close()
      proxy = null;
    }

    if (process.env.http_proxy) {
      delete process.env.http_proxy;
    }

    callback();
  },

  testTimeout: function (test) {
    server = http.createServer(function (req, res) {
      setTimeout(function () {
        res.end();
      }, 1000);
    }).listen(4444, function () {
      var success = false, failure = false;
      var error;

      axios.get('http://localhost:4444/', {
        timeout: 250
      }).then(function (res) {
        success = true;
      }).catch(function (err) {
        error = err;
        failure = true;
      });

      setTimeout(function () {
        test.equal(success, false, 'request should not succeed');
        test.equal(failure, true, 'request should fail');
        test.equal(error.code, 'ECONNABORTED');
        test.equal(error.message, 'timeout of 250ms exceeded');
        test.done();
      }, 300);
    });
  },

  testJSON: function (test) {
    var data = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com'
    };

    server = http.createServer(function (req, res) {
      res.setHeader('Content-Type', 'application/json;charset=utf-8');
      res.end(JSON.stringify(data));
    }).listen(4444, function () {
      axios.get('http://localhost:4444/').then(function (res) {
        test.deepEqual(res.data, data);
        test.done();
      });
    });
  },

  testRedirect: function (test) {
    var str = 'test response';

    server = http.createServer(function (req, res) {
      var parsed = url.parse(req.url);

      if (parsed.pathname === '/one') {
        res.setHeader('Location', '/two');
        res.statusCode = 302;
        res.end();
      } else {
        res.end(str);
      }
    }).listen(4444, function () {
      axios.get('http://localhost:4444/one').then(function (res) {
        test.equal(res.data, str);
        test.equal(res.request.path, '/two');
        test.done();
      });
    });
  },

  testNoRedirect: function (test) {
    server = http.createServer(function (req, res) {
      res.setHeader('Location', '/foo');
      res.statusCode = 302;
      res.end();
    }).listen(4444, function () {
      axios.get('http://localhost:4444/', {
        maxRedirects: 0,
        validateStatus: function () {
          return true;
        }
      }).then(function (res) {
        test.equal(res.status, 302);
        test.equal(res.headers['location'], '/foo');
        test.done();
      });
    });
  },

  testMaxRedirects: function (test) {
    var i = 1;
    server = http.createServer(function (req, res) {
      res.setHeader('Location', '/' + i);
      res.statusCode = 302;
      res.end();
      i++;
    }).listen(4444, function () {
      axios.get('http://localhost:4444/', {
        maxRedirects: 3
      }).catch(function (error) {
        test.done();
      });
    });
  },

  testTransparentGunzip: function (test) {
    var data = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com'
    };

    zlib.gzip(JSON.stringify(data), function(err, zipped) {

      server = http.createServer(function (req, res) {
        res.setHeader('Content-Type', 'application/json;charset=utf-8');
        res.setHeader('Content-Encoding', 'gzip');
        res.end(zipped);
      }).listen(4444, function () {
        axios.get('http://localhost:4444/').then(function (res) {
          test.deepEqual(res.data, data);
          test.done();
        });
      });

    });
  },

  testGunzipErrorHandling: function (test) {
    server = http.createServer(function (req, res) {
      res.setHeader('Content-Type', 'application/json;charset=utf-8');
      res.setHeader('Content-Encoding', 'gzip');
      res.end('invalid response');
    }).listen(4444, function () {
      axios.get('http://localhost:4444/').catch(function (error) {
        test.done();
      });
    });
  },

  testUTF8: function (test) {
    var str = Array(100000).join('ж');

    server = http.createServer(function (req, res) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end(str);
    }).listen(4444, function () {
      axios.get('http://localhost:4444/').then(function (res) {
        test.equal(res.data, str);
        test.done();
      });
    });
  },

  testBasicAuth: function (test) {
    server = http.createServer(function (req, res) {
      res.end(req.headers.authorization);
    }).listen(4444, function () {
      var user = 'foo';
      var headers = { Authorization: 'Bearer 1234' };
      axios.get('http://' + user + '@localhost:4444/', { headers: headers }).then(function (res) {
        var base64 = new Buffer(user + ':', 'utf8').toString('base64');
        test.equal(res.data, 'Basic ' + base64);
        test.done();
      });
    });
  },

  testBasicAuthWithHeader: function (test) {
    server = http.createServer(function (req, res) {
      res.end(req.headers.authorization);
    }).listen(4444, function () {
      var auth = { username: 'foo', password: 'bar' };
      var headers = { Authorization: 'Bearer 1234' };
      axios.get('http://localhost:4444/', { auth: auth, headers: headers }).then(function (res) {
        var base64 = new Buffer('foo:bar', 'utf8').toString('base64');
        test.equal(res.data, 'Basic ' + base64);
        test.done();
      });
    });
  },

  testMaxContentLength: function(test) {
    var str = Array(100000).join('ж');

    server = http.createServer(function (req, res) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end(str);
    }).listen(4444, function () {
      var success = false, failure = false, error;

      axios.get('http://localhost:4444/', {
        maxContentLength: 2000
      }).then(function (res) {
        success = true;
      }).catch(function (err) {
        error = err;
        failure = true;
      });

      setTimeout(function () {
        test.equal(success, false, 'request should not succeed');
        test.equal(failure, true, 'request should fail');
        test.equal(error.message, 'maxContentLength size of 2000 exceeded');
        test.done();
      }, 100);
    });
  },

  testSocket: function (test) {
    server = net.createServer(function (socket) {
      socket.on('data', function() {
        socket.end('HTTP/1.1 200 OK\r\n\r\n');
      });
    }).listen('./test.sock', function() {
      axios({
        socketPath: './test.sock',
        url: '/'
      })
      .then(function(resp) {
        test.equal(resp.status, 200);
        test.equal(resp.statusText, 'OK');
        test.done();
      });
    });
  },

  testStream: function(test) {
    server = http.createServer(function (req, res) {
      req.pipe(res);
    }).listen(4444, function () {
      axios.post('http://localhost:4444/',
        fs.createReadStream(__filename), {
        responseType: 'stream'
      }).then(function (res) {
        var stream = res.data;
        var string = '';
        stream.on('data', function (chunk) {
          string += chunk.toString('utf8');
        });
        stream.on('end', function () {
          test.equal(string, fs.readFileSync(__filename, 'utf8'));
          test.done();
        });
      });
    });
  },

  testBuffer: function(test) {
    var buf = new Buffer(1024); // Unsafe buffer < Buffer.poolSize (8192 bytes)
    buf.fill('x');
    server = http.createServer(function (req, res) {
      test.equal(req.headers['content-length'], buf.length.toString());
      req.pipe(res);
    }).listen(4444, function () {
      axios.post('http://localhost:4444/',
        buf, {
        responseType: 'stream'
      }).then(function (res) {
        var stream = res.data;
        var string = '';
        stream.on('data', function (chunk) {
          string += chunk.toString('utf8');
        });
        stream.on('end', function () {
          test.equal(string, buf.toString());
          test.done();
        });
      });
    });
  },

  testHTTPProxy: function(test) {
    server = http.createServer(function(req, res) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end('12345');
    }).listen(4444, function() {
      proxy = http.createServer(function(request, response) {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };

        http.get(opts, function(res) {
          var body = '';
          res.on('data', function(data) {
            body += data;
          });
          res.on('end', function() {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '6789');
          });
        });

      }).listen(4000, function() {
        axios.get('http://localhost:4444/', {
          proxy: {
            host: 'localhost',
            port: 4000
          }
        }).then(function(res) {
          test.equal(res.data, '123456789', 'should pass through proxy');
          test.done();
        });
      });
    });
  },

  testHTTPProxyDisabled: function(test) {
    // set the env variable
    process.env.http_proxy = 'http://does-not-exists.example.com:4242/';

    server = http.createServer(function(req, res) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end('123456789');
    }).listen(4444, function() {
      axios.get('http://localhost:4444/', {
          proxy: false
        }).then(function(res) {
          test.equal(res.data, '123456789', 'should not pass through proxy');
          test.done();
        });
    });
  },

  testHTTPProxyEnv: function(test) {
    server = http.createServer(function(req, res) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end('4567');
    }).listen(4444, function() {
      proxy = http.createServer(function(request, response) {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };

        http.get(opts, function(res) {
          var body = '';
          res.on('data', function(data) {
            body += data;
          });
          res.on('end', function() {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '1234');
          });
        });

      }).listen(4000, function() {
        // set the env variable
        process.env.http_proxy = 'http://localhost:4000/';

        axios.get('http://localhost:4444/').then(function(res) {
          test.equal(res.data, '45671234', 'should use proxy set by process.env.http_proxy');
          test.done();
        });
      });
    });
  },

  testHTTPProxyAuth: function(test) {
    server = http.createServer(function(req, res) {
      res.end();
    }).listen(4444, function() {
      proxy = http.createServer(function(request, response) {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };
        var proxyAuth = request.headers['proxy-authorization'];

        http.get(opts, function(res) {
          var body = '';
          res.on('data', function(data) {
            body += data;
          });
          res.on('end', function() {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(proxyAuth);
          });
        });

      }).listen(4000, function() {
        axios.get('http://localhost:4444/', {
          proxy: {
            host: 'localhost',
            port: 4000,
            auth: {
              username: 'user',
              password: 'pass'
            }
          }
        }).then(function(res) {
          var base64 = new Buffer('user:pass', 'utf8').toString('base64');
          test.equal(res.data, 'Basic ' + base64, 'should authenticate to the proxy');
          test.done();
        });
      });
    });
  },

  testHTTPProxyAuthFromEnv: function(test) {
    server = http.createServer(function(req, res) {
      res.end();
    }).listen(4444, function() {
      proxy = http.createServer(function(request, response) {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };
        var proxyAuth = request.headers['proxy-authorization'];

        http.get(opts, function(res) {
          var body = '';
          res.on('data', function(data) {
            body += data;
          });
          res.on('end', function() {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(proxyAuth);
          });
        });

      }).listen(4000, function() {
        process.env.http_proxy = 'http://user:pass@localhost:4000/';

        axios.get('http://localhost:4444/').then(function(res) {
          var base64 = new Buffer('user:pass', 'utf8').toString('base64');
          test.equal(res.data, 'Basic ' + base64, 'should authenticate to the proxy set by process.env.http_proxy');
          test.done();
        });
      });
    });
  },

  testHTTPProxyAuthWithHeader: function (test) {
    server = http.createServer(function(req, res) {
      res.end();
    }).listen(4444, function() {
      proxy = http.createServer(function(request, response) {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };
        var proxyAuth = request.headers['proxy-authorization'];

        http.get(opts, function(res) {
          var body = '';
          res.on('data', function(data) {
            body += data;
          });
          res.on('end', function() {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(proxyAuth);
          });
        });

      }).listen(4000, function() {
        axios.get('http://localhost:4444/', {
          proxy: {
            host: 'localhost',
            port: 4000,
            auth: {
              username: 'user',
              password: 'pass'
            }
          },
          headers: {
            'Proxy-Authorization': 'Basic abc123'
          }
        }).then(function(res) {
          var base64 = new Buffer('user:pass', 'utf8').toString('base64');
          test.equal(res.data, 'Basic ' + base64, 'should authenticate to the proxy');
          test.done();
        });
      });
    });
  },

  testCancel: function(test) {
    var source = axios.CancelToken.source();
    server = http.createServer(function (req, res) {
      // call cancel() when the request has been sent, but a response has not been received
      source.cancel('Operation has been canceled.');
    }).listen(4444, function() {
      axios.get('http://localhost:4444/', {
        cancelToken: source.token
      }).catch(function (thrown) {
        test.ok(thrown instanceof axios.Cancel, 'Promise must be rejected with a Cancel obejct');
        test.equal(thrown.message, 'Operation has been canceled.');
        test.done();
      });
    });
  }
};
