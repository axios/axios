// https://snyk.io/vuln/SNYK-JS-AXIOS-1038255
// https://github.com/axios/axios/issues/3407
// https://github.com/axios/axios/issues/3369

const axios = require('../../../index');
const http = require('http');
const assert = require('assert');

const PROXY_PORT = 4777;
const EVIL_PORT  = 4666;


describe('Server-Side Request Forgery (SSRF)', () => {
    let fail = false;
    let proxy;
    let server;
    beforeEach(() => {
        server = http.createServer(function (req, res) { 
            fail = true;
            res.end('rm -rf /');
        }).listen(EVIL_PORT);
        proxy = http.createServer(function (req, res) {
            if (req.host === 'www.google.com') {
              res.end('Googling');
            }
            res.writeHead(302, {location: 'http://localhost:' + EVIL_PORT})
            res.end()
        }).listen(PROXY_PORT);
    });
    afterEach(() => {
        server.close();
        proxy.close();
    });
    it('obeys proxy settings when following redirects', async () => {
        let response = await axios({
          method: "get",
          url: "http://www.google.com/",
          proxy: {
            host: "localhost",
            port: PROXY_PORT,
          },
        });

        assert.strictEqual(fail, false);
        assert.strictEqual(response.data, 'Googling');
        return response;
    
    });
});