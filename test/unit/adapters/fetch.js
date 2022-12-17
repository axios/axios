import axios from '../../../index.js';
import http from 'http';
import assert from 'assert';
import fetchAdapter from '../../../lib/adapters/fetch.js';
import AxiosError from '../../../lib/core/AxiosError.js';
import FormData from 'form-data';
import formidable from 'formidable';
import {startHTTPServer, LOCAL_SERVER_URL} from "./http-server-utils.js";

let server, proxy;


const axiosDefaults = {
  adapter: fetchAdapter,
};

function axiosOpts(overrides = {}) {
  return Object.assign({}, axiosDefaults, overrides);
}

describe('supports fetch with nodejs', function () {
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
      axios.get('http://localhost:4444/', axiosOpts()).then(function (res) {
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
      axios.get('http://localhost:4444/', axiosOpts()).then(function (res) {
        assert.deepEqual(res.data, data);
        done();
      }).catch(done);
    });
  });

  it('should be able to perform a basic GET', function (done) {
    server = http.createServer(function (req, res) {
      res.end("OK");
    }).listen(4444, function () {
      axios.get('http://localhost:4444/', axiosOpts()).then(function (res) {
        assert.equal(res.status, 200);
        done();
      }).catch(done);
    });
  });

  it('should be able to perform a basic POST', function (done) {
    const data = 'hello';
    let captured = null;

    server = http.createServer(function (req, res) {
      let body = '';
      req.on('data', chunk => {
          body += chunk.toString();
      });
      req.on('end', () => {
          captured = body;
          res.end('ok');
      });
      res.setHeader('Content-Type', 'text/plain');
      res.end("OK");
    }).listen(4444, function () {
      axios.post('http://localhost:4444/', data, axiosOpts()).then(function (res) {
        assert.equal(res.status, 200);
        assert.equal(captured, data);
        done();
      }).catch(done);
    });
  });
});
