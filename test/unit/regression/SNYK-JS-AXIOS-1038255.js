// https://snyk.io/vuln/SNYK-JS-AXIOS-1038255
// https://github.com/axios/axios/issues/3407
// https://github.com/axios/axios/issues/3369

import axios from '../../../index.js';
import http from 'http';
import assert from 'assert';

const PROXY_PORT = 4777;
const EVIL_PORT = 4666;


describe('Server-Side Request Forgery (SSRF)', () => {
  let fail = false;
  let proxy;
  let server;
  let location;
  beforeEach(() => {
    server = http.createServer(function (req, res) {
      fail = true;
      res.end('rm -rf /');
    }).listen(EVIL_PORT);
    proxy = http.createServer(function (req, res) {
      if (req.url === 'http://localhost:' + EVIL_PORT + '/') {
        return res.end(JSON.stringify({
          msg: 'Protected',
          headers: req.headers,
        }));
      }
      res.writeHead(302, { location })
      res.end()
    }).listen(PROXY_PORT);
  });
  afterEach(() => {
    server.close();
    proxy.close();
  });
  it('obeys proxy settings when following redirects', async () => {
    location = 'http://localhost:' + EVIL_PORT;
    let response = await axios({
      method: "get",
      url: "http://www.google.com/",
      proxy: {
        host: "localhost",
        port: PROXY_PORT,
        auth: {
          username: 'sam',
          password: 'password',
        }
      },
    });

    assert.strictEqual(fail, false);
    assert.strictEqual(response.data.msg, 'Protected');
    assert.strictEqual(response.data.headers.host, 'localhost:' + EVIL_PORT);
    assert.strictEqual(response.data.headers['proxy-authorization'], 'Basic ' + Buffer.from('sam:password').toString('base64'));

    return response;

  });
});
