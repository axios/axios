import { describe, it } from 'vitest';
import assert from 'assert';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';
import axios from '../../../index.js';
import AxiosError from '../../../lib/core/AxiosError.js';
import http from 'http';
import stream from 'stream';

describe('supports http with nodejs', () => {
  it('should support IPv4 literal strings', async () => {
    const data = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com',
    };

    const server = await startHTTPServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    });

    try {
      const { data: responseData } = await axios.get(`http://127.0.0.1:${server.address().port}`);
      assert.deepStrictEqual(responseData, data);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support IPv6 literal strings', async () => {
    var data = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com',
    };

    const server = await startHTTPServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    });

    try {
      const { data: responseData } = await axios.get(`http://[::1]:${server.address().port}`, {
        proxy: false,
      });
      assert.deepStrictEqual(responseData, data);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should throw an error if the timeout property is not parsable as a number', async () => {
    const server = await startHTTPServer((req, res) => {
      setTimeout(() => {
        res.end();
      }, 1000);
    });

    try {
      await assert.rejects(
        axios.get(`http://127.0.0.1:${server.address().port}`, {
          timeout: { strangeTimeout: 250 },
        }),
        (error) => {
          assert.strictEqual(error.code, AxiosError.ERR_BAD_OPTION_VALUE);
          assert.strictEqual(error.message, 'error trying to parse `config.timeout` to int');
          return true;
        }
      );
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should parse the timeout property', async () => {
    const server = await startHTTPServer((req, res) => {
      setTimeout(() => {
        res.end();
      }, 1000);
    });

    try {
      await assert.rejects(
        axios.get(`http://127.0.0.1:${server.address().port}`, {
          timeout: '250',
        }),
        (error) => {
          assert.strictEqual(error.code, 'ECONNABORTED');
          assert.strictEqual(error.message, 'timeout of 250ms exceeded');
          return true;
        }
      );
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should respect the timeout property', async () => {
    const server = await startHTTPServer((req, res) => {
      setTimeout(() => {
        res.end();
      }, 1000);
    });

    try {
      await assert.rejects(
        axios.get(`http://127.0.0.1:${server.address().port}`, {
          timeout: 250,
        }),
        (error) => {
          assert.strictEqual(error.code, 'ECONNABORTED');
          assert.strictEqual(error.message, 'timeout of 250ms exceeded');
          return true;
        }
      );
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should respect the timeoutErrorMessage property', async () => {
    const server = await startHTTPServer((req, res) => {
      setTimeout(() => {
        res.end();
      }, 1000);
    });

    try {
      await assert.rejects(
        axios.get(`http://127.0.0.1:${server.address().port}`, {
          timeout: 250,
          timeoutErrorMessage: 'oops, timeout',
        }),
        (error) => {
          assert.strictEqual(error.code, 'ECONNABORTED');
          assert.strictEqual(error.message, 'oops, timeout');
          return true;
        }
      );
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should allow passing JSON', async () => {
    const data = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com',
    };

    const server = await startHTTPServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    });

    try {
      const { data: responseData } = await axios.get(`http://127.0.0.1:${server.address().port}`);
      assert.deepStrictEqual(responseData, data);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should allow passing JSON with BOM', async () => {
    const data = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com',
    };

    const server = await startHTTPServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      const bomBuffer = Buffer.from([0xef, 0xbb, 0xbf]);
      const jsonBuffer = Buffer.from(JSON.stringify(data));
      res.end(Buffer.concat([bomBuffer, jsonBuffer]));
    });

    try {
      const { data: responseData } = await axios.get(`http://127.0.0.1:${server.address().port}`);
      assert.deepStrictEqual(responseData, data);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should redirect', async () => {
    const expectedResponse = 'test response';
    const server = await startHTTPServer((req, res) => {
      if (req.url === '/one') {
        res.setHeader('Location', '/two');
        res.statusCode = 302;
        res.end();
        return;
      }

      res.end(expectedResponse);
    });

    try {
      const response = await axios.get(`http://127.0.0.1:${server.address().port}/one`, {
        maxRedirects: 1,
      });

      assert.strictEqual(response.data, expectedResponse);
      assert.strictEqual(response.request.path, '/two');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should not redirect', async () => {
    const server = await startHTTPServer((req, res) => {
      res.setHeader('Location', '/foo');
      res.statusCode = 302;
      res.end();
    });

    try {
      const response = await axios.get(`http://127.0.0.1:${server.address().port}/one`, {
        maxRedirects: 0,
      });

      assert.strictEqual(response.status, 302);
      assert.strictEqual(response.headers.location, '/foo');
    } catch (error) {
      assert.strictEqual(error.message, 'Request failed with status code 302');
      assert.strictEqual(error.response.status, 302);
      assert.strictEqual(error.response.headers.location, '/foo');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support max redirects', async () => {
    var i = 1;
    const server = await startHTTPServer((req, res) => {
      res.setHeader('Location', `/${i}`);
      res.statusCode = 302;
      res.end();
      i++;
    });

    try {
      await axios.get(`http://127.0.0.1:${server.address().port}`, {
        maxRedirects: 3,
      });
    } catch (error) {
      assert.strictEqual(error.code, AxiosError.ERR_FR_TOO_MANY_REDIRECTS);
      assert.strictEqual(error.message, 'Maximum number of redirects exceeded');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support beforeRedirect', async () => {
    const server = await startHTTPServer((req, res) => {
      res.setHeader('Location', '/foo');
      res.statusCode = 302;
      res.end();
    });

    try {
      await axios.get(`http://127.0.0.1:${server.address().port}/one`, {
        maxRedirects: 3,
        beforeRedirect: (options, responseDetails) => {
          if (options.path === '/foo' && responseDetails.headers.location === '/foo') {
            throw new Error('Provided path is not allowed');
          }
        },
      });
    } catch (error) {
      assert.strictEqual(error.message, 'Redirected request failed: Provided path is not allowed');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support beforeRedirect and proxy with redirect', async () => {
    let requestCount = 0;
    let proxyUseCount = 0;
    let totalRedirectCount = 5;
    let configBeforeRedirectCount = 0;

    const server = await startHTTPServer((req, res) => {
      requestCount += 1;
      if (requestCount <= totalRedirectCount) {
        res.setHeader('Location', 'http://127.0.0.1:4444');
        res.writeHead(302);
      }
      res.end();
    });

    const proxy = await startHTTPServer(
      (req, res) => {
        proxyUseCount += 1;
        const targetUrl = new URL(req.url, 'http://' + req.headers.host);
        const opts = {
          host: targetUrl.hostname,
          port: targetUrl.port,
          path: targetUrl.path,
          method: req.method,
        };

        const request = http.get(opts, (response) => {
          res.writeHead(response.statusCode, response.headers);
          stream.pipeline(response, res, () => {});
        });

        request.on('error', (err) => {
          console.warn('request error', err);
          res.statusCode = 500;
          res.end();
        });
      },
      { port: 4000 }
    );

    await axios.get(`http://localhost:${server.address().port}/`, {
      proxy: {
        host: 'localhost',
        port: 4000,
      },
      maxRedirects: totalRedirectCount,
      beforeRedirect: (options) => {
        configBeforeRedirectCount += 1;
      },
    });

    assert.strictEqual(totalRedirectCount, configBeforeRedirectCount);
    assert.strictEqual(totalRedirectCount + 1, proxyUseCount);

    await stopHTTPServer(server);
    await stopHTTPServer(proxy);
  });

  it('should wrap HTTP errors and keep stack', async () => {
    const server = await startHTTPServer((req, res) => {
      res.statusCode = 400;
      res.end();
    });

    try {
      await assert.rejects(
        async function stackTraceTest() {
          await axios.get(`http://localhost:${server.address().port}/`);
        },
        (error) => {
          const matches = [...error.stack.matchAll(/stackTraceTest/g)];

          assert.strictEqual(error.name, 'AxiosError');
          assert.strictEqual(error.isAxiosError, true);
          assert.strictEqual(error.code, AxiosError.ERR_BAD_REQUEST);
          assert.strictEqual(error.message, 'Request failed with status code 400');
          assert.strictEqual(matches.length, 1, error.stack);

          return true;
        }
      );
    } finally {
      await stopHTTPServer(server);
    }
  });
});
