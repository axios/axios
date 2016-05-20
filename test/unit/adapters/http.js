var axios = require('../../../index');
var http = require('http');
var url = require('url');
var zlib = require('zlib');
var fs = require('fs');
var server;

module.exports = {
  tearDown: function (callback) {
    server.close();
    server = null;
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
      }).catch(function (res) {
        error = res;
        failure = true;
      });

      setTimeout(function () {
        test.equal(success, false, 'request should not succeed');
        test.equal(failure, true, 'request should fail');
        test.equal(error.code, 'ECONNABORTED');
        test.equal(error.message, 'timeout of 250ms exceeded');
        test.equal(typeof error.config, 'object', 'error should have config');
        test.done();
      }, 300);
    });
  },

  testNonArrayNonStreamData: function(test) {
    server = http.createServer(function (req, res) {
      res.end('Something');
    }).listen(4444, function () {
      axios.get('http://localhost:4444/', {
        data: 42
      }).catch(function(error) {
        test.equal(error.message, 'Data after transformation must be a string, an ArrayBuffer, or a Stream');
        test.equal(typeof error.config, 'object', 'error should have config');
        test.done();
      });
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
        test.equal(typeof error.config, 'object', 'error should have config');
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
      axios.get('http://' + user + '@localhost:4444/').then(function (res) {
        var base64 = new Buffer(user + ':', 'utf8').toString('base64');
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
      }).catch(function (res) {
        error = res;
        failure = true;
      });

      setTimeout(function () {
        test.equal(success, false, 'request should not succeed');
        test.equal(failure, true, 'request should fail');
        test.equal(error.message, 'maxContentLength size of 2000 exceeded');
        test.equal(typeof error.config, 'object', 'error should have config');
        test.done();
      }, 100);
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
  }
};
