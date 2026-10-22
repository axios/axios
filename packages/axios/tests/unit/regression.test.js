/**
 * Combined regression tests (issues 4999, 5028, 7364 + SSRF SNYK-1038255, SNYK-7361793).
 */
import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import assert from 'assert';
import http from 'http';
import axios from '../../index.js';
import platform from '../../lib/platform/index.js';

describe('regression', () => {
  describe('issues', () => {
    describe('4999', () => {
      // Depends on network: https://postman-echo.com
      it('should not fail with query parsing', async () => {
        const { data } = await axios.get('https://postman-echo.com/get?foo1=bar1&foo2=bar2');

        assert.strictEqual(data.args.foo1, 'bar1');
        assert.strictEqual(data.args.foo2, 'bar2');
      });
    });

    describe('5028', () => {
      it('should handle set-cookie headers as an array', async () => {
        const cookie1 =
          'something=else; path=/; expires=Wed, 12 Apr 2023 12:03:42 GMT; samesite=lax; secure; httponly';
        const cookie2 =
          'something-ssr.sig=n4MlwVAaxQAxhbdJO5XbUpDw-lA; path=/; expires=Wed, 12 Apr 2023 12:03:42 GMT; samesite=lax; secure; httponly';

        const server = http
          .createServer((req, res) => {
            res.setHeader('Set-Cookie', [cookie1, cookie2]);
            res.writeHead(200);
            res.write('Hi there');
            res.end();
          })
          .listen(0);

        const request = axios.create();

        request.interceptors.response.use((res) => {
          assert.deepStrictEqual(res.headers['set-cookie'], [cookie1, cookie2]);
        });

        try {
          await request({ url: `http://localhost:${server.address().port}` });
        } finally {
          server.close();
        }
      });
    });

    describe('7364', () => {
      it('fetch: should have status code in axios error', async () => {
        const isFetchSupported = typeof fetch === 'function';
        if (!isFetchSupported) {
          vi.skip();
        }

        const server = http
          .createServer((req, res) => {
            res.statusCode = 400;
            res.end();
          })
          .listen(0);

        const instance = axios.create({
          baseURL: `http://localhost:${server.address().port}`,
          adapter: 'fetch',
        });

        try {
          await instance.get('/status/400');
        } catch (error) {
          assert.equal(error.name, 'AxiosError');
          assert.equal(error.isAxiosError, true);
          assert.equal(error.status, 400);
        } finally {
          server.close();
        }
      });

      it('http: should have status code in axios error', async () => {
        const server = http
          .createServer((req, res) => {
            res.statusCode = 400;
            res.end();
          })
          .listen(0);

        const instance = axios.create({
          baseURL: `http://localhost:${server.address().port}`,
          adapter: 'http',
        });

        try {
          await instance.get('/status/400');
        } catch (error) {
          assert.equal(error.name, 'AxiosError');
          assert.equal(error.isAxiosError, true);
          assert.equal(error.status, 400);
        } finally {
          server.close();
        }
      });
    });
  });

  // https://snyk.io/vuln/SNYK-JS-AXIOS-1038255
  // https://github.com/axios/axios/issues/3407
  // https://github.com/axios/axios/issues/3369
  describe('SSRF SNYK-JS-AXIOS-1038255', () => {
    let fail = false;
    let proxy;
    let server;
    let location;
    let evilPort;
    let proxyPort;

    beforeEach(() => {
      fail = false;
      server = http
        .createServer((req, res) => {
          fail = true;
          res.end('rm -rf /');
        })
        .listen(0);
      evilPort = server.address().port;

      proxy = http
        .createServer((req, res) => {
          if (
            new URL(req.url, 'http://' + req.headers.host).toString() ===
            'http://localhost:' + evilPort + '/'
          ) {
            return res.end(
              JSON.stringify({
                msg: 'Protected',
                headers: req.headers,
              })
            );
          }
          res.writeHead(302, { location });
          res.end();
        })
        .listen(0);
      proxyPort = proxy.address().port;
      location = 'http://localhost:' + evilPort;
    });

    afterEach(() => {
      server.close();
      proxy.close();
    });

    it('obeys proxy settings when following redirects', async () => {
      const response = await axios({
        method: 'get',
        url: 'http://www.google.com/',
        proxy: {
          host: 'localhost',
          port: proxyPort,
          auth: {
            username: 'sam',
            password: 'password',
          },
        },
      });

      assert.strictEqual(fail, false);
      assert.strictEqual(response.data.msg, 'Protected');
      assert.strictEqual(response.data.headers.host, 'localhost:' + evilPort);
      assert.strictEqual(
        response.data.headers['proxy-authorization'],
        'Basic ' + Buffer.from('sam:password').toString('base64')
      );

      return response;
    });
  });

  // https://security.snyk.io/vuln/SNYK-JS-AXIOS-7361793
  // https://github.com/axios/axios/issues/6463
  describe('SSRF SNYK-JS-AXIOS-7361793', () => {
    let goodServer;
    let badServer;
    let goodPort;
    let badPort;

    beforeEach(() => {
      goodServer = http
        .createServer((req, res) => {
          res.write('good');
          res.end();
        })
        .listen(0);
      goodPort = goodServer.address().port;

      badServer = http
        .createServer((req, res) => {
          res.write('bad');
          res.end();
        })
        .listen(0);
      badPort = badServer.address().port;
    });

    afterEach(() => {
      goodServer.close();
      badServer.close();
    });

    it('should not fetch in server-side mode', async () => {
      const ssrfAxios = axios.create({
        baseURL: 'http://localhost:' + String(goodPort),
      });

      const userId = '/localhost:' + String(badPort);

      try {
        await ssrfAxios.get(`/${userId}`);
      } catch (error) {
        assert.ok(error.message.startsWith('Invalid URL'));
        return;
      }
      assert.fail('Expected an error to be thrown');
    });

    describe('client-side mode', () => {
      let savedHasBrowserEnv;
      let savedOrigin;

      beforeEach(() => {
        assert.ok(platform.hasBrowserEnv !== undefined);
        savedHasBrowserEnv = platform.hasBrowserEnv;
        savedOrigin = platform.origin;
        platform.hasBrowserEnv = true;
        platform.origin = 'http://localhost:' + String(goodPort);
      });

      afterEach(() => {
        platform.hasBrowserEnv = savedHasBrowserEnv;
        platform.origin = savedOrigin;
      });

      it('resolves URL relative to origin and returns bad server body', async () => {
        const ssrfAxios = axios.create({
          baseURL: 'http://localhost:' + String(goodPort),
        });

        const userId = '/localhost:' + String(badPort);

        const response = await ssrfAxios.get(`/${userId}`);
        assert.strictEqual(response.data, 'bad');
        assert.strictEqual(response.config.baseURL, 'http://localhost:' + String(goodPort));
        assert.strictEqual(response.config.url, '//localhost:' + String(badPort));
        assert.strictEqual(
          response.request.res.responseUrl,
          'http://localhost:' + String(badPort) + '/'
        );
      });
    });
  });
});
