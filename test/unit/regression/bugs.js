/* eslint-env mocha */
import assert from 'assert';
import http from 'http';
import axios from '../../../index.js';

describe('issues', function () {
  describe('4999', function () {
    it('should not fail with query parsing', async function () {
      const { data } = await axios.get('https://postman-echo.com/get?foo1=bar1&foo2=bar2');

      assert.strictEqual(data.args.foo1, 'bar1');
      assert.strictEqual(data.args.foo2, 'bar2');
    });
  });

  describe('5028', function () {
    it('should handle set-cookie headers as an array', async function () {
      const cookie1 =
        'something=else; path=/; expires=Wed, 12 Apr 2023 12:03:42 GMT; samesite=lax; secure; httponly';
      const cookie2 =
        'something-ssr.sig=n4MlwVAaxQAxhbdJO5XbUpDw-lA; path=/; expires=Wed, 12 Apr 2023 12:03:42 GMT; samesite=lax; secure; httponly';

      const server = http
        .createServer((req, res) => {
          //res.setHeader('Set-Cookie', 'my=value');
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

  describe('7364', function () {
    it('fetch: should have status code in axios error', async function () {
      const isFetchSupported = typeof fetch === 'function';
      if (!isFetchSupported) {
        this.skip();
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

    it('http: should have status code in axios error', async function () {
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
