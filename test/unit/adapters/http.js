var axios = require('../../../index');
var http = require('http');
var net = require('net');
var url = require('url');
var zlib = require('zlib');
var assert = require('assert');
var fs = require('fs');
var server, proxy;

describe('supports http with nodejs', () => {

  afterEach(() => {
    if (server) {
      server.close();
      server = null;
    }
    if (proxy) {
      proxy.close()
      proxy = null;
    }
    if (process.env.http_proxy) {
      delete process.env.http_proxy;
    }
    if (process.env.no_proxy) {
      delete process.env.no_proxy;
    }
  });

  it('should respect the timeout property', done => {

    server = http.createServer((req, res) => {
      setTimeout(() => {
        res.end();
      }, 1000);
    }).listen(4444, () => {
      var success = false, failure = false;
      var error;

      axios.get('http://localhost:4444/', {
        timeout: 250
      }).then(res => {
        success = true;
      }).catch(err => {
        error = err;
        failure = true;
      });

      setTimeout(() => {
        assert.equal(success, false, 'request should not succeed');
        assert.equal(failure, true, 'request should fail');
        assert.equal(error.code, 'ECONNABORTED');
        assert.equal(error.message, 'timeout of 250ms exceeded');
        done();
      }, 300);
    });
  });

  it('should allow passing JSON', done => {
    var data = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com'
    };

    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json;charset=utf-8');
      res.end(JSON.stringify(data));
    }).listen(4444, () => {
      axios.get('http://localhost:4444/').then(res => {
        assert.deepEqual(res.data, data);
        done();
      });
    });
  });

  it('should redirect', done => {
    var str = 'test response';

    server = http.createServer((req, res) => {
      var parsed = url.parse(req.url);

      if (parsed.pathname === '/one') {
        res.setHeader('Location', '/two');
        res.statusCode = 302;
        res.end();
      } else {
        res.end(str);
      }
    }).listen(4444, () => {
      axios.get('http://localhost:4444/one').then(res => {
        assert.equal(res.data, str);
        assert.equal(res.request.path, '/two');
        done();
      });
    });
  });

  it('should not redirect', done => {
    server = http.createServer((req, res) => {
      res.setHeader('Location', '/foo');
      res.statusCode = 302;
      res.end();
    }).listen(4444, () => {
      axios.get('http://localhost:4444/', {
        maxRedirects: 0,
        validateStatus: () => true
      }).then(res => {
        assert.equal(res.status, 302);
        assert.equal(res.headers['location'], '/foo');
        done();
      });
    });
  });

  it('should support max redirects', done => {
    var i = 1;
    server = http.createServer((req, res) => {
      res.setHeader('Location', '/' + i);
      res.statusCode = 302;
      res.end();
      i++;
    }).listen(4444, () => {
      axios.get('http://localhost:4444/', {
        maxRedirects: 3
      }).catch(error => {
        done();
      });
    });
  });

  it('should preserve the HTTP verb on redirect', done => {
    server = http.createServer((req, res) => {
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
    }).listen(4444, () => {
      axios.head('http://localhost:4444/one').then(res => {
        assert.equal(res.status, 200);
        done();
      }).catch(err => {
        done(err);
      });
    });
  });

  it('should support transparent gunzip', done => {
    var data = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com'
    };

    zlib.gzip(JSON.stringify(data), (err, zipped) => {

      server = http.createServer((req, res) => {
        res.setHeader('Content-Type', 'application/json;charset=utf-8');
        res.setHeader('Content-Encoding', 'gzip');
        res.end(zipped);
      }).listen(4444, () => {
        axios.get('http://localhost:4444/').then(res => {
          assert.deepEqual(res.data, data);
          done();
        });
      });

    });
  });

  it('should support gunzip error handling', done => {
    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json;charset=utf-8');
      res.setHeader('Content-Encoding', 'gzip');
      res.end('invalid response');
    }).listen(4444, () => {
      axios.get('http://localhost:4444/').catch(error => {
        done();
      });
    });
  });

  it('should support UTF8', done => {
    var str = Array(100000).join('ж');

    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end(str);
    }).listen(4444, () => {
      axios.get('http://localhost:4444/').then(res => {
        assert.equal(res.data, str);
        done();
      });
    });
  });

  it('should support basic auth', done => {
    server = http.createServer((req, res) => {
      res.end(req.headers.authorization);
    }).listen(4444, () => {
      var user = 'foo';
      var headers = { Authorization: 'Bearer 1234' };
      axios.get('http://' + user + '@localhost:4444/', { headers: headers }).then(res => {
        var base64 = Buffer.from(user + ':', 'utf8').toString('base64');
        assert.equal(res.data, 'Basic ' + base64);
        done();
      });
    });
  });

  it('should support basic auth with a header', done => {
    server = http.createServer((req, res) => {
      res.end(req.headers.authorization);
    }).listen(4444, () => {
      var auth = { username: 'foo', password: 'bar' };
      var headers = { Authorization: 'Bearer 1234' };
      axios.get('http://localhost:4444/', { auth: auth, headers: headers }).then(res => {
        var base64 = Buffer.from('foo:bar', 'utf8').toString('base64');
        assert.equal(res.data, 'Basic ' + base64);
        done();
      });
    });
  });

  it('should support max content length', done => {
    var str = Array(100000).join('ж');

    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end(str);
    }).listen(4444, () => {
      var success = false, failure = false, error;

      axios.get('http://localhost:4444/', {
        maxContentLength: 2000
      }).then(res => {
        success = true;
      }).catch(err => {
        error = err;
        failure = true;
      });

      setTimeout(() => {
        assert.equal(success, false, 'request should not succeed');
        assert.equal(failure, true, 'request should fail');
        assert.equal(error.message, 'maxContentLength size of 2000 exceeded');
        done();
      }, 100);
    });
  });

  it.skip('should support sockets', done => {
    server = net.createServer(socket => {
      socket.on('data', () => {
        socket.end('HTTP/1.1 200 OK\r\n\r\n');
      });
    }).listen('./test.sock', () => {
      axios({
        socketPath: './test.sock',
        url: '/'
      })
        .then(resp => {
          assert.equal(resp.status, 200);
          assert.equal(resp.statusText, 'OK');
          done();
        })
        .catch(error => {
          assert.ifError(error);
          done();
        });
    });
  });

  it('should support streams', done => {
    server = http.createServer((req, res) => {
      req.pipe(res);
    }).listen(4444, () => {
      axios.post('http://localhost:4444/',
        fs.createReadStream(__filename), {
          responseType: 'stream'
        }).then(res => {
          var stream = res.data;
          var string = '';
          stream.on('data', chunk => {
            string += chunk.toString('utf8');
          });
          stream.on('end', () => {
            assert.equal(string, fs.readFileSync(__filename, 'utf8'));
            done();
          });
        });
    });
  });

  it('should pass errors for a failed stream', done => {
    server = http.createServer((req, res) => {
      req.pipe(res);
    }).listen(4444, () => {
      axios.post('http://localhost:4444/',
        fs.createReadStream('/does/not/exist')
      ).then(res => {
        assert.fail();
      }).catch(err => {
        assert.equal(err.message, 'ENOENT: no such file or directory, open \'/does/not/exist\'');
        done();
      });
    });
  });

  it('should support buffers', done => {
    var buf = Buffer.alloc(1024, 'x'); // Unsafe buffer < Buffer.poolSize (8192 bytes)
    server = http.createServer((req, res) => {
      assert.equal(req.headers['content-length'], buf.length.toString());
      req.pipe(res);
    }).listen(4444, () => {
      axios.post('http://localhost:4444/',
        buf, {
          responseType: 'stream'
        }).then(res => {
          var stream = res.data;
          var string = '';
          stream.on('data', chunk => {
            string += chunk.toString('utf8');
          });
          stream.on('end', () => {
            assert.equal(string, buf.toString());
            done();
          });
        });
    });
  });

  it('should support HTTP proxies', done => {
    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end('12345');
    }).listen(4444, () => {
      proxy = http.createServer((request, response) => {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };

        http.get(opts, res => {
          var body = '';
          res.on('data', data => {
            body += data;
          });
          res.on('end', () => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '6789');
          });
        });

      }).listen(4000, () => {
        axios.get('http://localhost:4444/', {
          proxy: {
            host: 'localhost',
            port: 4000
          }
        }).then(res => {
          assert.equal(res.data, '123456789', 'should pass through proxy');
          done();
        });
      });
    });
  });

  it('should not pass through disabled proxy', done => {
    // set the env variable
    process.env.http_proxy = 'http://does-not-exists.example.com:4242/';

    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end('123456789');
    }).listen(4444, () => {
      axios.get('http://localhost:4444/', {
        proxy: false
      }).then(res => {
        assert.equal(res.data, '123456789', 'should not pass through proxy');
        done();
      });
    });
  });

  it('should support proxy set via env var', done => {
    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end('4567');
    }).listen(4444, () => {
      proxy = http.createServer((request, response) => {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };

        http.get(opts, res => {
          var body = '';
          res.on('data', data => {
            body += data;
          });
          res.on('end', () => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '1234');
          });
        });

      }).listen(4000, () => {
        // set the env variable
        process.env.http_proxy = 'http://localhost:4000/';

        axios.get('http://localhost:4444/').then(res => {
          assert.equal(res.data, '45671234', 'should use proxy set by process.env.http_proxy');
          done();
        });
      });
    });
  });

  it('should not use proxy for domains in no_proxy', done => {
    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end('4567');
    }).listen(4444, () => {
      proxy = http.createServer((request, response) => {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };

        http.get(opts, res => {
          var body = '';
          res.on('data', data => {
            body += data;
          });
          res.on('end', () => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '1234');
          });
        });

      }).listen(4000, () => {
        // set the env variable
        process.env.http_proxy = 'http://localhost:4000/';
        process.env.no_proxy = 'foo.com, localhost,bar.net , , quix.co';

        axios.get('http://localhost:4444/').then(res => {
          assert.equal(res.data, '4567', 'should not use proxy for domains in no_proxy');
          done();
        });
      });
    });
  });

  it('should use proxy for domains not in no_proxy', done => {
    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end('4567');
    }).listen(4444, () => {
      proxy = http.createServer((request, response) => {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };

        http.get(opts, res => {
          var body = '';
          res.on('data', data => {
            body += data;
          });
          res.on('end', () => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '1234');
          });
        });

      }).listen(4000, () => {
        // set the env variable
        process.env.http_proxy = 'http://localhost:4000/';
        process.env.no_proxy = 'foo.com, ,bar.net , quix.co';

        axios.get('http://localhost:4444/').then(res => {
          assert.equal(res.data, '45671234', 'should use proxy for domains not in no_proxy');
          done();
        });
      });
    });
  });

  it('should support HTTP proxy auth', done => {
    server = http.createServer((req, res) => {
      res.end();
    }).listen(4444, () => {
      proxy = http.createServer((request, response) => {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };
        var proxyAuth = request.headers['proxy-authorization'];

        http.get(opts, res => {
          var body = '';
          res.on('data', data => {
            body += data;
          });
          res.on('end', () => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(proxyAuth);
          });
        });

      }).listen(4000, () => {
        axios.get('http://localhost:4444/', {
          proxy: {
            host: 'localhost',
            port: 4000,
            auth: {
              username: 'user',
              password: 'pass'
            }
          }
        }).then(res => {
          var base64 = Buffer.from('user:pass', 'utf8').toString('base64');
          assert.equal(res.data, 'Basic ' + base64, 'should authenticate to the proxy');
          done();
        });
      });
    });
  });

  it('should support proxy auth from env', done => {
    server = http.createServer((req, res) => {
      res.end();
    }).listen(4444, () => {
      proxy = http.createServer((request, response) => {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };
        var proxyAuth = request.headers['proxy-authorization'];

        http.get(opts, res => {
          var body = '';
          res.on('data', data => {
            body += data;
          });
          res.on('end', () => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(proxyAuth);
          });
        });

      }).listen(4000, () => {
        process.env.http_proxy = 'http://user:pass@localhost:4000/';

        axios.get('http://localhost:4444/').then(res => {
          var base64 = Buffer.from('user:pass', 'utf8').toString('base64');
          assert.equal(res.data, 'Basic ' + base64, 'should authenticate to the proxy set by process.env.http_proxy');
          done();
        });
      });
    });
  });

  it('should support proxy auth with header', done => {
    server = http.createServer((req, res) => {
      res.end();
    }).listen(4444, () => {
      proxy = http.createServer((request, response) => {
        var parsed = url.parse(request.url);
        var opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.path
        };
        var proxyAuth = request.headers['proxy-authorization'];

        http.get(opts, res => {
          var body = '';
          res.on('data', data => {
            body += data;
          });
          res.on('end', () => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(proxyAuth);
          });
        });

      }).listen(4000, () => {
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
        }).then(res => {
          var base64 = Buffer.from('user:pass', 'utf8').toString('base64');
          assert.equal(res.data, 'Basic ' + base64, 'should authenticate to the proxy');
          done();
        });
      });
    });
  });

  it('should support cancel', done => {
    var source = axios.CancelToken.source();
    server = http.createServer((req, res) => {
      // call cancel() when the request has been sent, but a response has not been received
      source.cancel('Operation has been canceled.');
    }).listen(4444, () => {
      axios.get('http://localhost:4444/', {
        cancelToken: source.token
      }).catch(thrown => {
        assert.ok(thrown instanceof axios.Cancel, 'Promise must be rejected with a Cancel obejct');
        assert.equal(thrown.message, 'Operation has been canceled.');
        done();
      });
    });
  });
});


