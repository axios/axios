var axios = require('../../../index');
var http = require('http');
var zlib = require('zlib');
var server;

module.exports = {
  tearDown: function (callback) {
    server.close();
    server = null;
    callback();
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
  }
};
