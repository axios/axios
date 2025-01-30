var axios = require('../../../index');
var http = require('http');
var https = require('https');
var net = require('net');
var url = require('url');
var zlib = require('zlib');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var pkg = require('./../../../package.json');
var server, proxy;
var AxiosError = require('../../../lib/core/AxiosError');
var FormData = require('form-data');
var formidable = require('formidable');
var express = require('express');
var multer = require('multer');
var bodyParser = require('body-parser');
const isBlobSupported = typeof Blob !== 'undefined';

var noop = ()=> {};

describe('supports http with nodejs', function () {

  afterEach(function () {
    if (server) {
      server.close();
      server = null;
    }
    if (proxy) {
      proxy.close();
      proxy = null;
    }
    delete process.env.http_proxy;
    delete process.env.https_proxy;
    delete process.env.no_proxy;
  });

  it('should throw an error if the timeout property is not parsable as a number', function (done) {

    server = http.createServer(function (req, res) {
      setTimeout(function () {
        res.end();
      }, 1000);
    }).listen(4444, function () {
      var success = false, failure = false;
      var error;

      axios.get('http://localhost:4444/', {
        timeout: { strangeTimeout: 250 }
      }).then(function (res) {
        success = true;
      }).catch(function (err) {
        error = err;
        failure = true;
      });

      setTimeout(function () {
        assert.equal(success, false, 'request should not succeed');
        assert.equal(failure, true, 'request should fail');
        assert.equal(error.code, AxiosError.ERR_BAD_OPTION_VALUE);
        assert.equal(error.message, 'error trying to parse `config.timeout` to int');
        done();
      }, 300);
    });
  });

  it('should parse the timeout property', function (done) {

    server = http.createServer(function (req, res) {
      setTimeout(function () {
        res.end();
      }, 1000);
    }).listen(4444, function () {
      var success = false, failure = false;
      var error;

      axios.get('http://localhost:4444/', {
        timeout: '250'
      }).then(function (res) {
        success = true;
      }).catch(function (err) {
        error = err;
        failure = true;
      });

      setTimeout(function () {
        assert.equal(success, false, 'request should not succeed');
        assert.equal(failure, true, 'request should fail');
        assert.equal(error.code, 'ECONNABORTED');
        assert.equal(error.message, 'timeout of 250ms exceeded');
        done();
      }, 300);
    });
  });

  it('should respect the timeout property', function (done) {

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
        assert.equal(success, false, 'request should not succeed');
        assert.equal(failure, true, 'request should fail');
        assert.equal(error.code, 'ECONNABORTED');
        assert.equal(error.message, 'timeout of 250ms exceeded');
        done();
      }, 300);
    });
  });

  it('should respect the timeoutErrorMessage property', function (done) {

    server = http.createServer(function (req, res) {
      setTimeout(function () {
        res.end();
      }, 1000);
    }).listen(4444, function () {
      var success = false, failure = false;
      var error;

      axios.get('http://localhost:4444/', {
        timeout: 250,
        timeoutErrorMessage: 'oops, timeout',
      }).then(function (res) {
        success = true;
      }).catch(function (err) {
        error = err;
        failure = true;
      });

      setTimeout(function () {
        assert.strictEqual(success, false, 'request should not succeed');
        assert.strictEqual(failure, true, 'request should fail');
        assert.strictEqual(error.code, 'ECONNABORTED');
        assert.strictEqual(error.message, 'oops, timeout');
        done();
      }, 300);
    });
  });

  it('should allow passing JSON', function (done) {
    var data = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com'
    };

    server = http.createServer(function (req, res) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    }).listen(4444, function () {
      axios.get('http://localhost:4444/').then(function (res) {
        assert.deepEqual(res.data, data);
        done();
      }).catch(done);
    });
  });

  it('should allow passing JSON with BOM', function (done) {
    var data = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com'
    };

    server = http.createServer(function (req, res) {
      res.setHeader('Content-Type', 'application/json');
      var bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF])
      var jsonBuffer = Buffer.from(JSON.stringify(data));
      res.end(Buffer.concat([bomBuffer, jsonBuffer]));
    }).listen(4444, function () {
      axios.get('http://localhost:4444/').then(function (res) {
        assert.deepEqual(res.data, data);
        done();
      }).catch(done);;
    });
  });

  it('should redirect', function (done) {
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
        assert.equal(res.data, str);
        assert.equal(res.request.path, '/two');
        done();
      }).catch(done);
    });
  });

  it('should not redirect', function (done) {
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
        assert.equal(res.status, 302);
        assert.equal(res.headers['location'], '/foo');
        done();
      }).catch(done);
    });
  });

  it('should support max redirects', function (done) {
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
        assert.equal(error.code, AxiosError.ERR_FR_TOO_MANY_REDIRECTS);
        assert.equal(error.message, 'Maximum number of redirects exceeded');
        done();
      }).catch(done);
    });
  });

  it('should support beforeRedirect', function (done) {
    server = http.createServer(function (req, res) {
      res.setHeader('Location', '/foo');
      res.statusCode = 302;
      res.end();
    }).listen(4444, function () {
      axios.get('http://localhost:4444/', {
        maxRedirects: 3,
        beforeRedirect: function (options) {
          if (options.path === '/foo') {
            throw new Error(
              'Provided path is not allowed'
            );
          }
        }
      }).catch(function (error) {
        assert.equal(error.message, 'Redirected request failed: Provided path is not allowed');
        done();
      }).catch(done);
    });
  });

  it('should support beforeRedirect and proxy with redirect', function (done) {
    var requestCount = 0;
    var totalRedirectCount = 5;
    server = http.createServer(function (req, res) {
      requestCount += 1;
      if (requestCount <= totalRedirectCount) {
        res.setHeader('Location', 'http://localhost:4444');
        res.writeHead(302);
      }
      res.end();
    }).listen(4444, function () {
      var proxyUseCount = 0;
      proxy = http.createServer(function (request, response) {
        proxyUseCount += 1;
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };

        http.get(opts, function (res) {
          response.writeHead(res.statusCode, res.headers);
          res.on('data', function (data) {
            response.write(data)
          });
          res.on('end', function () {
            response.end();
          });
        });
      }).listen(4000, function () {
        var configBeforeRedirectCount = 0;
        axios.get('http://localhost:4444/', {
          proxy: {
            host: 'localhost',
            port: 4000
          },
          maxRedirects: totalRedirectCount,
          beforeRedirect: function (options) {
            configBeforeRedirectCount += 1;
          }
        }).then(function (res) {
          assert.equal(totalRedirectCount, configBeforeRedirectCount, 'should invoke config.beforeRedirect option on every redirect');
          assert.equal(totalRedirectCount + 1, proxyUseCount, 'should go through proxy on every redirect');
          done();
        }).catch(done);
      });
    });
  });

  it('should preserve the HTTP verb on redirect', function (done) {
    server = http.createServer(function (req, res) {
      if (req.method.toLowerCase() !== "head") {
        res.statusCode = 400;
        res.end();
        return;
      }

      var parsed = url.parse(req.url);
      if (parsed.pathname === '/one') {
        res.setHeader('Location', '/two');
        res.statusCode = 302;
        res.end();
      } else {
        res.end();
      }
    }).listen(4444, function () {
      axios.head('http://localhost:4444/one').then(function (res) {
        assert.equal(res.status, 200);
        done();
      }).catch(done);
    });
  });

  it('should support transparent gunzip', function (done) {
    var data = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com'
    };

    zlib.gzip(JSON.stringify(data), function (err, zipped) {

      server = http.createServer(function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Encoding', 'gzip');
        res.end(zipped);
      }).listen(4444, function () {
        axios.get('http://localhost:4444/').then(function (res) {
          assert.deepEqual(res.data, data);
          done();
        }).catch(done);
      });
    });
  });

  it('should support gunzip error handling', function (done) {
    server = http.createServer(function (req, res) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Encoding', 'gzip');
      res.end('invalid response');
    }).listen(4444, function () {
      axios.get('http://localhost:4444/').catch(function (error) {
        done();
      }).catch(done);
    });
  });

  it('should support disabling automatic decompression of response data', function(done) {
    var data = 'Test data';

    zlib.gzip(data, function(err, zipped) {
      server = http.createServer(function(req, res) {
        res.setHeader('Content-Type', 'text/html;charset=utf-8');
        res.setHeader('Content-Encoding', 'gzip');
        res.end(zipped);
      }).listen(4444, function() {
        axios.get('http://localhost:4444/', {
          decompress: false,
          responseType: 'arraybuffer'

        }).then(function(res) {
          assert.equal(res.data.toString('base64'), zipped.toString('base64'));
          done();
        }).catch(done);
      });
    });
  });

  it('should support UTF8', function (done) {
    var str = Array(100000).join('ж');

    server = http.createServer(function (req, res) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end(str);
    }).listen(4444, function () {
      axios.get('http://localhost:4444/').then(function (res) {
        assert.equal(res.data, str);
        done();
      }).catch(done);
    });
  });

  it('should support basic auth', function (done) {
    server = http.createServer(function (req, res) {
      res.end(req.headers.authorization);
    }).listen(4444, function () {
      var user = 'foo';
      var headers = { Authorization: 'Bearer 1234' };
      axios.get('http://' + user + '@localhost:4444/', { headers: headers }).then(function (res) {
        var base64 = Buffer.from(user + ':', 'utf8').toString('base64');
        assert.equal(res.data, 'Basic ' + base64);
        done();
      }).catch(done);
    });
  });

  it('should support basic auth with a header', function (done) {
    server = http.createServer(function (req, res) {
      res.end(req.headers.authorization);
    }).listen(4444, function () {
      var auth = { username: 'foo', password: 'bar' };
      var headers = { AuThOrIzAtIoN: 'Bearer 1234' }; // wonky casing to ensure caseless comparison
      axios.get('http://localhost:4444/', { auth: auth, headers: headers }).then(function (res) {
        var base64 = Buffer.from('foo:bar', 'utf8').toString('base64');
        assert.equal(res.data, 'Basic ' + base64);
        done();
      }).catch(done);
    });
  });

  it('should provides a default User-Agent header', function (done) {
    server = http.createServer(function (req, res) {
      res.end(req.headers['user-agent']);
    }).listen(4444, function () {
      axios.get('http://localhost:4444/').then(function (res) {
        assert.ok(/^axios\/[\d.]+$/.test(res.data), `User-Agent header does not match: ${res.data}`);
        done();
      }).catch(done);
    });
  });

  it('should allow the User-Agent header to be overridden', function (done) {
    server = http.createServer(function (req, res) {
      res.end(req.headers['user-agent']);
    }).listen(4444, function () {
      var headers = { 'UsEr-AgEnT': 'foo bar' }; // wonky casing to ensure caseless comparison
      axios.get('http://localhost:4444/', { headers }).then(function (res) {
        assert.equal(res.data, 'foo bar');
        done();
      }).catch(done);
    });
  });

  it('should allow the Content-Length header to be overridden', function (done) {
    server = http.createServer(function (req, res) {
      assert.strictEqual(req.headers['content-length'], '42');
      res.end();
    }).listen(4444, function () {
      var headers = { 'CoNtEnT-lEnGtH': '42' }; // wonky casing to ensure caseless comparison
      axios.post('http://localhost:4444/', 'foo', { headers }).then(function () {
        done();
      }).catch(done);
    });
  });

  it('should support max content length', function (done) {
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
        assert.equal(success, false, 'request should not succeed');
        assert.equal(failure, true, 'request should fail');
        assert.equal(error.message, 'maxContentLength size of 2000 exceeded');
        done();
      }, 100);
    });
  });

  it('should support max content length for redirected', function (done) {
    var str = Array(100000).join('ж');

    server = http.createServer(function (req, res) {
      var parsed = url.parse(req.url);

      if (parsed.pathname === '/two') {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end(str);
      } else {
        res.setHeader('Location', '/two');
        res.statusCode = 302;
        res.end();
      }
    }).listen(4444, function () {
      var success = false, failure = false, error;

      axios.get('http://localhost:4444/one', {
        maxContentLength: 2000
      }).then(function (res) {
        success = true;
      }).catch(function (err) {
        error = err;
        failure = true;
      });

      setTimeout(function () {
        assert.equal(success, false, 'request should not succeed');
        assert.equal(failure, true, 'request should fail');
        assert.equal(error.message, 'maxContentLength size of 2000 exceeded');
        done();
      }, 100);
    });
  });

  it('should support max body length', function (done) {
    var data = Array(100000).join('ж');

    server = http.createServer(function (req, res) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end();
    }).listen(4444, function () {
      var success = false, failure = false, error;

      axios.post('http://localhost:4444/', {
        data: data
      }, {
        maxBodyLength: 2000
      }).then(function (res) {
        success = true;
      }).catch(function (err) {
        error = err;
        failure = true;
      });


      setTimeout(function () {
        assert.equal(success, false, 'request should not succeed');
        assert.equal(failure, true, 'request should fail');
        assert.equal(error.message, 'Request body larger than maxBodyLength limit');
        done();
      }, 100);
    });
  });

  it('should properly support default max body length (follow-redirects as well)', function (done) {
    // taken from https://github.com/follow-redirects/follow-redirects/blob/22e81fc37132941fb83939d1dc4c2282b5c69521/index.js#L461
    var followRedirectsMaxBodyDefaults = 10 * 1024 *1024;
    var data = Array(2 * followRedirectsMaxBodyDefaults).join('ж');

    server = http.createServer(function (req, res) {
      // consume the req stream
      req.on('data', noop);
      // and wait for the end before responding, otherwise an ECONNRESET error will be thrown
      req.on('end', ()=> {
        res.end('OK');
      });
    }).listen(4444, function (err) {
      if (err) {
        return done(err);
      }
      // send using the default -1 (unlimited axios maxBodyLength)
      axios.post('http://localhost:4444/', {
        data: data
      }).then(function (res) {
        assert.equal(res.data, 'OK', 'should handle response');
        done();
      }).catch(done);
    });
  });

  it('should display error while parsing params', function (done) {
    server = http.createServer(function () {

    }).listen(4444, function () {
      axios.get('http://localhost:4444/', {
        params: {
          errorParam: new Date(undefined),
        },
      }).catch(function (err) {
        assert.deepEqual(err.exists, true)
        done();
      }).catch(done);
    });
  });

  it('should support sockets', function (done) {
    // Different sockets for win32 vs darwin/linux
    var socketName = './test.sock';

    if (process.platform === 'win32') {
      socketName = '\\\\.\\pipe\\libuv-test';
    }

    server = net.createServer(function (socket) {
      socket.on('data', function () {
        socket.end('HTTP/1.1 200 OK\r\n\r\n');
      });
    }).listen(socketName, function () {
      axios({
        socketPath: socketName,
        url: '/'
      })
        .then(function (resp) {
          assert.equal(resp.status, 200);
          assert.equal(resp.statusText, 'OK');
          done();
        }).catch(done);
    });
  });

  it('should support streams', function (done) {
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
            assert.equal(string, fs.readFileSync(__filename, 'utf8'));
            done();
          });
        }).catch(done);
    });
  });

  it('should pass errors for a failed stream', function (done) {
    var notExitPath = path.join(__dirname, 'does_not_exist');

    server = http.createServer(function (req, res) {
      req.pipe(res);
    }).listen(4444, function () {
      axios.post('http://localhost:4444/',
        fs.createReadStream(notExitPath)
      ).then(function (res) {
        assert.fail('expected ENOENT error');
      }).catch(function (err) {
        assert.equal(err.message, `ENOENT: no such file or directory, open \'${notExitPath}\'`);
        done();
      }).catch(done);
    });
  });

  it('should support buffers', function (done) {
    var buf = Buffer.alloc(1024, 'x'); // Unsafe buffer < Buffer.poolSize (8192 bytes)
    server = http.createServer(function (req, res) {
      assert.equal(req.headers['content-length'], buf.length.toString());
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
            assert.equal(string, buf.toString());
            done();
          });
        }).catch(done);
    });
  });

  it('should support HTTP proxies', function (done) {
    server = http.createServer(function (req, res) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end('12345');
    }).listen(4444, function () {
      proxy = http.createServer(function (request, response) {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };

        http.get(opts, function (res) {
          var body = '';
          res.on('data', function (data) {
            body += data;
          });
          res.on('end', function () {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '6789');
          });
        });

      }).listen(4000, function () {
        axios.get('http://localhost:4444/', {
          proxy: {
            host: 'localhost',
            port: 4000
          }
        }).then(function (res) {
          assert.equal(res.data, '123456789', 'should pass through proxy');
          done();
        }).catch(done);
      });
    });
  });

  it('should support HTTPS proxies', function (done) {
    var options = {
      key: fs.readFileSync(path.join(__dirname, 'key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
    };

    server = https.createServer(options, function (req, res) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end('12345');
    }).listen(4444, function () {
      proxy = https.createServer(options, function (request, response) {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path,
          protocol: parsed.protocol,
          rejectUnauthorized: false
        };

        https.get(opts, function (res) {
          var body = '';
          res.on('data', function (data) {
            body += data;
          });
          res.on('end', function () {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '6789');
          });
        });
      }).listen(4000, function () {
        axios.get('https://localhost:4444/', {
          proxy: {
            host: 'localhost',
            port: 4000,
            protocol: 'https:'
          },
          httpsAgent: new https.Agent({
            rejectUnauthorized: false
          })
        }).then(function (res) {
          assert.equal(res.data, '123456789', 'should pass through proxy');
          done();
        }).catch(done);
      });
    });
  });

  it('should not pass through disabled proxy', function (done) {
    // set the env variable
    process.env.http_proxy = 'http://does-not-exists.example.com:4242/';

    server = http.createServer(function (req, res) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end('123456789');
    }).listen(4444, function () {
      axios.get('http://localhost:4444/', {
        proxy: false
      }).then(function (res) {
        assert.equal(res.data, '123456789', 'should not pass through proxy');
        done();
      }).catch(done);
    });
  });

  it('should support proxy set via env var', function (done) {
    server = http.createServer(function (req, res) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end('4567');
    }).listen(4444, function () {
      proxy = http.createServer(function (request, response) {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };

        http.get(opts, function (res) {
          var body = '';
          res.on('data', function (data) {
            body += data;
          });
          res.on('end', function () {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '1234');
          });
        });

      }).listen(4000, function () {
        // set the env variable
        process.env.http_proxy = 'http://localhost:4000/';

        axios.get('http://localhost:4444/').then(function (res) {
          assert.equal(res.data, '45671234', 'should use proxy set by process.env.http_proxy');
          done();
        }).catch(done);
      });
    });
  });

  it('should support HTTPS proxy set via env var', function (done) {
    var options = {
      key: fs.readFileSync(path.join(__dirname, 'key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
    };

    server = https.createServer(options, function (req, res) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end('12345');
    }).listen(4444, function () {
      proxy = https.createServer(options, function (request, response) {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path,
          protocol: parsed.protocol,
          rejectUnauthorized: false
        };

        https.get(opts, function (res) {
          var body = '';
          res.on('data', function (data) {
            body += data;
          });
          res.on('end', function () {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '6789');
          });
        });
      }).listen(4000, function () {
        process.env.https_proxy = 'https://localhost:4000/';

        axios.get('https://localhost:4444/', {
          httpsAgent: new https.Agent({
            rejectUnauthorized: false
          })
        }).then(function (res) {
          assert.equal(res.data, '123456789', 'should pass through proxy');
          done();
        }).catch(done);
      });
    });
  });

  it('should re-evaluate proxy on redirect when proxy set via env var', function (done) {
    process.env.http_proxy = 'http://localhost:4000'
    process.env.no_proxy = 'localhost:4000'

    var proxyUseCount = 0;

    server = http.createServer(function (req, res) {
      res.setHeader('Location', 'http://localhost:4000/redirected');
      res.statusCode = 302;
      res.end();
    }).listen(4444, function () {
      proxy = http.createServer(function (request, response) {
        var parsed = url.parse(request.url);
        if (parsed.pathname === '/redirected') {
          response.statusCode = 200;
          response.end();
          return;
        }

        proxyUseCount += 1;

        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path,
          protocol: parsed.protocol,
          rejectUnauthorized: false
        };

        http.get(opts, function (res) {
          var body = '';
          res.on('data', function (data) {
            body += data;
          });
          res.on('end', function () {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.setHeader('Location', res.headers.location);
            response.end(body);
          });
        });
      }).listen(4000, function () {
        axios.get('http://localhost:4444/').then(function(res) {
          assert.equal(res.status, 200);
          assert.equal(proxyUseCount, 1);
          done();
        }).catch(done);
      });
    });
  });

  it('should not use proxy for domains in no_proxy', function (done) {
    server = http.createServer(function (req, res) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end('4567');
    }).listen(4444, function () {
      proxy = http.createServer(function (request, response) {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };

        http.get(opts, function (res) {
          var body = '';
          res.on('data', function (data) {
            body += data;
          });
          res.on('end', function () {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '1234');
          });
        });

      }).listen(4000, function () {
        // set the env variable
        process.env.http_proxy = 'http://localhost:4000/';
        process.env.no_proxy = 'foo.com, localhost,bar.net , , quix.co';

        axios.get('http://localhost:4444/').then(function (res) {
          assert.equal(res.data, '4567', 'should not use proxy for domains in no_proxy');
          done();
        }).catch(done);
      });
    });
  });

  it('should use proxy for domains not in no_proxy', function (done) {
    server = http.createServer(function (req, res) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end('4567');
    }).listen(4444, function () {
      proxy = http.createServer(function (request, response) {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };

        http.get(opts, function (res) {
          var body = '';
          res.on('data', function (data) {
            body += data;
          });
          res.on('end', function () {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '1234');
          });
        });

      }).listen(4000, function () {
        // set the env variable
        process.env.http_proxy = 'http://localhost:4000/';
        process.env.no_proxy = 'foo.com, ,bar.net , quix.co';

        axios.get('http://localhost:4444/').then(function (res) {
          assert.equal(res.data, '45671234', 'should use proxy for domains not in no_proxy');
          done();
        }).catch(done);
      });
    });
  });

  it('should support HTTP proxy auth', function (done) {
    server = http.createServer(function (req, res) {
      res.end();
    }).listen(4444, function () {
      proxy = http.createServer(function (request, response) {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };
        var proxyAuth = request.headers['proxy-authorization'];

        http.get(opts, function (res) {
          var body = '';
          res.on('data', function (data) {
            body += data;
          });
          res.on('end', function () {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(proxyAuth);
          });
        });

      }).listen(4000, function () {
        axios.get('http://localhost:4444/', {
          proxy: {
            host: 'localhost',
            port: 4000,
            auth: {
              username: 'user',
              password: 'pass'
            }
          }
        }).then(function (res) {
          var base64 = Buffer.from('user:pass', 'utf8').toString('base64');
          assert.equal(res.data, 'Basic ' + base64, 'should authenticate to the proxy');
          done();
        }).catch(done);
      });
    });
  });

  it('should support proxy auth from env', function (done) {
    server = http.createServer(function (req, res) {
      res.end();
    }).listen(4444, function () {
      proxy = http.createServer(function (request, response) {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };
        var proxyAuth = request.headers['proxy-authorization'];

        http.get(opts, function (res) {
          var body = '';
          res.on('data', function (data) {
            body += data;
          });
          res.on('end', function () {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(proxyAuth);
          });
        });

      }).listen(4000, function () {
        process.env.http_proxy = 'http://user:pass@localhost:4000/';

        axios.get('http://localhost:4444/').then(function (res) {
          var base64 = Buffer.from('user:pass', 'utf8').toString('base64');
          assert.equal(res.data, 'Basic ' + base64, 'should authenticate to the proxy set by process.env.http_proxy');
          done();
        }).catch(done);
      });
    });
  });

  it('should support proxy auth with header', function (done) {
    server = http.createServer(function (req, res) {
      res.end();
    }).listen(4444, function () {
      proxy = http.createServer(function (request, response) {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };
        var proxyAuth = request.headers['proxy-authorization'];

        http.get(opts, function (res) {
          var body = '';
          res.on('data', function (data) {
            body += data;
          });
          res.on('end', function () {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(proxyAuth);
          });
        });

      }).listen(4000, function () {
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
        }).then(function (res) {
          var base64 = Buffer.from('user:pass', 'utf8').toString('base64');
          assert.equal(res.data, 'Basic ' + base64, 'should authenticate to the proxy');
          done();
        }).catch(done);
      });
    });
  });

  it('should support cancel', function (done) {
    var source = axios.CancelToken.source();
    server = http.createServer(function (req, res) {
      // call cancel() when the request has been sent, but a response has not been received
      source.cancel('Operation has been canceled.');
    }).listen(4444, function () {
      axios.get('http://localhost:4444/', {
        cancelToken: source.token
      }).catch(function (thrown) {
        assert.ok(thrown instanceof axios.Cancel, 'Promise must be rejected with a CanceledError object');
        assert.equal(thrown.message, 'Operation has been canceled.');
        done();
      });
    });
  });

  it('should combine baseURL and url', function (done) {
    server = http.createServer(function (req, res) {
      res.end();
    }).listen(4444, function () {
      axios.get('/foo', {
        baseURL: 'http://localhost:4444/',
      }).then(function (res) {
        assert.equal(res.config.baseURL, 'http://localhost:4444/');
        assert.equal(res.config.url, '/foo');
        done();
      }).catch(done);
    });
  });

  it('should support HTTP protocol', function (done) {
    server = http.createServer(function (req, res) {
      setTimeout(function () {
        res.end();
      }, 1000);
    }).listen(4444, function () {
      axios.get('http://localhost:4444')
        .then(function (res) {
          assert.equal(res.request.agent.protocol, 'http:');
          done();
        })
    })
  });

  it('should support HTTPS protocol', function (done) {
    server = http.createServer(function (req, res) {
      setTimeout(function () {
        res.end();
      }, 1000);
    }).listen(4444, function () {
      axios.get('https://www.google.com')
        .then(function (res) {
          assert.equal(res.request.agent.protocol, 'https:');
          done();
        })
    })
  });

  it('should return malformed URL', function (done) {
    var success = false, failure = false;
    var error;

    server = http.createServer(function (req, res) {
      setTimeout(function () {
        res.end();
      }, 1000);
    }).listen(4444, function () {
      axios.get('tel:484-695-3408')
        .then(function (res) {
          success = true;
        }).catch(function (err) {
          error = err;
          failure = true;
        })

      setTimeout(function () {
        assert.equal(success, false, 'request should not succeed');
        assert.equal(failure, true, 'request should fail');
        assert.equal(error.message, 'Unsupported protocol tel:');
        done();
      }, 300);
    })
  });

  it('should return unsupported protocol', function (done) {
    var success = false, failure = false;
    var error;

    server = http.createServer(function (req, res) {
      setTimeout(function () {
        res.end();
      }, 1000);
    }).listen(4444, function () {
      axios.get('ftp:google.com')
        .then(function (res) {
          success = true;
        }).catch(function (err) {
          error = err;
          failure = true;
        })

      setTimeout(function () {
        assert.equal(success, false, 'request should not succeed');
        assert.equal(failure, true, 'request should fail');
        assert.equal(error.message, 'Unsupported protocol ftp:');
        done();
      }, 300);
    })
  });

  it('should supply a user-agent if one is not specified', function (done) {
    server = http.createServer(function (req, res) {
      assert.equal(req.headers["user-agent"], 'axios/' + pkg.version);
      res.end();
    }).listen(4444, function () {
      axios.get('http://localhost:4444/'
      ).then(function (res) {
        done();
      }).catch(done);
    });
  });

  it('should omit a user-agent if one is explicitly disclaimed', function (done) {
    server = http.createServer(function (req, res) {
      assert.equal("user-agent" in req.headers, false);
      assert.equal("User-Agent" in req.headers, false);
      res.end();
    }).listen(4444, function () {
      axios.get('http://localhost:4444/', {
        headers: {
          "User-Agent": null
        }
      }).then(function (res) {
        done();
      }).catch(done);
    });
  });

  it('should throw an error if http server that aborts a chunked request', function (done) {
    server = http.createServer(function (req, res) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.write('chunk 1');
      setTimeout(function () {
        res.write('chunk 2');
      }, 100);
      setTimeout(function() {
        res.destroy();
      }, 200);
    }).listen(4444, function () {
      var success = false, failure = false;
      var error;

      axios.get('http://localhost:4444/aborted', {
        timeout: 500
      }).then(function (res) {
        success = true;
      }).catch(function (err) {
        error = err;
        failure = true;
      }).then(function () {
        assert.strictEqual(success, false, 'request should not succeed');
        assert.strictEqual(failure, true, 'request should fail');
        assert.strictEqual(error.code, 'ECONNABORTED');
        assert.strictEqual(error.message, 'response stream aborted');
        done();
      }).catch(done);
    });
  });

  it('should able to cancel multiple requests with CancelToken', function(done){
    server = http.createServer(function (req, res) {
      res.end('ok');
    }).listen(4444, function () {
      var CancelToken = axios.CancelToken;
      var source = CancelToken.source();
      var canceledStack = [];

      var requests = [1, 2, 3, 4, 5].map(function(id){
        return axios
          .get('/foo/bar', { cancelToken: source.token })
          .catch(function (e) {
            if (!axios.isCancel(e)) {
              throw e;
            }

            canceledStack.push(id);
          });
      });

      source.cancel("Aborted by user");

      Promise.all(requests).then(function () {
        assert.deepStrictEqual(canceledStack.sort(), [1, 2, 3, 4, 5])
      }).then(done, done);
    });
  });

  describe('FormData', function () {
    it('should allow passing FormData', function (done) {
      var form = new FormData();
      var file1 = Buffer.from('foo', 'utf8');

      form.append('foo', "bar");
      form.append('file1', file1, {
        filename: 'bar.jpg',
        filepath: 'temp/bar.jpg',
        contentType: 'image/jpeg'
      });

      server = http.createServer(function (req, res) {
        var receivedForm = new formidable.IncomingForm();

        receivedForm.parse(req, function (err, fields, files) {
          if (err) {
            return done(err);
          }

          res.end(JSON.stringify({
            fields: fields,
            files: files
          }));
        });
      }).listen(4444, function () {
        axios.post('http://localhost:4444/', form, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }).then(function (res) {
          assert.deepStrictEqual(res.data.fields, {foo: 'bar'});

          assert.strictEqual(res.data.files.file1.mimetype, 'image/jpeg');
          assert.strictEqual(res.data.files.file1.originalFilename, 'temp/bar.jpg');
          assert.strictEqual(res.data.files.file1.size, 3);

          done();
        }).catch(done);
      });
    });

    describe('toFormData helper', function () {
      it('should properly serialize nested objects for parsing with multer.js (express.js)', function (done) {
        var app = express();

        var obj = {
          arr1: ['1', '2', '3'],
          arr2: ['1', ['2'], '3'],
          obj: {x: '1', y: {z: '1'}},
          users: [{name: 'Peter', surname: 'griffin'}, {name: 'Thomas', surname: 'Anderson'}]
        };

        app.post('/', multer().none(), function (req, res, next) {
          res.send(JSON.stringify(req.body));
        });

        server = app.listen(3001, function () {
          // multer can parse the following key/value pairs to an array (indexes: null, false, true):
          // arr: '1'
          // arr: '2'
          // -------------
          // arr[]: '1'
          // arr[]: '2'
          // -------------
          // arr[0]: '1'
          // arr[1]: '2'
          // -------------
          Promise.all([null, false, true].map(function (mode) {
            return axios.postForm('http://localhost:3001/', obj, {formSerializer: {indexes: mode}})
              .then(function (res) {
                assert.deepStrictEqual(res.data, obj, 'Index mode ' + mode);
              });
          })).then(function (){
            done();
          }, done)
        });
      });
    });
  });

  describe('URLEncoded Form', function () {
    it('should post object data as url-encoded form if content-type is application/x-www-form-urlencoded', function (done) {
      var app = express();

      var obj = {
        arr1: ['1', '2', '3'],
        arr2: ['1', ['2'], '3'],
        obj: {x: '1', y: {z: '1'}},
        users: [{name: 'Peter', surname: 'griffin'}, {name: 'Thomas', surname: 'Anderson'}]
      };

      app.use(bodyParser.urlencoded({ extended: true }));

      app.post('/', function (req, res, next) {
        res.send(JSON.stringify(req.body));
      });

      server = app.listen(3001, function () {
        return axios.post('http://localhost:3001/', obj, {
          headers: {
            'content-type': 'application/x-www-form-urlencoded'
          }
        })
          .then(function (res) {
            assert.deepStrictEqual(res.data, obj);
            done();
          }).catch(done);
      });
    });
  });

  it('should respect formSerializer config', function (done) {
    const obj = {
      arr1: ['1', '2', '3'],
      arr2: ['1', ['2'], '3'],
    };

    const form = new URLSearchParams();

    form.append('arr1[0]', '1');
    form.append('arr1[1]', '2');
    form.append('arr1[2]', '3');

    form.append('arr2[0]', '1');
    form.append('arr2[1][0]', '2');
    form.append('arr2[2]', '3');

    server = http.createServer(function (req, res) {
      req.pipe(res);
    }).listen(3001, () => {
      return axios.post('http://localhost:3001/', obj, {
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        formSerializer: {
          indexes: true
        }
      })
        .then(function (res) {
          assert.strictEqual(res.data, form.toString());
          done();
        }).catch(done);
    });
  });

  describe('Data URL', function () {
    it('should support requesting data URL as a Buffer', function (done) {
      const buffer = Buffer.from('123');

      const dataURI = 'data:application/octet-stream;base64,' + buffer.toString('base64');

      axios.get(dataURI).then(({data})=> {
        assert.deepStrictEqual(data, buffer);
        done();
      }).catch(done);
    });

    it('should support requesting data URL as a Blob (if supported by the environment)', function (done) {

      if (!isBlobSupported) {
        this.skip();
        return;
      }

      const buffer = Buffer.from('123');

      const dataURI = 'data:application/octet-stream;base64,' + buffer.toString('base64');

      axios.get(dataURI, {responseType: 'blob'}).then(async ({data})=> {
        assert.strictEqual(data.type, 'application/octet-stream');
        assert.deepStrictEqual(await data.text(), '123');
        done();
      }).catch(done);
    });

    it('should support requesting data URL as a String (text)', function (done) {
      const buffer = Buffer.from('123', 'utf-8');

      const dataURI = 'data:application/octet-stream;base64,' + buffer.toString('base64');

      axios.get(dataURI, {responseType: "text"}).then(({data})=> {
        assert.deepStrictEqual(data, '123');
        done();
      }).catch(done);
    });

    it('should support requesting data URL as a Stream', function (done) {
      const buffer = Buffer.from('123', 'utf-8');

      const dataURI = 'data:application/octet-stream;base64,' + buffer.toString('base64');

      axios.get(dataURI, {responseType: "stream"}).then(({data})=> {
        var str = '';

        data.on('data', function(response){
          str += response.toString();
        });

        data.on('end', function(){
          assert.strictEqual(str, '123');
          done();
        });
      }).catch(done);
    });
  });

  it('should support function as paramsSerializer value', function (done) {
    server = http.createServer(function (req, res) {
      res.end('ok');
    }).listen(4444, function () {
      var data;

      axios.post('http://localhost:4444', 'test', {
        params: {
          x: 1
        },
        paramsSerializer: () => 'foo',
        maxRedirects: 0,
      }).then(function (res) {
        assert.strictEqual(res.request.path, '/?foo');
        data = res;
        done()
      }).catch(done);
    });
  });
});
