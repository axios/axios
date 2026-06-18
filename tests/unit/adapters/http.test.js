import { describe, it } from 'vitest';
import assert from 'assert';
import {
  startHTTPServer,
  stopHTTPServer,
  SERVER_HANDLER_STREAM_ECHO,
  handleFormData,
  setTimeoutAsync,
  generateReadable,
} from '../../setup/server.js';
import axios from '../../../index.js';
import AxiosError from '../../../lib/core/AxiosError.js';
import httpAdapter, {
  __isNodeEnvProxyEnabled,
  __isSameOriginRedirect,
  __setProxy,
} from '../../../lib/adapters/http.js';
import HttpsProxyAgent from 'https-proxy-agent';
import http from 'http';
import https from 'https';
import net from 'net';
import stream from 'stream';
import zlib from 'zlib';
import fs from 'fs';
import os from 'os';
import path from 'path';
import devNull from 'dev-null';
import FormDataLegacy from 'form-data';
import { IncomingForm } from 'formidable';
import { FormData as FormDataPolyfill, Blob as BlobPolyfill } from 'formdata-node';
import express from 'express';
import multer from 'multer';
import getStream from 'get-stream';
import bodyParser from 'body-parser';
import { AbortController } from 'abortcontroller-polyfill/dist/cjs-ponyfill.js';
import { lookup } from 'dns';
import { EventEmitter } from 'events';

const OPEN_WEB_PORT = 80;
const SERVER_PORT = 8020;
const PROXY_PORT = 8030;
const ALTERNATE_SERVER_PORT = 8040;

describe('supports http with nodejs', () => {
  const adaptersTestsDir = path.join(process.cwd(), 'tests/unit/adapters');
  const thisTestFilePath = path.join(adaptersTestsDir, 'http.test.js');
  const FormDataSpecCompliant = typeof FormData !== 'undefined' ? FormData : FormDataPolyfill;
  const BlobSpecCompliant = typeof Blob !== 'undefined' ? Blob : BlobPolyfill;
  const isBlobSupported = typeof Blob !== 'undefined';

  function toleranceRange(positive, negative) {
    const p = 1 + positive / 100;
    const n = 1 - negative / 100;

    return (actualValue, value) => {
      return actualValue > value ? actualValue <= value * p : actualValue >= value * n;
    };
  }

  class HangingConnectSocket extends stream.Duplex {
    constructor() {
      super();
      this.connecting = true;
    }

    _read() {}

    _write(_chunk, _encoding, callback) {
      callback();
    }

    setKeepAlive() {
      return this;
    }

    setNoDelay() {
      return this;
    }

    setTimeout() {
      return this;
    }
  }

  class HangingConnectAgent extends http.Agent {
    createConnection() {
      return new HangingConnectSocket();
    }
  }

  it('should support IPv4 literal strings', async () => {
    const data = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com',
    };

    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      },
      { port: SERVER_PORT }
    );

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

    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      },
      { port: SERVER_PORT }
    );

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
    const server = await startHTTPServer(
      (req, res) => {
        setTimeout(() => {
          res.end();
        }, 1000);
      },
      { port: SERVER_PORT }
    );

    try {
      await assert.rejects(
        axios.get(`http://localhost:${server.address().port}`, {
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

  it('should sanitize request headers containing CRLF characters', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            xTest: req.headers['x-test'],
            injected: req.headers.injected ?? null,
          })
        );
      },
      { port: SERVER_PORT }
    );

    try {
      const { data } = await axios.get(`http://localhost:${server.address().port}/`, {
        headers: {
          'x-test': '\tok\r\nInjected: yes ',
        },
      });

      assert.strictEqual(data.xTest, 'okInjected: yes');
      assert.strictEqual(data.injected, null);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should allow request interceptors to encode Unicode header values before Node sends them', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            oprtName: req.headers.oprtname,
          })
        );
      },
      { port: SERVER_PORT }
    );

    const instance = axios.create({ proxy: false });

    instance.interceptors.request.use((config) => {
      config.headers.oprtName = encodeURIComponent(config.headers.oprtName);
      return config;
    });

    try {
      const { data } = await instance.get(`http://localhost:${server.address().port}/`, {
        headers: {
          oprtName: '请求用户',
        },
      });

      assert.strictEqual(data.oprtName, encodeURIComponent('请求用户'));
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should sanitize unencoded Unicode request headers before passing them to Node', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            xTest: req.headers['x-test'],
          })
        );
      },
      { port: SERVER_PORT }
    );

    try {
      const { data } = await axios.get(`http://localhost:${server.address().port}/`, {
        proxy: false,
        headers: {
          'x-test': '请求用户',
        },
      });

      assert.strictEqual(data.xTest, '');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should parse the timeout property', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        setTimeout(() => {
          res.end();
        }, 1000);
      },
      { port: SERVER_PORT }
    );

    try {
      await assert.rejects(
        axios.get(`http://localhost:${server.address().port}`, {
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
    const server = await startHTTPServer(
      (req, res) => {
        setTimeout(() => {
          res.end();
        }, 1000);
      },
      { port: SERVER_PORT }
    );

    try {
      await assert.rejects(
        axios.get(`http://localhost:${server.address().port}`, {
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

  it('should respect the timeout property during TCP connect with maxRedirects set to 0', async () => {
    const timeout = 100;
    const guardTimeout = 1000;
    const started = Date.now();
    const controller = new AbortController();
    const agent = new HangingConnectAgent();
    let guardTimer;
    const request = axios.get('http://connect-timeout.test/', {
      httpAgent: agent,
      maxRedirects: 0,
      proxy: false,
      signal: controller.signal,
      timeout,
    });
    const guard = new Promise((_resolve, reject) => {
      guardTimer = setTimeout(() => {
        controller.abort();
        reject(new Error('request did not honor timeout during connect'));
      }, guardTimeout);
    });

    try {
      await assert.rejects(Promise.race([request, guard]), (error) => {
        const elapsed = Date.now() - started;
        assert.strictEqual(error.code, 'ECONNABORTED');
        assert.strictEqual(error.message, `timeout of ${timeout}ms exceeded`);
        assert.ok(elapsed < guardTimeout, `request timed out after ${elapsed}ms`);
        return true;
      });
    } finally {
      clearTimeout(guardTimer);
      controller.abort();
      agent.destroy();
    }
  });

  it('should not time out immediately for timeout set to zero during TCP connect', async () => {
    const controller = new AbortController();
    const agent = new HangingConnectAgent();
    const request = axios
      .get('http://connect-timeout.test/', {
        httpAgent: agent,
        maxRedirects: 0,
        proxy: false,
        signal: controller.signal,
        timeout: '0',
      })
      .then(
        () => null,
        (error) => error
      );

    try {
      await setTimeoutAsync(50);
      controller.abort();
      const error = await request;
      assert.strictEqual(error.code, AxiosError.ERR_CANCELED);
    } finally {
      controller.abort();
      agent.destroy();
    }
  });

  it('should respect the timeoutErrorMessage property', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        setTimeout(() => {
          res.end();
        }, 1000);
      },
      { port: SERVER_PORT }
    );

    try {
      await assert.rejects(
        axios.get(`http://localhost:${server.address().port}`, {
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

    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      },
      { port: SERVER_PORT }
    );

    try {
      const { data: responseData } = await axios.get(`http://localhost:${server.address().port}`);
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

    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        const bomBuffer = Buffer.from([0xef, 0xbb, 0xbf]);
        const jsonBuffer = Buffer.from(JSON.stringify(data));
        res.end(Buffer.concat([bomBuffer, jsonBuffer]));
      },
      { port: SERVER_PORT }
    );

    try {
      const { data: responseData } = await axios.get(`http://localhost:${server.address().port}`);
      assert.deepStrictEqual(responseData, data);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should redirect', async () => {
    const expectedResponse = 'test response';
    const server = await startHTTPServer(
      (req, res) => {
        if (req.url === '/one') {
          res.setHeader('Location', '/two');
          res.statusCode = 302;
          res.end();
          return;
        }

        res.end(expectedResponse);
      },
      { port: SERVER_PORT }
    );

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/one`, {
        maxRedirects: 1,
      });

      assert.strictEqual(response.data, expectedResponse);
      assert.strictEqual(response.request.path, '/two');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should not redirect', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Location', '/foo');
        res.statusCode = 302;
        res.end();
      },
      { port: SERVER_PORT }
    );

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/one`, {
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
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Location', `/${i}`);
        res.statusCode = 302;
        res.end();
        i++;
      },
      { port: SERVER_PORT }
    );

    try {
      await axios.get(`http://localhost:${server.address().port}`, {
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
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Location', '/foo');
        res.statusCode = 302;
        res.end();
      },
      { port: SERVER_PORT }
    );

    try {
      await axios.get(`http://localhost:${server.address().port}/one`, {
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

  it('should pass requestDetails to beforeRedirect with the original URL', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Location', '/foo');
        res.statusCode = 302;
        res.end();
      },
      { port: SERVER_PORT }
    );

    const originalUrl = `http://localhost:${server.address().port}/bar`;
    let capturedUrl;

    try {
      await axios.get(originalUrl, {
        maxRedirects: 3,
        beforeRedirect: (options, responseDetails, requestDetails) => {
          if (options.path === '/foo' && responseDetails.headers.location === '/foo') {
            capturedUrl = requestDetails.url;
            throw new Error('Provided path is not allowed');
          }
        },
      });
    } catch (error) {
      assert.strictEqual(error.message, 'Redirected request failed: Provided path is not allowed');
      assert.strictEqual(capturedUrl, originalUrl);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support beforeRedirect and proxy with redirect', async () => {
    let requestCount = 0;
    let proxyUseCount = 0;
    let totalRedirectCount = 5;
    let configBeforeRedirectCount = 0;

    const server = await startHTTPServer(
      (req, res) => {
        requestCount += 1;
        if (requestCount <= totalRedirectCount) {
          res.setHeader('Location', `http://localhost:${SERVER_PORT}`);
          res.writeHead(302);
        }
        res.end();
      },
      { port: SERVER_PORT }
    );

    const proxy = await startHTTPServer(
      (req, res) => {
        proxyUseCount += 1;
        const targetUrl = new URL(req.url, `http://localhost:${server.address().port}`);
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
      { port: PROXY_PORT }
    );

    await axios.get(`http://localhost:${server.address().port}/`, {
      proxy: {
        host: 'localhost',
        port: PROXY_PORT,
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

  it('should strip sensitiveHeaders on cross-origin redirect', async () => {
    let capturedHeaders;

    // destination server — different port means different origin
    const destination = await startHTTPServer((req, res) => {
      capturedHeaders = req.headers;
      res.statusCode = 200;
      res.end('ok');
    });

    // origin server — redirects to destination (cross-origin)
    const origin = await startHTTPServer((req, res) => {
      res.setHeader('Location', `http://localhost:${destination.address().port}/dest`);
      res.statusCode = 302;
      res.end();
    });

    try {
      await axios.get(`http://localhost:${origin.address().port}/src`, {
        maxRedirects: 5,
        headers: { 'X-API-Key': 'secret', 'X-Other': 'keep' },
        sensitiveHeaders: ['X-API-Key'],
      });

      assert.strictEqual(capturedHeaders['x-api-key'], undefined, 'X-API-Key should be stripped');
      assert.strictEqual(capturedHeaders['x-other'], 'keep', 'X-Other should be preserved');
    } finally {
      await stopHTTPServer(origin);
      await stopHTTPServer(destination);
    }
  });

  it('should preserve sensitiveHeaders on same-origin redirect', async () => {
    let capturedHeaders;
    let requestCount = 0;

    const server = await startHTTPServer((req, res) => {
      requestCount++;
      if (requestCount === 1) {
        res.setHeader('Location', '/dest');
        res.statusCode = 302;
        res.end();
      } else {
        capturedHeaders = req.headers;
        res.statusCode = 200;
        res.end('ok');
      }
    });

    try {
      await axios.get(`http://localhost:${server.address().port}/src`, {
        maxRedirects: 5,
        headers: { 'X-API-Key': 'secret' },
        sensitiveHeaders: ['X-API-Key'],
      });

      assert.strictEqual(capturedHeaders['x-api-key'], 'secret', 'X-API-Key should be preserved on same-origin redirect');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should strip sensitiveHeaders case-insensitively on cross-origin redirect', async () => {
    let capturedHeaders;

    const destination = await startHTTPServer((req, res) => {
      capturedHeaders = req.headers;
      res.statusCode = 200;
      res.end('ok');
    });

    const origin = await startHTTPServer((req, res) => {
      res.setHeader('Location', `http://localhost:${destination.address().port}/dest`);
      res.statusCode = 302;
      res.end();
    });

    try {
      await axios.get(`http://localhost:${origin.address().port}/src`, {
        maxRedirects: 5,
        // Header sent with mixed casing; sensitiveHeaders list uses different casing
        headers: { 'X-Api-Key': 'secret' },
        sensitiveHeaders: ['x-api-key'],
      });

      assert.strictEqual(capturedHeaders['x-api-key'], undefined, 'X-Api-Key should be stripped case-insensitively');
    } finally {
      await stopHTTPServer(origin);
      await stopHTTPServer(destination);
    }
  });

  it('should strip sensitiveHeaders configured on an instance', async () => {
    let capturedHeaders;

    const destination = await startHTTPServer((req, res) => {
      capturedHeaders = req.headers;
      res.statusCode = 200;
      res.end('ok');
    });

    const origin = await startHTTPServer((req, res) => {
      res.setHeader('Location', `http://localhost:${destination.address().port}/dest`);
      res.statusCode = 302;
      res.end();
    });

    const client = axios.create({
      headers: { 'X-API-Key': 'secret', 'X-Other': 'keep' },
      sensitiveHeaders: ['X-API-Key'],
    });

    try {
      await client.get(`http://localhost:${origin.address().port}/src`, {
        maxRedirects: 5,
      });

      assert.strictEqual(capturedHeaders['x-api-key'], undefined, 'X-API-Key should be stripped');
      assert.strictEqual(capturedHeaders['x-other'], 'keep', 'X-Other should be preserved');
    } finally {
      await stopHTTPServer(origin);
      await stopHTTPServer(destination);
    }
  });

  it('should reject invalid sensitiveHeaders config', async () => {
    await assert.rejects(
      axios.get('http://localhost:1/', { sensitiveHeaders: 'X-API-Key' }),
      (error) => {
        assert.strictEqual(error.code, AxiosError.ERR_BAD_OPTION_VALUE);
        assert.strictEqual(error.message, 'sensitiveHeaders must be an array of strings');
        return true;
      }
    );

    await assert.rejects(
      axios.get('http://localhost:1/', { sensitiveHeaders: [null] }),
      (error) => {
        assert.strictEqual(error.code, AxiosError.ERR_BAD_OPTION_VALUE);
        assert.strictEqual(error.message, 'sensitiveHeaders must be an array of strings');
        return true;
      }
    );
  });

  it('should fail closed when sensitiveHeaders redirect origin cannot be parsed', () => {
    assert.strictEqual(
      __isSameOriginRedirect(
        { href: 'http://localhost/final' },
        { url: 'http://localhost/start' }
      ),
      true
    );
    assert.strictEqual(
      __isSameOriginRedirect({ href: 'http://[::1' }, { url: 'http://localhost/start' }),
      false
    );
    assert.strictEqual(__isSameOriginRedirect({ href: 'http://localhost/final' }), false);
  });

  it('should wrap HTTP errors and keep stack', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.statusCode = 400;
        res.end();
      },
      { port: SERVER_PORT }
    );

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

  it('should wrap interceptor errors and keep stack', async () => {
    const axiosInstance = axios.create();

    axiosInstance.interceptors.request.use((res) => {
      throw new Error('from request interceptor');
    });

    const server = await startHTTPServer(
      (req, res) => {
        res.end();
      },
      { port: SERVER_PORT }
    );

    try {
      await assert.rejects(
        async function stackTraceTest() {
          await axiosInstance.get(`http://localhost:${server.address().port}/one`);
        },
        (error) => {
          const matches = [...error.stack.matchAll(/stackTraceTest/g)];

          assert.strictEqual(error.name, 'Error');
          assert.strictEqual(error.message, 'from request interceptor');
          assert.strictEqual(matches.length, 1, error.stack);

          return true;
        }
      );
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should preserve the HTTP verb on redirect', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        if (req.method.toLowerCase() !== 'head') {
          res.statusCode = 400;
          res.end();
          return;
        }

        var parsed = new URL(req.url, 'http://localhost');
        if (parsed.pathname === '/one') {
          res.setHeader('Location', '/two');
          res.statusCode = 302;
          res.end();
        } else {
          res.end();
        }
      },
      { port: SERVER_PORT }
    );

    try {
      const response = await axios.head(`http://localhost:${server.address().port}/one`);
      assert.strictEqual(response.status, 200);
    } finally {
      await stopHTTPServer(server);
    }
  });

  describe('compression', async () => {
    const isZstdSupported = typeof zlib.createZstdDecompress === 'function' &&
      typeof zlib.zstdCompress === 'function';

    it('should support transparent gunzip', async () => {
      const data = {
        firstName: 'Fred',
        lastName: 'Flintstone',
        emailAddr: 'fred@example.com',
      };

      const zipped = await new Promise((resolve, reject) => {
        zlib.gzip(JSON.stringify(data), (error, compressed) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(compressed);
        });
      });

      const server = await startHTTPServer(
        (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Encoding', 'gzip');
          res.end(zipped);
        },
        { port: SERVER_PORT }
      );

      try {
        const { data: responseData } = await axios.get(
          `http://localhost:${server.address().port}/`
        );
        assert.deepStrictEqual(responseData, data);
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should support gunzip error handling', async () => {
      const server = await startHTTPServer(
        (req, res) => {
          res.statusCode = 206;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('X-Stream-Error', 'yes');
          res.end('invalid response');
        },
        { port: SERVER_PORT }
      );

      try {
        await assert.rejects(
          async () => {
            await axios.get(`http://localhost:${server.address().port}/`);
          },
          (error) => {
            assert.strictEqual(error.response.status, 206);
            assert.strictEqual(error.response.headers.get('x-stream-error'), 'yes');
            assert.strictEqual(error.status, 206);

            return true;
          }
        );
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should support disabling automatic decompression of response data', async () => {
      const data = 'Test data';

      const zipped = await new Promise((resolve, reject) => {
        zlib.gzip(data, (error, compressed) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(compressed);
        });
      });

      const server = await startHTTPServer(
        (req, res) => {
          res.setHeader('Content-Type', 'text/html;charset=utf-8');
          res.setHeader('Content-Encoding', 'gzip');
          res.end(zipped);
        },
        { port: SERVER_PORT }
      );

      try {
        const response = await axios.get(`http://localhost:${server.address().port}/`, {
          decompress: false,
          responseType: 'arraybuffer',
        });
        assert.strictEqual(response.data.toString('base64'), zipped.toString('base64'));
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should not advertise zstd by default', async () => {
      let acceptEncoding;

      const server = await startHTTPServer(
        (req, res) => {
          acceptEncoding = req.headers['accept-encoding'];
          res.end('ok');
        },
        { port: SERVER_PORT }
      );

      try {
        await axios.get(`http://localhost:${server.address().port}/`);
        assert.strictEqual(acceptEncoding.includes('zstd'), false);
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should advertise zstd when enabled through transitional config and supported', async () => {
      if (!isZstdSupported) {
        return;
      }

      let acceptEncoding;

      const server = await startHTTPServer(
        (req, res) => {
          acceptEncoding = req.headers['accept-encoding'];
          res.end('ok');
        },
        { port: SERVER_PORT }
      );

      try {
        await axios.get(`http://localhost:${server.address().port}/`, {
          transitional: {
            advertiseZstdAcceptEncoding: true,
          },
        });
        assert.strictEqual(acceptEncoding.includes('zstd'), true);
      } finally {
        await stopHTTPServer(server);
      }
    });

    describe('algorithms', () => {
      const responseBody = 'str';

      const gzip = (value) =>
        new Promise((resolve, reject) => {
          zlib.gzip(value, (error, compressed) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(compressed);
          });
        });

      const deflate = (value) =>
        new Promise((resolve, reject) => {
          zlib.deflate(value, (error, compressed) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(compressed);
          });
        });

      const deflateRaw = (value) =>
        new Promise((resolve, reject) => {
          zlib.deflateRaw(value, (error, compressed) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(compressed);
          });
        });

      const brotliCompress = (value) =>
        new Promise((resolve, reject) => {
          zlib.brotliCompress(value, (error, compressed) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(compressed);
          });
        });

      const zstdCompress = (value) =>
        new Promise((resolve, reject) => {
          zlib.zstdCompress(value, (error, compressed) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(compressed);
          });
        });

      for (const [typeName, zipped] of Object.entries({
        gzip: gzip(responseBody),
        GZIP: gzip(responseBody),
        compress: gzip(responseBody),
        deflate: deflate(responseBody),
        'deflate-raw': deflateRaw(responseBody),
        br: brotliCompress(responseBody),
        ...(isZstdSupported ? { zstd: zstdCompress(responseBody) } : {}),
      })) {
        const type = typeName.split('-')[0];

        describe(`${typeName} decompression`, () => {
          it('should support decompression', async () => {
            const server = await startHTTPServer(
              async (req, res) => {
                res.setHeader('Content-Encoding', type);
                res.end(await zipped);
              },
              { port: SERVER_PORT }
            );

            try {
              const { data } = await axios.get(`http://localhost:${server.address().port}`);
              assert.strictEqual(data, responseBody);
            } finally {
              await stopHTTPServer(server);
            }
          });

          it(`should not fail if response content-length header is missing (${type})`, async () => {
            const server = await startHTTPServer(
              async (req, res) => {
                res.setHeader('Content-Encoding', type);
                res.removeHeader('Content-Length');
                res.end(await zipped);
              },
              { port: SERVER_PORT }
            );

            try {
              const { data } = await axios.get(`http://localhost:${server.address().port}`);
              assert.strictEqual(data, responseBody);
            } finally {
              await stopHTTPServer(server);
            }
          });

          it('should not fail with chunked responses (without Content-Length header)', async () => {
            const server = await startHTTPServer(
              async (req, res) => {
                res.setHeader('Content-Encoding', type);
                res.setHeader('Transfer-Encoding', 'chunked');
                res.removeHeader('Content-Length');
                res.write(await zipped);
                res.end();
              },
              { port: SERVER_PORT }
            );

            try {
              const { data } = await axios.get(`http://localhost:${server.address().port}`);
              assert.strictEqual(data, responseBody);
            } finally {
              await stopHTTPServer(server);
            }
          });

          it('should not fail with an empty response without content-length header (Z_BUF_ERROR)', async () => {
            const server = await startHTTPServer(
              (req, res) => {
                res.setHeader('Content-Encoding', type);
                res.removeHeader('Content-Length');
                res.end();
              },
              { port: SERVER_PORT }
            );

            try {
              const { data } = await axios.get(`http://localhost:${server.address().port}`);
              assert.strictEqual(data, '');
            } finally {
              await stopHTTPServer(server);
            }
          });

          it('should not fail with an empty response with content-length header (Z_BUF_ERROR)', async () => {
            const server = await startHTTPServer(
              (req, res) => {
                res.setHeader('Content-Encoding', type);
                res.end();
              },
              { port: SERVER_PORT }
            );

            try {
              await axios.get(`http://localhost:${server.address().port}`);
            } finally {
              await stopHTTPServer(server);
            }
          });

          it('should reject when the server aborts mid-stream and maxRedirects is 0', async () => {
            const server = await startHTTPServer(
              async (req, res) => {
                res.setHeader('Content-Encoding', type);
                res.setHeader('Transfer-Encoding', 'chunked');
                res.removeHeader('Content-Length');
                res.write(await zipped);
                setTimeout(() => res.socket.destroy(), 10);
              },
              { port: SERVER_PORT }
            );

            try {
              await assert.rejects(
                axios.get(`http://localhost:${server.address().port}`, { maxRedirects: 0 }),
                (err) => err && err.code === 'ECONNRESET'
              );
            } finally {
              await stopHTTPServer(server);
            }
          });
        });
      }
    });
  });

  it('should support UTF8', async () => {
    const str = Array(100000).join('ж');

    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end(str);
      },
      { port: SERVER_PORT }
    );

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/`);
      assert.strictEqual(response.data, str);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support basic auth', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.end(req.headers.authorization);
      },
      { port: SERVER_PORT }
    );

    try {
      const user = 'foo';
      const headers = { Authorization: 'Bearer 1234' };
      const response = await axios.get(`http://${user}@localhost:${server.address().port}/`, {
        headers,
      });
      const base64 = Buffer.from(`${user}:`, 'utf8').toString('base64');
      assert.strictEqual(response.data, `Basic ${base64}`);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should decode basic auth credentials from the request URL', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.end(req.headers.authorization);
      },
      { port: SERVER_PORT }
    );

    try {
      const response = await axios.get(
        `http://my%40email.com:pa%24ss@localhost:${server.address().port}/`
      );
      const base64 = Buffer.from('my@email.com:pa$ss', 'utf8').toString('base64');
      assert.strictEqual(response.data, `Basic ${base64}`);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('keeps malformed URL credentials percent-encoding and does not throw', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.end(req.headers.authorization);
      },
      { port: SERVER_PORT }
    );

    try {
      const response = await axios.get(`http://user%:foo%zz@localhost:${server.address().port}/`);
      const base64 = Buffer.from('user%:foo%zz', 'utf8').toString('base64');
      assert.strictEqual(response.data, `Basic ${base64}`);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support password-only basic auth credentials from the request URL', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.end(req.headers.authorization);
      },
      { port: SERVER_PORT }
    );

    try {
      const response = await axios.get(`http://:secret@localhost:${server.address().port}/`);
      const base64 = Buffer.from(':secret', 'utf8').toString('base64');
      assert.strictEqual(response.data, `Basic ${base64}`);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support basic auth with a header', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.end(req.headers.authorization);
      },
      { port: SERVER_PORT }
    );

    try {
      const auth = { username: 'foo', password: 'bar' };
      const headers = { AuThOrIzAtIoN: 'Bearer 1234' }; // wonky casing to ensure caseless comparison
      const response = await axios.get(`http://localhost:${server.address().port}/`, {
        auth,
        headers,
      });
      const base64 = Buffer.from('foo:bar', 'utf8').toString('base64');
      assert.strictEqual(response.data, `Basic ${base64}`);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should ignore inherited nested request option fields in http adapter', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            authorization: req.headers.authorization,
            url: req.url,
          })
        );
      },
      { port: SERVER_PORT }
    );

    Object.defineProperty(Object.prototype, 'username', {
      value: 'inherited-user',
      configurable: true,
    });
    Object.defineProperty(Object.prototype, 'password', {
      value: 'inherited-pass',
      configurable: true,
    });
    Object.defineProperty(Object.prototype, 'serialize', {
      value() {
        return 'inherited=1';
      },
      configurable: true,
    });

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/demo`, {
        auth: {},
        params: { value: 'a b' },
        paramsSerializer: {},
      });

      assert.deepStrictEqual(response.data, {
        authorization: 'Basic Og==',
        url: '/demo?value=a+b',
      });
    } finally {
      delete Object.prototype.username;
      delete Object.prototype.password;
      delete Object.prototype.serialize;
      await stopHTTPServer(server);
    }
  });

  it('should ignore inherited proxy when http adapter receives a plain config', async () => {
    const proxyEnvKeys = ['http_proxy', 'HTTP_PROXY', 'https_proxy', 'HTTPS_PROXY'];
    const originalProxyEnv = Object.create(null);
    let proxy;
    let target;
    let proxyHits = 0;
    let targetHits = 0;

    for (const key of proxyEnvKeys) {
      originalProxyEnv[key] = process.env[key];
      delete process.env[key];
    }

    try {
      proxy = await startHTTPServer((req, res) => {
        proxyHits += 1;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ via: 'proxy', url: req.url }));
      });

      target = await startHTTPServer((req, res) => {
        targetHits += 1;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ via: 'target', url: req.url }));
      });

      Object.defineProperty(Object.prototype, 'proxy', {
        value: {
          protocol: 'http',
          host: '127.0.0.1',
          port: proxy.address().port,
        },
        configurable: true,
      });

      const response = await httpAdapter({
        method: 'get',
        url: `http://127.0.0.1:${target.address().port}/direct`,
        headers: {},
        maxRedirects: 0,
        maxContentLength: -1,
        maxBodyLength: -1,
        timeout: 0,
      });
      const data = JSON.parse(response.data);

      assert.strictEqual(proxyHits, 0);
      assert.strictEqual(targetHits, 1);
      assert.deepStrictEqual(data, { via: 'target', url: '/direct' });
    } finally {
      delete Object.prototype.proxy;

      for (const key of proxyEnvKeys) {
        if (originalProxyEnv[key] === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = originalProxyEnv[key];
        }
      }

      await stopHTTPServer(target);
      await stopHTTPServer(proxy);
    }
  });

  it('should ignore inherited paramsSerializer when http adapter receives a plain config', async () => {
    let server;
    let serializerInvoked = false;

    Object.defineProperty(Object.prototype, 'paramsSerializer', {
      value() {
        serializerInvoked = true;
        return 'inherited=1';
      },
      configurable: true,
    });

    try {
      server = await startHTTPServer((req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ url: req.url }));
      });

      const response = await httpAdapter({
        method: 'get',
        url: `http://127.0.0.1:${server.address().port}/direct`,
        headers: {},
        params: { value: 'a b' },
        proxy: false,
        maxRedirects: 0,
        maxContentLength: -1,
        maxBodyLength: -1,
        timeout: 0,
      });
      const data = JSON.parse(response.data);

      assert.strictEqual(serializerInvoked, false);
      assert.deepStrictEqual(data, { url: '/direct?value=a+b' });
    } finally {
      delete Object.prototype.paramsSerializer;
      await stopHTTPServer(server);
    }
  });

  it('should preserve basic auth across same-origin 303 POST -> GET redirect', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        if (req.url === '/login') {
          res.setHeader('Location', '/profile');
          res.statusCode = 303;
          res.end();
          return;
        }
        res.end(req.headers.authorization || '');
      },
      { port: SERVER_PORT }
    );

    try {
      const auth = { username: 'foo', password: 'bar' };
      const response = await axios.post(
        `http://localhost:${server.address().port}/login`,
        { hello: 'world' },
        { auth, maxRedirects: 1 }
      );
      const base64 = Buffer.from('foo:bar', 'utf8').toString('base64');
      assert.strictEqual(response.data, `Basic ${base64}`);
      assert.strictEqual(response.request.path, '/profile');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should strip basic auth on cross-origin redirect', async () => {
    const targetServer = await startHTTPServer(
      (req, res) => {
        res.end(req.headers.authorization || 'no-auth');
      },
      { port: ALTERNATE_SERVER_PORT }
    );
    const redirectServer = await startHTTPServer(
      (req, res) => {
        res.setHeader('Location', `http://127.0.0.1:${targetServer.address().port}/`);
        res.statusCode = 302;
        res.end();
      },
      { port: SERVER_PORT }
    );

    try {
      const auth = { username: 'foo', password: 'bar' };
      const response = await axios.get(`http://localhost:${redirectServer.address().port}/start`, {
        auth,
        maxRedirects: 1,
      });
      assert.strictEqual(response.data, 'no-auth');
    } finally {
      await stopHTTPServer(redirectServer);
      await stopHTTPServer(targetServer);
    }
  });

  it('should preserve basic auth across multi-hop same-origin redirects', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        if (req.url === '/a') {
          res.setHeader('Location', '/b');
          res.statusCode = 302;
          res.end();
          return;
        }
        if (req.url === '/b') {
          res.setHeader('Location', '/c');
          res.statusCode = 302;
          res.end();
          return;
        }
        res.end(req.headers.authorization || '');
      },
      { port: SERVER_PORT }
    );

    try {
      const auth = { username: 'foo', password: 'bar' };
      const response = await axios.get(`http://localhost:${server.address().port}/a`, {
        auth,
        maxRedirects: 5,
      });
      const base64 = Buffer.from('foo:bar', 'utf8').toString('base64');
      assert.strictEqual(response.data, `Basic ${base64}`);
      assert.strictEqual(response.request.path, '/c');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should provides a default User-Agent header', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.end(req.headers['user-agent']);
      },
      { port: SERVER_PORT }
    );

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/`);
      assert.ok(
        /^axios\/[\d.]+[-]?[a-z]*[.]?[\d]+$/.test(response.data),
        `User-Agent header does not match: ${response.data}`
      );
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should allow the User-Agent header to be overridden', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.end(req.headers['user-agent']);
      },
      { port: SERVER_PORT }
    );

    try {
      const headers = { 'UsEr-AgEnT': 'foo bar' }; // wonky casing to ensure caseless comparison
      const response = await axios.get(`http://localhost:${server.address().port}/`, { headers });
      assert.strictEqual(response.data, 'foo bar');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should allow the Content-Length header to be overridden', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        assert.strictEqual(req.headers['content-length'], '42');
        res.end();
      },
      { port: SERVER_PORT }
    );

    try {
      const headers = { 'CoNtEnT-lEnGtH': '42' }; // wonky casing to ensure caseless comparison
      await axios.post(`http://localhost:${server.address().port}/`, 'foo', { headers });
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support max content length', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end(Array(5000).join('#'));
      },
      { port: SERVER_PORT }
    );

    try {
      await assert.rejects(
        axios.get(`http://localhost:${server.address().port}/`, {
          maxContentLength: 2000,
          maxRedirects: 0,
        }),
        /maxContentLength size of 2000 exceeded/
      );
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support max content length for redirected', async () => {
    const str = Array(100000).join('ж');
    const server = await startHTTPServer(
      (req, res) => {
        const parsed = new URL(req.url, 'http://localhost');

        if (parsed.pathname === '/two') {
          res.setHeader('Content-Type', 'text/html; charset=UTF-8');
          res.end(str);
          return;
        }

        res.setHeader('Location', '/two');
        res.statusCode = 302;
        res.end();
      },
      { port: SERVER_PORT }
    );

    try {
      await assert.rejects(
        axios.get(`http://localhost:${server.address().port}/one`, {
          maxContentLength: 2000,
        }),
        (error) => {
          assert.strictEqual(error.message, 'maxContentLength size of 2000 exceeded');
          return true;
        }
      );
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support max body length', async () => {
    const data = Array(100000).join('ж');
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end();
      },
      { port: SERVER_PORT }
    );

    try {
      await assert.rejects(
        axios.post(
          `http://localhost:${server.address().port}/`,
          {
            data,
          },
          {
            maxBodyLength: 2000,
          }
        ),
        (error) => {
          assert.strictEqual(error.message, 'Request body larger than maxBodyLength limit');
          return true;
        }
      );
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should enforce maxContentLength for streamed responses', async () => {
    const size = 2 * 1024 * 1024;
    const body = Buffer.alloc(size, 0x63);
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.end(body);
      },
      { port: SERVER_PORT }
    );

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/`, {
        responseType: 'stream',
        maxContentLength: 1024,
      });

      let bytesRead = 0;
      const err = await new Promise((resolve) => {
        response.data.on('data', (chunk) => {
          bytesRead += chunk.length;
        });
        response.data.on('error', resolve);
        response.data.on('end', () => resolve(null));
      });

      assert.ok(err, 'stream should emit an error');
      assert.strictEqual(err.message, 'maxContentLength size of 1024 exceeded');
      assert.ok(bytesRead <= 1024 * 64, `stream should not deliver full payload; got ${bytesRead}`);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should allow streamed responses under maxContentLength', async () => {
    const body = Buffer.alloc(512, 0x64);
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.end(body);
      },
      { port: SERVER_PORT }
    );

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/`, {
        responseType: 'stream',
        maxContentLength: 1024,
      });

      const chunks = [];
      await new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => chunks.push(chunk));
        response.data.on('error', reject);
        response.data.on('end', resolve);
      });

      assert.strictEqual(Buffer.concat(chunks).length, body.length);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should enforce maxBodyLength for streamed uploads with maxRedirects: 0', async () => {
    let bytesReceived = 0;
    const server = await startHTTPServer(
      (req, res) => {
        req.on('data', (chunk) => {
          bytesReceived += chunk.length;
        });
        req.on('end', () => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ received: bytesReceived }));
        });
      },
      { port: SERVER_PORT }
    );

    try {
      const size = 2 * 1024 * 1024;
      const buf = Buffer.alloc(size, 0x61);
      const source = stream.Readable.from([buf]);

      await assert.rejects(
        axios.post(`http://localhost:${server.address().port}/`, source, {
          maxBodyLength: 1024,
          maxRedirects: 0,
          headers: { 'Content-Type': 'application/octet-stream' },
        }),
        (error) => {
          assert.strictEqual(error.message, 'Request body larger than maxBodyLength limit');
          return true;
        }
      );

      assert.ok(
        bytesReceived <= 1024 * 4,
        `server should not receive full payload; got ${bytesReceived}`
      );
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should allow streamed uploads under maxBodyLength with maxRedirects: 0', async () => {
    let bytesReceived = 0;
    const server = await startHTTPServer(
      (req, res) => {
        req.on('data', (chunk) => {
          bytesReceived += chunk.length;
        });
        req.on('end', () => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ received: bytesReceived }));
        });
      },
      { port: SERVER_PORT }
    );

    try {
      const payload = Buffer.alloc(512, 0x62);
      const source = stream.Readable.from([payload]);

      const response = await axios.post(`http://localhost:${server.address().port}/`, source, {
        maxBodyLength: 1024,
        maxRedirects: 0,
        headers: { 'Content-Type': 'application/octet-stream' },
      });

      assert.strictEqual(response.data.received, payload.length);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should properly support default max body length (follow-redirects as well)', async () => {
    // Taken from follow-redirects defaults.
    const followRedirectsMaxBodyDefaults = 10 * 1024 * 1024;
    const data = Array(2 * followRedirectsMaxBodyDefaults).join('ж');

    const server = await startHTTPServer(
      (req, res) => {
        // Consume the req stream before responding to avoid ECONNRESET.
        req.on('data', () => {});
        req.on('end', () => {
          res.end('OK');
        });
      },
      { port: SERVER_PORT }
    );

    try {
      const response = await axios.post(`http://localhost:${server.address().port}/`, {
        data,
      });
      assert.strictEqual(response.data, 'OK', 'should handle response');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should display error while parsing params', async () => {
    const server = await startHTTPServer(() => {}, { port: SERVER_PORT });

    try {
      await assert.rejects(
        axios.get(`http://localhost:${server.address().port}/`, {
          params: {
            errorParam: new Date(undefined),
          },
        }),
        (error) => {
          assert.ok(error instanceof AxiosError, 'error should be an AxiosError');
          assert.strictEqual(error.code, AxiosError.ERR_BAD_REQUEST);
          assert.strictEqual(error.exists, true);
          assert.strictEqual(error.url, `http://localhost:${server.address().port}/`);
          return true;
        }
      );
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support sockets', async () => {
    let socketName = path.join(
      os.tmpdir(),
      `axios-test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.sock`
    );

    if (process.platform === 'win32') {
      socketName = '\\\\.\\pipe\\libuv-test';
    }

    let server;
    try {
      server = await new Promise((resolve, reject) => {
        const socketServer = net
          .createServer((socket) => {
            socket.on('data', () => {
              socket.end('HTTP/1.1 200 OK\r\n\r\n');
            });
          })
          .listen(socketName, () => resolve(socketServer));

        socketServer.on('error', reject);
      });
    } catch (error) {
      if (error && error.code === 'EPERM') {
        return;
      }

      throw error;
    }

    try {
      const response = await axios({
        socketPath: socketName,
        url: 'http://localhost:4444/socket',
      });
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.statusText, 'OK');
    } finally {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  });

  describe('streams', () => {
    it('should support streams', async () => {
      const server = await startHTTPServer(
        (req, res) => {
          req.pipe(res);
        },
        { port: SERVER_PORT }
      );

      try {
        const response = await axios.post(
          `http://localhost:${server.address().port}/`,
          fs.createReadStream(thisTestFilePath),
          {
            responseType: 'stream',
          }
        );

        const responseText = await new Promise((resolve, reject) => {
          const chunks = [];

          response.data.on('data', (chunk) => {
            chunks.push(chunk);
          });

          response.data.on('end', () => {
            resolve(Buffer.concat(chunks).toString('utf8'));
          });

          response.data.on('error', reject);
        });

        assert.strictEqual(responseText, fs.readFileSync(thisTestFilePath, 'utf8'));
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should pass errors for a failed stream', async () => {
      const server = await startHTTPServer(() => {}, { port: SERVER_PORT });
      const notExistPath = path.join(adaptersTestsDir, 'does_not_exist');

      try {
        await assert.rejects(
          axios.post(
            `http://localhost:${server.address().port}/`,
            fs.createReadStream(notExistPath)
          ),
          (error) => {
            assert.strictEqual(
              error.message,
              `ENOENT: no such file or directory, open '${notExistPath}'`
            );
            return true;
          }
        );
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should destroy the response stream with an error on request stream destroying', async () => {
      const server = await startHTTPServer();
      const requestStream = generateReadable();

      setTimeout(() => {
        requestStream.destroy();
      }, 1000);

      const { data } = await axios.post(
        `http://localhost:${server.address().port}/`,
        requestStream,
        {
          responseType: 'stream',
        }
      );

      let streamError;
      data.on('error', (error) => {
        streamError = error;
      });

      try {
        await new Promise((resolve, reject) => {
          stream.pipeline(data, devNull(), (error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
        assert.fail('stream was not aborted');
      } catch (error) {
        // Expected: the request stream is destroyed before completion.
      } finally {
        assert.strictEqual(streamError && streamError.code, 'ERR_CANCELED');
        await stopHTTPServer(server);
      }
    });
  });

  it('should support buffers', async () => {
    const buf = Buffer.alloc(1024, 'x'); // Unsafe buffer < Buffer.poolSize (8192 bytes)
    const server = await startHTTPServer(
      (req, res) => {
        assert.strictEqual(req.headers['content-length'], buf.length.toString());
        req.pipe(res);
      },
      { port: SERVER_PORT }
    );

    try {
      const response = await axios.post(`http://localhost:${server.address().port}/`, buf, {
        responseType: 'stream',
      });

      const responseText = await new Promise((resolve, reject) => {
        const chunks = [];

        response.data.on('data', (chunk) => {
          chunks.push(chunk);
        });

        response.data.on('end', () => {
          resolve(Buffer.concat(chunks).toString('utf8'));
        });

        response.data.on('error', reject);
      });

      assert.strictEqual(responseText, buf.toString());
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support HTTP proxies', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end('12345');
      },
      { port: SERVER_PORT }
    );

    let connectAttempts = 0;
    const proxy = await startHTTPServer(
      (request, response) => {
        const parsed = new URL(request.url);
        const opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: `${parsed.pathname}${parsed.search}`,
        };

        http.get(opts, (res) => {
          let body = '';

          res.on('data', (data) => {
            body += data;
          });

          res.on('end', () => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '6789');
          });
        });
      },
      { port: PROXY_PORT }
    );
    proxy.on('connect', (req, sock) => {
      connectAttempts += 1;
      sock.end();
    });

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/`, {
        proxy: {
          host: 'localhost',
          port: proxy.address().port,
        },
      });

      assert.strictEqual(Number(response.data), 123456789, 'should pass through proxy');
      assert.strictEqual(connectAttempts, 0, 'HTTP targets must use forward-proxy mode, not CONNECT');
    } finally {
      await stopHTTPServer(server);
      await stopHTTPServer(proxy);
    }
  });

  it('should support HTTPS proxies', async () => {
    const tlsOptions = {
      key: fs.readFileSync(path.join(adaptersTestsDir, 'key.pem')),
      cert: fs.readFileSync(path.join(adaptersTestsDir, 'cert.pem')),
    };

    const closeServer = (server) =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

    const server = await new Promise((resolve, reject) => {
      const httpsServer = https.createServer(tlsOptions, (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end('12345');
      });
      httpsServer.listen(0, 'localhost', () => resolve(httpsServer));
      httpsServer.on('error', reject);
    });

    let plaintextRequests = 0;
    const connectTargets = [];
    const upstreamSockets = [];
    const proxy = await new Promise((resolve, reject) => {
      const httpsProxy = https.createServer(tlsOptions, () => {
        plaintextRequests += 1;
      });

      httpsProxy.on('connect', (req, clientSocket, head) => {
        connectTargets.push(req.url);
        const [targetHost, targetPort] = req.url.split(':');
        const upstream = net.connect(Number(targetPort), targetHost, () => {
          clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          if (head && head.length) upstream.write(head);
          upstream.pipe(clientSocket);
          clientSocket.pipe(upstream);
        });
        upstreamSockets.push(upstream);
        upstream.on('error', () => clientSocket.destroy());
        clientSocket.on('error', () => upstream.destroy());
      });

      httpsProxy.listen(0, '127.0.0.1', () => resolve(httpsProxy));
      httpsProxy.on('error', reject);
    });

    const originalReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const tunnelingAgent = new HttpsProxyAgent({
      protocol: 'https:',
      host: '127.0.0.1',
      port: proxy.address().port,
      ALPNProtocols: ['http/1.1'],
      rejectUnauthorized: false,
    });
    try {
      const response = await axios.get(`https://localhost:${server.address().port}/`, {
        httpsAgent: tunnelingAgent,
      });

      // axios may auto-parse the body as JSON; compare as number to tolerate either form.
      assert.strictEqual(Number(response.data), 12345, 'origin body should be received unmodified');
      assert.strictEqual(plaintextRequests, 0, 'proxy must not see plaintext requests');
      assert.strictEqual(connectTargets.length, 1, 'proxy should see exactly one CONNECT');
      assert.ok(
        connectTargets[0].startsWith(`localhost:${server.address().port}`),
        `CONNECT should target the origin: ${connectTargets[0]}`
      );
    } finally {
      if (originalReject === undefined) {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      } else {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalReject;
      }
      tunnelingAgent.destroy();
      // Tear down everything synchronously. server.close() on tls.Server can hang
      // when CONNECT-tunneled sockets have been pumped through, even after
      // closeAllConnections — destroy the underlying handles directly so the
      // test doesn't wait on a graceful shutdown.
      for (const s of upstreamSockets) s.destroy();
      server.closeAllConnections?.();
      proxy.closeAllConnections?.();
      server.close();
      proxy.close();
      server.unref?.();
      proxy.unref?.();
    }
  });

  it('should CONNECT-tunnel HTTPS targets through an HTTP proxy by default (issue #6320)', async () => {
    const tlsOptions = {
      key: fs.readFileSync(path.join(adaptersTestsDir, 'key.pem')),
      cert: fs.readFileSync(path.join(adaptersTestsDir, 'cert.pem')),
    };

    const origin = await new Promise((resolve, reject) => {
      const s = https.createServer(tlsOptions, (req, res) => {
        if (req.headers['proxy-authorization']) {
          // Proxy-Authorization MUST NOT reach the origin under tunneling.
          res.writeHead(500);
          res.end('LEAKED:' + req.headers['proxy-authorization']);
          return;
        }
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end('secret-body-12345');
      });
      s.listen(0, 'localhost', () => resolve(s));
      s.on('error', reject);
    });

    const captured = { plaintext: 0, connectTargets: [], connectAuth: [] };
    const upstreamSockets = [];
    const proxy = await new Promise((resolve, reject) => {
      const p = http.createServer((req) => {
        // Plaintext arrival = tunneling regression. Capture URL/headers so
        // assertions below can show what leaked.
        captured.plaintext += 1;
        captured.plaintextUrl = req.url;
      });
      p.on('connect', (req, clientSocket, head) => {
        captured.connectTargets.push(req.url);
        captured.connectAuth.push(req.headers['proxy-authorization'] || null);
        const [host, port] = req.url.split(':');
        const upstream = net.connect(Number(port), host, () => {
          clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          if (head && head.length) upstream.write(head);
          upstream.pipe(clientSocket);
          clientSocket.pipe(upstream);
        });
        upstreamSockets.push(upstream);
        upstream.on('error', () => clientSocket.destroy());
        clientSocket.on('error', () => upstream.destroy());
      });
      p.listen(0, '127.0.0.1', () => resolve(p));
      p.on('error', reject);
    });

    const originalReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    try {
      const response = await axios.post(
        `https://localhost:${origin.address().port}/path?token=abc123`,
        { sensitive: 'leak-canary' },
        {
          proxy: {
            host: '127.0.0.1',
            port: proxy.address().port,
            protocol: 'http',
            auth: { username: 'admin', password: 'secret' },
          },
          validateStatus: () => true,
        }
      );

      assert.strictEqual(response.data, 'secret-body-12345', 'origin body should arrive unmodified through the tunnel');
      assert.strictEqual(captured.plaintext, 0, 'proxy must not see any plaintext request line');
      assert.strictEqual(captured.connectTargets.length, 1, 'proxy should see exactly one CONNECT');
      assert.ok(
        captured.connectTargets[0].startsWith(`localhost:${origin.address().port}`),
        `CONNECT should target the origin host:port, got ${captured.connectTargets[0]}`
      );
      assert.ok(captured.connectAuth[0], 'Proxy-Authorization should be present on the CONNECT request');
      assert.match(
        captured.connectAuth[0],
        /^Basic /,
        'CONNECT auth should be Basic-encoded'
      );
      const decoded = Buffer.from(captured.connectAuth[0].slice(6), 'base64').toString('utf8');
      assert.strictEqual(decoded, 'admin:secret', 'Proxy-Authorization credentials should match');
    } finally {
      if (originalReject === undefined) {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      } else {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalReject;
      }
      for (const s of upstreamSockets) s.destroy();
      origin.closeAllConnections?.();
      proxy.closeAllConnections?.();
      origin.close();
      proxy.close();
      origin.unref?.();
      proxy.unref?.();
    }
  });

  it('should apply httpsAgent TLS options to CONNECT-tunneled origins (issue #10953)', async () => {
    const tlsOptions = {
      key: fs.readFileSync(path.join(adaptersTestsDir, 'key.pem')),
      cert: fs.readFileSync(path.join(adaptersTestsDir, 'cert.pem')),
    };

    const origin = await new Promise((resolve, reject) => {
      const s = https.createServer(tlsOptions, (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end('trusted-through-agent');
      });
      s.listen(0, 'localhost', () => resolve(s));
      s.on('error', reject);
    });

    const captured = { plaintext: 0, connectTargets: [] };
    const upstreamSockets = [];
    const proxy = await new Promise((resolve, reject) => {
      const p = http.createServer(() => {
        captured.plaintext += 1;
      });
      p.on('connect', (req, clientSocket, head) => {
        captured.connectTargets.push(req.url);
        const [host, port] = req.url.split(':');
        const upstream = net.connect(Number(port), host, () => {
          clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          if (head && head.length) upstream.write(head);
          upstream.pipe(clientSocket);
          clientSocket.pipe(upstream);
        });
        upstreamSockets.push(upstream);
        upstream.on('error', () => clientSocket.destroy());
        clientSocket.on('error', () => upstream.destroy());
      });
      p.listen(0, '127.0.0.1', () => resolve(p));
      p.on('error', reject);
    });

    const httpsAgent = new https.Agent({ ca: tlsOptions.cert });

    try {
      const response = await axios.get(`https://localhost:${origin.address().port}/`, {
        httpsAgent,
        proxy: {
          host: '127.0.0.1',
          port: proxy.address().port,
          protocol: 'http',
        },
      });

      assert.strictEqual(response.data, 'trusted-through-agent');
      assert.strictEqual(captured.plaintext, 0, 'proxy must not see plaintext HTTPS requests');
      assert.strictEqual(captured.connectTargets.length, 1, 'proxy should see exactly one CONNECT');
      assert.ok(
        captured.connectTargets[0].startsWith(`localhost:${origin.address().port}`),
        `CONNECT should target the origin host:port, got ${captured.connectTargets[0]}`
      );
    } finally {
      httpsAgent.destroy();
      for (const s of upstreamSockets) s.destroy();
      origin.closeAllConnections?.();
      proxy.closeAllConnections?.();
      origin.close();
      proxy.close();
      origin.unref?.();
      proxy.unref?.();
    }
  });

  it('should surface a CONNECT 407 from the proxy as an AxiosError (issue #6320)', async () => {
    const proxy = await new Promise((resolve, reject) => {
      const p = http.createServer();
      p.on('connect', (req, clientSocket) => {
        clientSocket.write(
          'HTTP/1.1 407 Proxy Authentication Required\r\n' +
            'Proxy-Authenticate: Basic realm="proxy"\r\n' +
            'Content-Length: 0\r\n' +
            '\r\n'
        );
        clientSocket.end();
      });
      p.listen(0, '127.0.0.1', () => resolve(p));
      p.on('error', reject);
    });

    try {
      await assert.rejects(
        async () => {
          await axios.get('https://127.0.0.1:1/', {
            proxy: {
              host: '127.0.0.1',
              port: proxy.address().port,
              protocol: 'http',
            },
            timeout: 4000,
          });
        },
        (err) => {
          assert.ok(err instanceof AxiosError, 'rejection should be an AxiosError');
          return true;
        }
      );
    } finally {
      proxy.closeAllConnections?.();
      proxy.close();
      proxy.unref?.();
    }
  });

  it('should not pass through disabled proxy', async () => {
    const originalHttpProxy = process.env.http_proxy;
    process.env.http_proxy = 'http://does-not-exists.example.com:4242/';

    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end('123456789');
      },
      { port: SERVER_PORT }
    );

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/`, {
        proxy: false,
      });

      assert.strictEqual(Number(response.data), 123456789, 'should not pass through proxy');
    } finally {
      await stopHTTPServer(server);

      if (originalHttpProxy === undefined) {
        delete process.env.http_proxy;
      } else {
        process.env.http_proxy = originalHttpProxy;
      }
    }
  });

  it('should support proxy set via env var', async () => {
    const originalHttpProxy = process.env.http_proxy;
    const originalHTTPProxy = process.env.HTTP_PROXY;
    const originalNoProxy = process.env.no_proxy;
    const originalNOProxy = process.env.NO_PROXY;

    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end('4567');
      },
      { port: SERVER_PORT }
    );

    const proxy = await startHTTPServer(
      (request, response) => {
        const parsed = new URL(request.url);
        const opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: `${parsed.pathname}${parsed.search}`,
        };

        http.get(opts, (res) => {
          let body = '';

          res.on('data', (data) => {
            body += data;
          });

          res.on('end', () => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '1234');
          });
        });
      },
      { port: PROXY_PORT }
    );

    const proxyUrl = `http://localhost:${proxy.address().port}/`;
    process.env.http_proxy = proxyUrl;
    process.env.HTTP_PROXY = proxyUrl;
    process.env.no_proxy = '';
    process.env.NO_PROXY = '';

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/`);

      assert.strictEqual(
        String(response.data),
        '45671234',
        'should use proxy set by process.env.http_proxy'
      );
    } finally {
      await stopHTTPServer(server);
      await stopHTTPServer(proxy);

      if (originalHttpProxy === undefined) {
        delete process.env.http_proxy;
      } else {
        process.env.http_proxy = originalHttpProxy;
      }

      if (originalHTTPProxy === undefined) {
        delete process.env.HTTP_PROXY;
      } else {
        process.env.HTTP_PROXY = originalHTTPProxy;
      }

      if (originalNoProxy === undefined) {
        delete process.env.no_proxy;
      } else {
        process.env.no_proxy = originalNoProxy;
      }

      if (originalNOProxy === undefined) {
        delete process.env.NO_PROXY;
      } else {
        process.env.NO_PROXY = originalNOProxy;
      }
    }
  });

  it('should detect Node native env proxy support from the selected agent', () => {
    const nativeProxyAgent = { options: { proxyEnv: { HTTP_PROXY: 'http://proxy.local:9000' } } };
    const plainAgent = { options: {} };

    assert.strictEqual(__isNodeEnvProxyEnabled(nativeProxyAgent, '22.20.0'), false);
    assert.strictEqual(__isNodeEnvProxyEnabled(nativeProxyAgent, '22.21.0'), true);
    assert.strictEqual(__isNodeEnvProxyEnabled(nativeProxyAgent, '24.4.0'), false);
    assert.strictEqual(__isNodeEnvProxyEnabled(nativeProxyAgent, '24.5.0'), true);
    assert.strictEqual(__isNodeEnvProxyEnabled(nativeProxyAgent, '25.0.0'), true);
    assert.strictEqual(__isNodeEnvProxyEnabled(plainAgent, '24.5.0'), false);
    assert.strictEqual(__isNodeEnvProxyEnabled(undefined, '24.5.0'), false);
  });

  it('should leave env proxy handling to supported Node versions when the selected agent uses proxyEnv', () => {
    const originalHttpProxy = process.env.http_proxy;
    const originalHTTPProxy = process.env.HTTP_PROXY;
    const originalNoProxy = process.env.no_proxy;
    const originalNOProxy = process.env.NO_PROXY;
    const originalNodeUseEnvProxy = process.env.NODE_USE_ENV_PROXY;

    process.env.NODE_USE_ENV_PROXY = '1';
    process.env.http_proxy = 'http://proxy.local:9000/';
    process.env.HTTP_PROXY = 'http://proxy.local:9000/';
    process.env.no_proxy = '';
    process.env.NO_PROXY = '';

    try {
      const options = {
        headers: {},
        beforeRedirects: {},
        hostname: 'target.example',
        host: 'target.example',
        port: '4000',
        protocol: 'http:',
        path: '/resource',
      };
      const nativeProxyAgent = { options: { proxyEnv: process.env } };

      __setProxy(
        options,
        undefined,
        'http://target.example:4000/resource',
        false,
        undefined,
        nativeProxyAgent
      );

      if (__isNodeEnvProxyEnabled(nativeProxyAgent, process.versions.node)) {
        assert.strictEqual(options.hostname, 'target.example');
        assert.strictEqual(options.port, '4000');
        assert.strictEqual(options.path, '/resource');
        assert.strictEqual(options.headers.host, undefined);
      } else {
        assert.strictEqual(options.hostname, 'proxy.local');
        assert.strictEqual(options.port, '9000');
        assert.strictEqual(options.path, 'http://target.example:4000/resource');
      }

      assert.strictEqual(typeof options.beforeRedirects.proxy, 'function');
    } finally {
      if (originalHttpProxy === undefined) {
        delete process.env.http_proxy;
      } else {
        process.env.http_proxy = originalHttpProxy;
      }

      if (originalHTTPProxy === undefined) {
        delete process.env.HTTP_PROXY;
      } else {
        process.env.HTTP_PROXY = originalHTTPProxy;
      }

      if (originalNoProxy === undefined) {
        delete process.env.no_proxy;
      } else {
        process.env.no_proxy = originalNoProxy;
      }

      if (originalNOProxy === undefined) {
        delete process.env.NO_PROXY;
      } else {
        process.env.NO_PROXY = originalNOProxy;
      }

      if (originalNodeUseEnvProxy === undefined) {
        delete process.env.NODE_USE_ENV_PROXY;
      } else {
        process.env.NODE_USE_ENV_PROXY = originalNodeUseEnvProxy;
      }
    }
  });

  it('should keep axios env proxy handling when the selected agent has no proxyEnv', () => {
    const originalHttpProxy = process.env.http_proxy;
    const originalHTTPProxy = process.env.HTTP_PROXY;
    const originalNoProxy = process.env.no_proxy;
    const originalNOProxy = process.env.NO_PROXY;
    const originalNodeUseEnvProxy = process.env.NODE_USE_ENV_PROXY;

    process.env.NODE_USE_ENV_PROXY = '1';
    process.env.http_proxy = 'http://proxy.local:9000/';
    process.env.HTTP_PROXY = 'http://proxy.local:9000/';
    process.env.no_proxy = '';
    process.env.NO_PROXY = '';

    try {
      const options = {
        headers: {},
        beforeRedirects: {},
        hostname: 'target.example',
        host: 'target.example',
        port: '4000',
        protocol: 'http:',
        path: '/resource',
      };
      const plainAgent = { options: {} };

      __setProxy(
        options,
        undefined,
        'http://target.example:4000/resource',
        false,
        undefined,
        plainAgent
      );

      assert.strictEqual(options.hostname, 'proxy.local');
      assert.strictEqual(options.port, '9000');
      assert.strictEqual(options.path, 'http://target.example:4000/resource');
      assert.strictEqual(typeof options.beforeRedirects.proxy, 'function');
    } finally {
      if (originalHttpProxy === undefined) {
        delete process.env.http_proxy;
      } else {
        process.env.http_proxy = originalHttpProxy;
      }

      if (originalHTTPProxy === undefined) {
        delete process.env.HTTP_PROXY;
      } else {
        process.env.HTTP_PROXY = originalHTTPProxy;
      }

      if (originalNoProxy === undefined) {
        delete process.env.no_proxy;
      } else {
        process.env.no_proxy = originalNoProxy;
      }

      if (originalNOProxy === undefined) {
        delete process.env.NO_PROXY;
      } else {
        process.env.NO_PROXY = originalNOProxy;
      }

      if (originalNodeUseEnvProxy === undefined) {
        delete process.env.NODE_USE_ENV_PROXY;
      } else {
        process.env.NODE_USE_ENV_PROXY = originalNodeUseEnvProxy;
      }
    }
  });

  it('should support HTTPS proxy set via env var', async () => {
    const originalHttpsProxy = process.env.https_proxy;
    const originalHTTPSProxy = process.env.HTTPS_PROXY;
    const originalNoProxy = process.env.no_proxy;
    const originalNOProxy = process.env.NO_PROXY;

    const tlsOptions = {
      key: fs.readFileSync(path.join(adaptersTestsDir, 'key.pem')),
      cert: fs.readFileSync(path.join(adaptersTestsDir, 'cert.pem')),
    };

    const closeServer = (server) =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

    const server = await new Promise((resolve, reject) => {
      const httpsServer = https.createServer(tlsOptions, (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end('12345');
      });
      httpsServer.listen(0, 'localhost', () => resolve(httpsServer));
      httpsServer.on('error', reject);
    });

    let plaintextRequests = 0;
    const connectTargets = [];
    const upstreamSockets = [];
    const proxy = await new Promise((resolve, reject) => {
      const httpsProxy = https.createServer(tlsOptions, () => {
        plaintextRequests += 1;
      });

      httpsProxy.on('connect', (req, clientSocket, head) => {
        connectTargets.push(req.url);
        const [targetHost, targetPort] = req.url.split(':');
        const upstream = net.connect(Number(targetPort), targetHost, () => {
          clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          if (head && head.length) upstream.write(head);
          upstream.pipe(clientSocket);
          clientSocket.pipe(upstream);
        });
        upstreamSockets.push(upstream);
        upstream.on('error', () => clientSocket.destroy());
        clientSocket.on('error', () => upstream.destroy());
      });

      httpsProxy.listen(0, '127.0.0.1', () => resolve(httpsProxy));
      httpsProxy.on('error', reject);
    });

    const proxyUrl = `https://127.0.0.1:${proxy.address().port}/`;
    process.env.https_proxy = proxyUrl;
    process.env.HTTPS_PROXY = proxyUrl;
    process.env.no_proxy = '';
    process.env.NO_PROXY = '';

    const originalReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    try {
      const response = await axios.get(`https://localhost:${server.address().port}/`);

      assert.strictEqual(Number(response.data), 12345, 'origin body should be received unmodified');
      assert.strictEqual(plaintextRequests, 0, 'proxy must not see plaintext requests');
      assert.strictEqual(connectTargets.length, 1, 'proxy should see exactly one CONNECT');
    } finally {
      if (originalReject === undefined) {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      } else {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalReject;
      }
      for (const s of upstreamSockets) s.destroy();
      server.closeAllConnections?.();
      proxy.closeAllConnections?.();
      server.close();
      proxy.close();
      server.unref?.();
      proxy.unref?.();

      if (originalHttpsProxy === undefined) {
        delete process.env.https_proxy;
      } else {
        process.env.https_proxy = originalHttpsProxy;
      }

      if (originalHTTPSProxy === undefined) {
        delete process.env.HTTPS_PROXY;
      } else {
        process.env.HTTPS_PROXY = originalHTTPSProxy;
      }

      if (originalNoProxy === undefined) {
        delete process.env.no_proxy;
      } else {
        process.env.no_proxy = originalNoProxy;
      }

      if (originalNOProxy === undefined) {
        delete process.env.NO_PROXY;
      } else {
        process.env.NO_PROXY = originalNOProxy;
      }
    }
  });

  it('should re-evaluate proxy on redirect when proxy set via env var', async () => {
    const originalHttpProxy = process.env.http_proxy;
    const originalHTTPProxy = process.env.HTTP_PROXY;
    const originalNoProxy = process.env.no_proxy;
    const originalNOProxy = process.env.NO_PROXY;

    let proxyUseCount = 0;

    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Location', `http://localhost:${proxy.address().port}/redirected`);
        res.statusCode = 302;
        res.end();
      },
      { port: SERVER_PORT }
    );

    const proxy = await startHTTPServer(
      (request, response) => {
        const parsed = new URL(request.url, 'http://localhost');

        if (parsed.pathname === '/redirected') {
          response.statusCode = 200;
          response.end();
          return;
        }

        proxyUseCount += 1;

        const opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: `${parsed.pathname}${parsed.search}`,
          protocol: parsed.protocol,
        };

        http.get(opts, (res) => {
          let body = '';

          res.on('data', (data) => {
            body += data;
          });

          res.on('end', () => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.setHeader('Location', res.headers.location);
            response.end(body);
          });
        });
      },
      { port: PROXY_PORT }
    );

    const proxyUrl = `http://localhost:${proxy.address().port}`;
    process.env.http_proxy = proxyUrl;
    process.env.HTTP_PROXY = proxyUrl;
    process.env.no_proxy = `localhost:${proxy.address().port}`;
    process.env.NO_PROXY = `localhost:${proxy.address().port}`;

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/`);
      assert.equal(response.status, 200);
      assert.equal(proxyUseCount, 1);
    } finally {
      await stopHTTPServer(server);
      await stopHTTPServer(proxy);

      if (originalHttpProxy === undefined) {
        delete process.env.http_proxy;
      } else {
        process.env.http_proxy = originalHttpProxy;
      }

      if (originalHTTPProxy === undefined) {
        delete process.env.HTTP_PROXY;
      } else {
        process.env.HTTP_PROXY = originalHTTPProxy;
      }

      if (originalNoProxy === undefined) {
        delete process.env.no_proxy;
      } else {
        process.env.no_proxy = originalNoProxy;
      }

      if (originalNOProxy === undefined) {
        delete process.env.NO_PROXY;
      } else {
        process.env.NO_PROXY = originalNOProxy;
      }
    }
  });

  it('should not use proxy for domains in no_proxy', async () => {
    const originalHttpProxy = process.env.http_proxy;
    const originalHTTPProxy = process.env.HTTP_PROXY;
    const originalNoProxy = process.env.no_proxy;
    const originalNOProxy = process.env.NO_PROXY;

    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end('4567');
      },
      { port: SERVER_PORT }
    );

    const proxy = await startHTTPServer(
      (request, response) => {
        const parsed = new URL(request.url);
        const opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: `${parsed.pathname}${parsed.search}`,
        };

        http.get(opts, (res) => {
          let body = '';

          res.on('data', (data) => {
            body += data;
          });

          res.on('end', () => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '1234');
          });
        });
      },
      { port: PROXY_PORT }
    );

    const noProxyValue = 'foo.com, localhost,bar.net , , quix.co';
    const proxyUrl = `http://localhost:${proxy.address().port}/`;
    process.env.http_proxy = proxyUrl;
    process.env.HTTP_PROXY = proxyUrl;
    process.env.no_proxy = noProxyValue;
    process.env.NO_PROXY = noProxyValue;

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/`);
      assert.equal(response.data, '4567', 'should not use proxy for domains in no_proxy');
    } finally {
      await stopHTTPServer(server);
      await stopHTTPServer(proxy);

      if (originalHttpProxy === undefined) {
        delete process.env.http_proxy;
      } else {
        process.env.http_proxy = originalHttpProxy;
      }

      if (originalHTTPProxy === undefined) {
        delete process.env.HTTP_PROXY;
      } else {
        process.env.HTTP_PROXY = originalHTTPProxy;
      }

      if (originalNoProxy === undefined) {
        delete process.env.no_proxy;
      } else {
        process.env.no_proxy = originalNoProxy;
      }

      if (originalNOProxy === undefined) {
        delete process.env.NO_PROXY;
      } else {
        process.env.NO_PROXY = originalNOProxy;
      }
    }
  });

  it('should not use proxy for localhost with trailing dot when listed in no_proxy', async () => {
    const originalHttpProxy = process.env.http_proxy;
    const originalHTTPProxy = process.env.HTTP_PROXY;
    const originalNoProxy = process.env.no_proxy;
    const originalNOProxy = process.env.NO_PROXY;

    let proxyRequests = 0;
    const proxy = await startHTTPServer(
      (_, response) => {
        proxyRequests += 1;
        response.end('proxied');
      },
      { port: PROXY_PORT }
    );

    const noProxyValue = 'localhost,127.0.0.1,::1';
    const proxyUrl = `http://localhost:${proxy.address().port}/`;
    process.env.http_proxy = proxyUrl;
    process.env.HTTP_PROXY = proxyUrl;
    process.env.no_proxy = noProxyValue;
    process.env.NO_PROXY = noProxyValue;

    try {
      await assert.rejects(axios.get('http://localhost.:1/', { timeout: 100 }));
      assert.equal(proxyRequests, 0, 'should not use proxy for localhost with trailing dot');
    } finally {
      await stopHTTPServer(proxy);

      if (originalHttpProxy === undefined) {
        delete process.env.http_proxy;
      } else {
        process.env.http_proxy = originalHttpProxy;
      }

      if (originalHTTPProxy === undefined) {
        delete process.env.HTTP_PROXY;
      } else {
        process.env.HTTP_PROXY = originalHTTPProxy;
      }

      if (originalNoProxy === undefined) {
        delete process.env.no_proxy;
      } else {
        process.env.no_proxy = originalNoProxy;
      }

      if (originalNOProxy === undefined) {
        delete process.env.NO_PROXY;
      } else {
        process.env.NO_PROXY = originalNOProxy;
      }
    }
  });

  it('should not use proxy for bracketed IPv6 loopback when listed in no_proxy', async () => {
    const originalHttpProxy = process.env.http_proxy;
    const originalHTTPProxy = process.env.HTTP_PROXY;
    const originalNoProxy = process.env.no_proxy;
    const originalNOProxy = process.env.NO_PROXY;

    let proxyRequests = 0;
    const proxy = await startHTTPServer(
      (_, response) => {
        proxyRequests += 1;
        response.end('proxied');
      },
      { port: PROXY_PORT }
    );

    const noProxyValue = 'localhost,127.0.0.1,::1';
    const proxyUrl = `http://localhost:${proxy.address().port}/`;
    process.env.http_proxy = proxyUrl;
    process.env.HTTP_PROXY = proxyUrl;
    process.env.no_proxy = noProxyValue;
    process.env.NO_PROXY = noProxyValue;

    try {
      await assert.rejects(axios.get('http://[::1]:1/', { timeout: 100 }));
      assert.equal(proxyRequests, 0, 'should not use proxy for IPv6 loopback');
    } finally {
      await stopHTTPServer(proxy);

      if (originalHttpProxy === undefined) {
        delete process.env.http_proxy;
      } else {
        process.env.http_proxy = originalHttpProxy;
      }

      if (originalHTTPProxy === undefined) {
        delete process.env.HTTP_PROXY;
      } else {
        process.env.HTTP_PROXY = originalHTTPProxy;
      }

      if (originalNoProxy === undefined) {
        delete process.env.no_proxy;
      } else {
        process.env.no_proxy = originalNoProxy;
      }

      if (originalNOProxy === undefined) {
        delete process.env.NO_PROXY;
      } else {
        process.env.NO_PROXY = originalNOProxy;
      }
    }
  });

  it('should use proxy for domains not in no_proxy', async () => {
    const originalHttpProxy = process.env.http_proxy;
    const originalHTTPProxy = process.env.HTTP_PROXY;
    const originalNoProxy = process.env.no_proxy;
    const originalNOProxy = process.env.NO_PROXY;

    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end('4567');
      },
      { port: SERVER_PORT }
    );

    const proxy = await startHTTPServer(
      (request, response) => {
        const parsed = new URL(request.url);
        const opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: `${parsed.pathname}${parsed.search}`,
        };

        http.get(opts, (res) => {
          let body = '';

          res.on('data', (data) => {
            body += data;
          });

          res.on('end', () => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(body + '1234');
          });
        });
      },
      { port: PROXY_PORT }
    );

    const noProxyValue = 'foo.com, ,bar.net , quix.co';
    const proxyUrl = `http://localhost:${proxy.address().port}/`;
    process.env.http_proxy = proxyUrl;
    process.env.HTTP_PROXY = proxyUrl;
    process.env.no_proxy = noProxyValue;
    process.env.NO_PROXY = noProxyValue;

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/`);
      assert.equal(response.data, '45671234', 'should use proxy for domains not in no_proxy');
    } finally {
      await stopHTTPServer(server);
      await stopHTTPServer(proxy);

      if (originalHttpProxy === undefined) {
        delete process.env.http_proxy;
      } else {
        process.env.http_proxy = originalHttpProxy;
      }

      if (originalHTTPProxy === undefined) {
        delete process.env.HTTP_PROXY;
      } else {
        process.env.HTTP_PROXY = originalHTTPProxy;
      }

      if (originalNoProxy === undefined) {
        delete process.env.no_proxy;
      } else {
        process.env.no_proxy = originalNoProxy;
      }

      if (originalNOProxy === undefined) {
        delete process.env.NO_PROXY;
      } else {
        process.env.NO_PROXY = originalNOProxy;
      }
    }
  });

  it('should support HTTP proxy auth', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.end();
      },
      { port: SERVER_PORT }
    );

    const proxy = await startHTTPServer(
      (request, response) => {
        const parsed = new URL(request.url);
        const opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: `${parsed.pathname}${parsed.search}`,
        };
        const proxyAuth = request.headers['proxy-authorization'];

        http.get(opts, (res) => {
          res.on('data', () => {});

          res.on('end', () => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(proxyAuth);
          });
        });
      },
      { port: PROXY_PORT }
    );

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/`, {
        proxy: {
          host: 'localhost',
          port: proxy.address().port,
          auth: {
            username: 'user',
            password: 'pass',
          },
        },
      });

      const base64 = Buffer.from('user:pass', 'utf8').toString('base64');
      assert.equal(response.data, `Basic ${base64}`, 'should authenticate to the proxy');
    } finally {
      await stopHTTPServer(server);
      await stopHTTPServer(proxy);
    }
  });

  it('should support proxy auth from env', async () => {
    const originalHttpProxy = process.env.http_proxy;
    const originalHTTPProxy = process.env.HTTP_PROXY;
    const originalNoProxy = process.env.no_proxy;
    const originalNOProxy = process.env.NO_PROXY;

    const server = await startHTTPServer(
      (req, res) => {
        res.end();
      },
      { port: SERVER_PORT }
    );

    const proxy = await startHTTPServer(
      (request, response) => {
        const parsed = new URL(request.url);
        const opts = {
          host: parsed.hostname,
          port: parsed.port,
          path: `${parsed.pathname}${parsed.search}`,
        };
        const proxyAuth = request.headers['proxy-authorization'];

        http.get(opts, (res) => {
          res.on('data', () => {});

          res.on('end', () => {
            response.setHeader('Content-Type', 'text/html; charset=UTF-8');
            response.end(proxyAuth);
          });
        });
      },
      { port: PROXY_PORT }
    );

    const proxyUrl = `http://user:pass@localhost:${proxy.address().port}/`;
    process.env.http_proxy = proxyUrl;
    process.env.HTTP_PROXY = proxyUrl;
    process.env.no_proxy = '';
    process.env.NO_PROXY = '';

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/`);
      const base64 = Buffer.from('user:pass', 'utf8').toString('base64');
      assert.equal(
        response.data,
        `Basic ${base64}`,
        'should authenticate to the proxy set by process.env.http_proxy'
      );
    } finally {
      await stopHTTPServer(server);
      await stopHTTPServer(proxy);

      if (originalHttpProxy === undefined) {
        delete process.env.http_proxy;
      } else {
        process.env.http_proxy = originalHttpProxy;
      }

      if (originalHTTPProxy === undefined) {
        delete process.env.HTTP_PROXY;
      } else {
        process.env.HTTP_PROXY = originalHTTPProxy;
      }

      if (originalNoProxy === undefined) {
        delete process.env.no_proxy;
      } else {
        process.env.no_proxy = originalNoProxy;
      }

      if (originalNOProxy === undefined) {
        delete process.env.NO_PROXY;
      } else {
        process.env.NO_PROXY = originalNOProxy;
      }
    }
  });

  describe('when invalid proxy options are provided', () => {
    it('should throw error', async () => {
      const proxy = {
        protocol: 'http:',
        host: 'hostname.abc.xyz',
        port: PROXY_PORT,
        auth: {
          username: '',
          password: '',
        },
      };

      await assert.rejects(axios.get('https://test-domain.abc', { proxy }), (error) => {
        assert.strictEqual(error.message, 'Invalid proxy authorization');
        assert.strictEqual(error.code, 'ERR_BAD_OPTION');
        assert.deepStrictEqual(error.config.proxy, proxy);
        return true;
      });
    });
  });

  describe('different options for direct proxy configuration (without env variables)', () => {
    const destination = 'www.example.com';

    const testCases = [
      {
        description: 'hostname and trailing colon in protocol',
        proxyConfig: { hostname: '127.0.0.1', protocol: 'http:', port: OPEN_WEB_PORT },
        expectedOptions: {
          host: '127.0.0.1',
          protocol: 'http:',
          port: OPEN_WEB_PORT,
          path: destination,
        },
      },
      {
        description: 'hostname and no trailing colon in protocol',
        proxyConfig: { hostname: '127.0.0.1', protocol: 'http', port: OPEN_WEB_PORT },
        expectedOptions: {
          host: '127.0.0.1',
          protocol: 'http:',
          port: OPEN_WEB_PORT,
          path: destination,
        },
      },
      {
        description: 'both hostname and host -> hostname takes precedence',
        proxyConfig: {
          hostname: '127.0.0.1',
          host: '0.0.0.0',
          protocol: 'http',
          port: OPEN_WEB_PORT,
        },
        expectedOptions: {
          host: '127.0.0.1',
          protocol: 'http:',
          port: OPEN_WEB_PORT,
          path: destination,
        },
      },
      {
        description: 'only host and https protocol',
        proxyConfig: { host: '0.0.0.0', protocol: 'https', port: OPEN_WEB_PORT },
        expectedOptions: {
          host: '0.0.0.0',
          protocol: 'https:',
          port: OPEN_WEB_PORT,
          path: destination,
        },
      },
    ];

    for (const test of testCases) {
      it(test.description, () => {
        const options = { headers: {}, beforeRedirects: {} };
        __setProxy(options, test.proxyConfig, destination);

        for (const [key, expected] of Object.entries(test.expectedOptions)) {
          assert.strictEqual(options[key], expected);
        }
      });
    }
  });

  describe('Host header preservation when forwarding through a proxy (#10805)', () => {
    const proxyConfig = { hostname: '127.0.0.1', protocol: 'http:', port: 8888 };

    it('defaults the Host header to the request target when the user does not set one', () => {
      const options = {
        headers: {},
        beforeRedirects: {},
        hostname: '127.0.0.1',
        port: 4000,
      };

      __setProxy(options, proxyConfig, 'http://127.0.0.1:4000/');

      assert.strictEqual(options.headers.host, '127.0.0.1:4000');
    });

    it('preserves a user-supplied lowercase host header', () => {
      const options = {
        headers: { host: 'example.com' },
        beforeRedirects: {},
        hostname: '127.0.0.1',
        port: 4000,
      };

      __setProxy(options, proxyConfig, 'http://127.0.0.1:4000/');

      assert.strictEqual(options.headers.host, 'example.com');
    });

    it('preserves a user-supplied Host header regardless of casing', () => {
      const options = {
        headers: { Host: 'example.com' },
        beforeRedirects: {},
        hostname: '127.0.0.1',
        port: 4000,
      };

      __setProxy(options, proxyConfig, 'http://127.0.0.1:4000/');

      assert.strictEqual(options.headers.Host, 'example.com');
      assert.strictEqual(options.headers.host, undefined);
    });

    it('preserves a user-supplied Host header across a redirect re-invocation', () => {
      const options = {
        headers: { Host: 'example.com' },
        beforeRedirects: {},
        hostname: '127.0.0.1',
        port: 4000,
      };

      __setProxy(options, proxyConfig, 'http://127.0.0.1:4000/', true);

      assert.strictEqual(options.headers.Host, 'example.com');
      assert.strictEqual(options.headers.host, undefined);
    });

    it('ignores polluted prototype Host fields when detecting user-supplied headers', () => {
      Object.prototype.host = 'polluted.example.com';

      const options = {
        headers: {},
        beforeRedirects: {},
        hostname: '127.0.0.1',
        port: 4000,
      };

      try {
        __setProxy(options, proxyConfig, 'http://127.0.0.1:4000/');

        assert.strictEqual(options.headers.host, '127.0.0.1:4000');
      } finally {
        delete Object.prototype.host;
      }
    });
  });

  describe('Proxy-Authorization header leak on redirect', () => {
    it('clears a stale Proxy-Authorization header when redirected request resolves to no proxy (configProxy=false)', () => {
      const options = {
        headers: {},
        beforeRedirects: {},
        hostname: 'initial.example.com',
        host: 'initial.example.com',
        port: 80,
      };

      __setProxy(
        options,
        { host: '127.0.0.1', port: 8030, auth: { username: 'user', password: 'pass' } },
        'http://initial.example.com/start'
      );
      assert.strictEqual(
        options.headers['Proxy-Authorization'],
        'Basic ' + Buffer.from('user:pass', 'utf8').toString('base64'),
        'initial request should carry Proxy-Authorization'
      );

      // Simulate redirect re-invocation where the redirected request is resolved to no proxy.
      // This mirrors the beforeRedirects.proxy hook being called with configProxy=false.
      const redirectOptions = {
        headers: { ...options.headers },
        beforeRedirects: {},
        hostname: 'attacker.example.com',
        host: 'attacker.example.com',
        port: 443,
      };
      __setProxy(redirectOptions, false, 'https://attacker.example.com/final', true);

      assert.strictEqual(
        redirectOptions.headers['Proxy-Authorization'],
        undefined,
        'stale Proxy-Authorization must be stripped when redirected request no longer uses a proxy'
      );
    });

    it('clears a stale Proxy-Authorization header when environment-derived proxy is bypassed on redirect (NO_PROXY)', () => {
      const originalHttpProxy = process.env.http_proxy;
      const originalHttpsProxy = process.env.https_proxy;
      const originalNoProxy = process.env.no_proxy;

      process.env.http_proxy = 'http://user:pass@127.0.0.1:8030';
      process.env.https_proxy = 'http://user:pass@127.0.0.1:8030';
      process.env.no_proxy = 'attacker.example.com';

      try {
        const options = {
          headers: {},
          beforeRedirects: {},
          hostname: 'initial.example.com',
          host: 'initial.example.com',
          port: 80,
        };

        __setProxy(options, undefined, 'http://initial.example.com/start');
        assert.strictEqual(
          options.headers['Proxy-Authorization'],
          'Basic ' + Buffer.from('user:pass', 'utf8').toString('base64'),
          'initial request should pick up proxy credentials from env'
        );

        const redirectOptions = {
          headers: { ...options.headers },
          beforeRedirects: {},
          hostname: 'attacker.example.com',
          host: 'attacker.example.com',
          port: 443,
          protocol: 'https:',
        };
        __setProxy(redirectOptions, undefined, 'https://attacker.example.com/final', true);

        assert.strictEqual(
          redirectOptions.headers['Proxy-Authorization'],
          undefined,
          'stale Proxy-Authorization must be stripped when redirect target is covered by NO_PROXY'
        );
      } finally {
        if (originalHttpProxy === undefined) delete process.env.http_proxy;
        else process.env.http_proxy = originalHttpProxy;
        if (originalHttpsProxy === undefined) delete process.env.https_proxy;
        else process.env.https_proxy = originalHttpsProxy;
        if (originalNoProxy === undefined) delete process.env.no_proxy;
        else process.env.no_proxy = originalNoProxy;
      }
    });

    it('replaces Proxy-Authorization when redirect target resolves to a different proxy without credentials', () => {
      const options = {
        headers: {},
        beforeRedirects: {},
        hostname: 'initial.example.com',
        host: 'initial.example.com',
        port: 80,
      };

      __setProxy(
        options,
        { host: '127.0.0.1', port: 8030, auth: { username: 'user', password: 'pass' } },
        'http://initial.example.com/start'
      );
      assert.ok(
        options.headers['Proxy-Authorization'],
        'precondition: initial proxy auth header set'
      );

      const redirectOptions = {
        headers: { ...options.headers },
        beforeRedirects: {},
        hostname: 'second.example.com',
        host: 'second.example.com',
        port: 80,
      };
      __setProxy(
        redirectOptions,
        { host: '127.0.0.2', port: 8031 },
        'http://second.example.com/final',
        true
      );

      assert.strictEqual(
        redirectOptions.headers['Proxy-Authorization'],
        undefined,
        'stale credentials from previous proxy must not leak to a new proxy without credentials'
      );
    });

    it('strips stale Proxy-Authorization when the beforeRedirects.proxy hook is invoked with configProxy=false', () => {
      const options = {
        headers: {
          'Proxy-Authorization': 'Basic ' + Buffer.from('user:pass', 'utf8').toString('base64'),
        },
        beforeRedirects: {},
        hostname: 'initial.example.com',
        host: 'initial.example.com',
        port: 80,
      };

      __setProxy(options, false, 'http://initial.example.com/start');
      assert.strictEqual(
        typeof options.beforeRedirects.proxy,
        'function',
        'initial setProxy must install redirect hook'
      );

      const redirectOptions = {
        headers: {
          'Proxy-Authorization': 'Basic ' + Buffer.from('user:pass', 'utf8').toString('base64'),
        },
        beforeRedirects: {},
        hostname: 'attacker.example.com',
        host: 'attacker.example.com',
        port: 443,
        href: 'https://attacker.example.com/final',
      };

      options.beforeRedirects.proxy(redirectOptions);

      assert.strictEqual(
        redirectOptions.headers['Proxy-Authorization'],
        undefined,
        'beforeRedirects.proxy hook must strip stale Proxy-Authorization when redirect target has no proxy'
      );
    });

    it('preserves a user-supplied Proxy-Authorization header on the initial request when no proxy is configured', () => {
      const userValue = 'Basic ' + Buffer.from('alice:secret', 'utf8').toString('base64');
      const options = {
        headers: { 'Proxy-Authorization': userValue },
        beforeRedirects: {},
        hostname: 'example.com',
        host: 'example.com',
        port: 80,
      };

      __setProxy(options, false, 'http://example.com/start');

      assert.strictEqual(
        options.headers['Proxy-Authorization'],
        userValue,
        'user-supplied Proxy-Authorization must not be stripped on the initial request'
      );
    });

    it('strips stale Proxy-Authorization regardless of header key casing', () => {
      const staleValue = 'Basic ' + Buffer.from('user:pass', 'utf8').toString('base64');
      const casings = [
        'proxy-authorization',
        'PROXY-AUTHORIZATION',
        'Proxy-authorization',
        'pRoXy-AuThOrIzAtIoN',
      ];

      for (const casing of casings) {
        const redirectOptions = {
          headers: { [casing]: staleValue },
          beforeRedirects: {},
          hostname: 'attacker.example.com',
          host: 'attacker.example.com',
          port: 443,
        };

        __setProxy(redirectOptions, false, 'https://attacker.example.com/final', true);

        const leaked = Object.keys(redirectOptions.headers).filter(
          (name) => name.toLowerCase() === 'proxy-authorization'
        );
        assert.deepStrictEqual(
          leaked,
          [],
          `stale Proxy-Authorization with key "${casing}" must be stripped regardless of casing`
        );
      }
    });

    // End-to-end exercise of the redirect leak. An
    // authenticated env-supplied proxy sees the initial request, 302s the
    // client to a target that NO_PROXY excludes, and the redirected request
    // must not carry the stale Proxy-Authorization to the direct target.
    it('does not forward Proxy-Authorization to a redirect target that resolves to no-proxy', async () => {
      const startServer = (handler) =>
        new Promise((resolve) => {
          const s = http.createServer(handler);
          s.listen(0, '127.0.0.1', () => resolve(s));
        });
      const stop = (s) => new Promise((r) => s.close(r));

      let attackerPort;
      const proxySaw = [];
      const attackerSaw = [];

      // The proxy receives the absolute-form URL (`GET http://target/path`) on
      // the initial request, then forwards to the destination. We short-circuit
      // by responding directly with the redirect.
      const corpProxy = await startServer((req, res) => {
        proxySaw.push({ url: req.url, proxyAuth: req.headers['proxy-authorization'] });
        res.writeHead(302, { Location: `http://127.0.0.1:${attackerPort}/final` });
        res.end();
      });

      const attacker = await startServer((req, res) => {
        attackerSaw.push({
          url: req.url,
          proxyAuth: req.headers['proxy-authorization'],
          authorization: req.headers.authorization,
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"final":true}');
      });
      attackerPort = attacker.address().port;

      const corpProxyPort = corpProxy.address().port;
      const originalHttpProxy = process.env.http_proxy;
      const originalNoProxy = process.env.no_proxy;
      process.env.http_proxy = `http://user:pass@127.0.0.1:${corpProxyPort}`;
      // NO_PROXY entry covers only the attacker target (port-specific), so the
      // initial request still uses the proxy but the redirect resolves direct.
      process.env.no_proxy = `127.0.0.1:${attackerPort}`;

      try {
        await axios.get('http://example.com/start');

        assert.ok(
          proxySaw.some((h) => h.proxyAuth),
          'precondition: corp proxy must see Proxy-Authorization on the initial request'
        );
        assert.strictEqual(
          attackerSaw.length,
          1,
          'attacker target must receive exactly the redirected request'
        );
        assert.strictEqual(
          attackerSaw[0].proxyAuth,
          undefined,
          'stale Proxy-Authorization must not leak to the redirect target'
        );
      } finally {
        if (originalHttpProxy === undefined) delete process.env.http_proxy;
        else process.env.http_proxy = originalHttpProxy;
        if (originalNoProxy === undefined) delete process.env.no_proxy;
        else process.env.no_proxy = originalNoProxy;
        await stop(corpProxy);
        await stop(attacker);
      }
    }, 10000);
  });

  it('should support cancel', async () => {
    const source = axios.CancelToken.source();

    const server = await startHTTPServer(
      (req, res) => {
        // Call cancel() when the request has been sent but no response received.
        source.cancel('Operation has been canceled.');
      },
      { port: SERVER_PORT }
    );

    try {
      await assert.rejects(
        async function stackTraceTest() {
          await axios.get(`http://localhost:${server.address().port}/`, {
            cancelToken: source.token,
          });
        },
        (thrown) => {
          assert.ok(
            thrown instanceof axios.Cancel,
            'Promise must be rejected with a CanceledError object'
          );
          assert.equal(thrown.message, 'Operation has been canceled.');

          return true;
        }
      );
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should combine baseURL and url', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.end();
      },
      { port: SERVER_PORT }
    );

    try {
      const response = await axios.get('/foo', {
        baseURL: `http://localhost:${server.address().port}/`,
      });

      assert.equal(response.config.baseURL, `http://localhost:${server.address().port}/`);
      assert.equal(response.config.url, '/foo');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support HTTP protocol', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        setTimeout(() => {
          res.end();
        }, 1000);
      },
      { port: SERVER_PORT }
    );

    try {
      const response = await axios.get(`http://localhost:${server.address().port}`);
      assert.equal(response.request.agent.protocol, 'http:');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support HTTPS protocol', async () => {
    const tlsOptions = {
      key: fs.readFileSync(path.join(adaptersTestsDir, 'key.pem')),
      cert: fs.readFileSync(path.join(adaptersTestsDir, 'cert.pem')),
    };

    const server = await new Promise((resolve, reject) => {
      const httpsServer = https
        .createServer(
          tlsOptions,
          (req, res) => {
            setTimeout(() => {
              res.end();
            }, 1000);
          },
          { port: SERVER_PORT }
        )
        .listen(SERVER_PORT, () => resolve(httpsServer));

      httpsServer.on('error', reject);
    });

    try {
      const response = await axios.get(`https://localhost:${server.address().port}`, {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      });
      assert.equal(response.request.agent.protocol, 'https:');
    } finally {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  });

  describe('HTTPS CONNECT tunneling agent management', () => {
    const buildOptions = () => ({
      headers: {},
      beforeRedirects: {},
      hostname: 'example.com',
      host: 'example.com',
      port: 443,
      path: '/',
      protocol: 'https:',
    });
    const proxyConfig = { host: '127.0.0.1', port: 8030, protocol: 'http' };

    it('reuses the same tunneling agent for repeated requests through the same proxy', () => {
      const a = buildOptions();
      const b = buildOptions();
      __setProxy(a, proxyConfig, 'https://example.com/');
      __setProxy(b, proxyConfig, 'https://example.com/');
      assert.ok(a.agent, 'first request must install a tunneling agent');
      assert.strictEqual(
        a.agent,
        b.agent,
        'subsequent requests through the same proxy must share one tunneling agent so socket pooling works'
      );
    });

    it('still tunnels through the proxy when a non-proxy httpsAgent is supplied', () => {
      const userAgent = new https.Agent({ rejectUnauthorized: false });
      const options = buildOptions();
      __setProxy(options, proxyConfig, 'https://example.com/', false, userAgent);
      assert.ok(options.agent, 'proxy must not be silently bypassed when a custom httpsAgent is set');
      assert.notStrictEqual(
        options.agent,
        userAgent,
        'tunneling agent must be installed in place of the user agent (its TLS options are forwarded internally)'
      );
      assert.ok(options.agent instanceof HttpsProxyAgent);
    });

    it('includes user httpsAgent options in the tunneling agent constructor options', () => {
      const userAgent = new https.Agent({ rejectUnauthorized: false, ca: 'sentinel-ca' });
      const options = buildOptions();
      __setProxy(options, proxyConfig, 'https://example.com/', false, userAgent);
      // Origin TLS behavior is covered by the issue #10953 integration test.
      assert.strictEqual(options.agent.proxy.rejectUnauthorized, false);
      assert.strictEqual(options.agent.proxy.ca, 'sentinel-ca');
    });

    it('respects a user-supplied HttpsProxyAgent without installing its own', () => {
      const userTunnel = new HttpsProxyAgent({
        protocol: 'http:',
        hostname: '127.0.0.1',
        port: 9999,
      });
      const options = buildOptions();
      __setProxy(options, proxyConfig, 'https://example.com/', false, userTunnel);
      // The user is handling tunneling end-to-end; setProxy must not overwrite agent.
      assert.strictEqual(options.agent, undefined, 'must not install a competing tunneling agent');
    });

    it('does not strip a user-supplied HttpsProxyAgent on redirect', () => {
      const userTunnel = new HttpsProxyAgent({
        protocol: 'http:',
        hostname: '127.0.0.1',
        port: 9999,
      });
      const redirectOptions = {
        headers: {},
        beforeRedirects: {},
        hostname: 'redirect.example.com',
        host: 'redirect.example.com',
        port: 443,
        path: '/',
        protocol: 'https:',
        agent: userTunnel,
      };
      __setProxy(redirectOptions, false, 'https://redirect.example.com/', true);
      assert.strictEqual(
        redirectOptions.agent,
        userTunnel,
        'user-supplied HttpsProxyAgent must survive redirects (no proxy on redirect target)'
      );
    });

    it('strips its own tunneling agent on redirect when the redirect target has no proxy', () => {
      const initial = buildOptions();
      __setProxy(initial, proxyConfig, 'https://example.com/');
      assert.ok(initial.agent instanceof HttpsProxyAgent, 'precondition: tunneling agent installed');

      const redirectOptions = {
        headers: {},
        beforeRedirects: {},
        hostname: 'final.example.com',
        host: 'final.example.com',
        port: 443,
        path: '/',
        protocol: 'https:',
        agent: initial.agent,
      };
      __setProxy(redirectOptions, false, 'https://final.example.com/', true);
      assert.strictEqual(
        redirectOptions.agent,
        undefined,
        'axios-installed tunneling agent must be cleared when redirect drops the proxy'
      );
    });

    it('handles IPv6 literal proxy hosts', () => {
      const options = buildOptions();
      __setProxy(
        options,
        { host: '::1', port: 8030, protocol: 'http' },
        'https://example.com/'
      );
      assert.ok(options.agent instanceof HttpsProxyAgent, 'must build a tunneling agent for an IPv6 proxy host');
    });
  });

  it('should return malformed URL', async () => {
    await assert.rejects(axios.get('tel:484-695-3408'), (error) => {
      assert.equal(error.message, 'Unsupported protocol tel:');
      return true;
    });
  });

  it('should return unsupported protocol', async () => {
    await assert.rejects(axios.get('ftp:google.com'), (error) => {
      assert.equal(error.message, 'Unsupported protocol ftp:');
      return true;
    });
  });

  it('rejects malformed HTTP URLs before Node URL normalization and preserves config', async () => {
    for (const url of ['\u0000https:example.com/users', 'h\nttp:example.com/users']) {
      await assert.rejects(
        () =>
          axios.get(url, {
            adapter: 'http',
            headers: {
              'X-Test': 'yes',
            },
          }),
        (error) => {
          assert.ok(error instanceof AxiosError);
          assert.strictEqual(error.code, AxiosError.ERR_INVALID_URL);
          assert.strictEqual(error.message, 'Invalid URL: missing "//" after protocol');
          assert.strictEqual(error.config.url, url);
          assert.strictEqual(error.config.headers.get('X-Test'), 'yes');
          return true;
        }
      );
    }
  });

  it('should supply a user-agent if one is not specified', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        assert.equal(req.headers['user-agent'], `axios/${axios.VERSION}`);
        res.end();
      },
      { port: SERVER_PORT }
    );

    try {
      await axios.get(`http://localhost:${server.address().port}/`);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should omit a user-agent if one is explicitly disclaimed', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        assert.equal('user-agent' in req.headers, false);
        assert.equal('User-Agent' in req.headers, false);
        res.end();
      },
      { port: SERVER_PORT }
    );

    try {
      await axios.get(`http://localhost:${server.address().port}/`, {
        headers: {
          'User-Agent': null,
        },
      });
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should throw an error if http server that aborts a chunked request', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain', 'X-Stream-Aborted': 'yes' });
        res.write('chunk 1');

        setTimeout(() => {
          res.write('chunk 2');
        }, 100);

        setTimeout(() => {
          res.destroy();
        }, 200);
      },
      { port: SERVER_PORT }
    );

    try {
      await assert.rejects(
        axios.get(`http://localhost:${server.address().port}/aborted`, {
          timeout: 500,
        }),
        (error) => {
          assert.strictEqual(error.code, 'ERR_BAD_RESPONSE');
          assert.strictEqual(error.message, 'stream has been aborted');
          assert.strictEqual(error.response.status, 200);
          assert.strictEqual(error.response.headers.get('x-stream-aborted'), 'yes');
          assert.strictEqual(error.status, 200);

          return true;
        }
      );
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should able to cancel multiple requests with CancelToken', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.end('ok');
      },
      { port: SERVER_PORT }
    );

    try {
      const source = axios.CancelToken.source();
      const canceledStack = [];

      const requests = [1, 2, 3, 4, 5].map(async (id) => {
        try {
          await axios.get('/foo/bar', {
            baseURL: `http://localhost:${server.address().port}`,
            cancelToken: source.token,
          });
        } catch (error) {
          if (!axios.isCancel(error)) {
            throw error;
          }

          canceledStack.push(id);
        }
      });

      source.cancel('Aborted by user');

      await Promise.all(requests);
      assert.deepStrictEqual(canceledStack.sort(), [1, 2, 3, 4, 5]);
    } finally {
      await stopHTTPServer(server);
    }
  });

  describe('FormData', () => {
    describe('form-data instance (https://www.npmjs.com/package/form-data)', () => {
      it('should allow passing FormData', async () => {
        const form = new FormDataLegacy();
        const file1 = Buffer.from('foo', 'utf8');
        const image = path.resolve(adaptersTestsDir, './axios.png');
        const fileStream = fs.createReadStream(image);
        const stat = fs.statSync(image);

        form.append('foo', 'bar');
        form.append('file1', file1, {
          filename: 'bar.jpg',
          filepath: 'temp/bar.jpg',
          contentType: 'image/jpeg',
        });
        form.append('fileStream', fileStream);

        const server = await startHTTPServer(
          (req, res) => {
            const receivedForm = new IncomingForm();

            assert.ok(req.rawHeaders.some((header) => header.toLowerCase() === 'content-length'));

            receivedForm.parse(req, (error, fields, files) => {
              if (error) {
                res.statusCode = 500;
                res.end(error.message);
                return;
              }

              res.end(
                JSON.stringify({
                  fields,
                  files,
                })
              );
            });
          },
          { port: SERVER_PORT }
        );

        try {
          const response = await axios.post(`http://localhost:${server.address().port}/`, form, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          assert.deepStrictEqual(response.data.fields, { foo: ['bar'] });

          assert.strictEqual(response.data.files.file1[0].mimetype, 'image/jpeg');
          assert.strictEqual(response.data.files.file1[0].originalFilename, 'temp/bar.jpg');
          assert.strictEqual(response.data.files.file1[0].size, 3);

          assert.strictEqual(response.data.files.fileStream[0].mimetype, 'image/png');
          assert.strictEqual(response.data.files.fileStream[0].originalFilename, 'axios.png');
          assert.strictEqual(response.data.files.fileStream[0].size, stat.size);
        } finally {
          await stopHTTPServer(server);
        }
      });
    });

    describe('SpecCompliant FormData', () => {
      it('should allow passing FormData', { retry: 2 }, async () => {
        // Use an ephemeral port and a non-keep-alive agent. Sharing the fixed
        // SERVER_PORT across tests can leave keep-alive sockets in the global
        // pool that a follow-up test picks up just as the server FINs them,
        // which surfaces here as EPIPE on the multipart write.
        const server = await startHTTPServer(
          async (req, res) => {
            const { fields, files } = await handleFormData(req);

            res.end(
              JSON.stringify({
                fields,
                files,
              })
            );
          },
          { port: 0 }
        );

        const oneShotAgent = new http.Agent({ keepAlive: false });

        try {
          const form = new FormDataSpecCompliant();
          const blobContent = 'blob-content';
          const blob = new BlobSpecCompliant([blobContent], { type: 'image/jpeg' });

          form.append('foo1', 'bar1');
          form.append('foo2', 'bar2');
          form.append('file1', blob);

          const { data } = await axios.post(`http://localhost:${server.address().port}`, form, {
            maxRedirects: 0,
            httpAgent: oneShotAgent,
            headers: { Connection: 'close' },
          });

          assert.deepStrictEqual(data.fields, { foo1: ['bar1'], foo2: ['bar2'] });
          assert.deepStrictEqual(typeof data.files.file1[0], 'object');

          const { size, mimetype, originalFilename } = data.files.file1[0];

          assert.deepStrictEqual(
            { size, mimetype, originalFilename },
            {
              mimetype: 'image/jpeg',
              originalFilename: 'blob',
              size: Buffer.from(blobContent).byteLength,
            }
          );
        } finally {
          oneShotAgent.destroy();
          await stopHTTPServer(server);
        }
      });
    });

    describe('prototype pollution', () => {
      const pollutedKeys = ['getHeaders', 'append', 'pipe', 'on', 'once'];
      const toStringTagSym = Symbol.toStringTag;

      it('should not use inherited Symbol.iterator for request or response headers', async () => {
        let capturedHeaders;
        const stubTransport = {
          request(options, handleResponse) {
            capturedHeaders = { ...options.headers };
            const req = new EventEmitter();
            req.write = () => true;
            req.setTimeout = () => {};
            req.destroy = () => {};
            req.end = () => {
              const res = new stream.Readable({ read() {} });
              res.statusCode = 200;
              res.statusMessage = 'OK';
              res.headers = { 'x-server': 'real' };
              res.rawHeaders = [];
              res.req = req;
              process.nextTick(() => {
                handleResponse(res);
                res.push(null);
              });
            };
            return req;
          },
        };

        try {
          Object.prototype[Symbol.iterator] = function* () {
            yield ['X-Injected', 'yes'];
            yield ['Authorization', 'Bearer CHANGED'];
          };

          const response = await axios.get('http://stub.invalid/', {
            headers: {
              Authorization: 'Bearer VALID_USER_TOKEN',
              'X-App': 'safe',
            },
            transport: stubTransport,
            maxRedirects: 0,
          });

          assert.ok(capturedHeaders, 'transport was not invoked');
          assert.strictEqual(capturedHeaders['X-App'], 'safe');
          assert.strictEqual(
            capturedHeaders.Authorization || capturedHeaders.authorization,
            'Bearer VALID_USER_TOKEN'
          );
          assert.strictEqual(capturedHeaders['X-Injected'] || capturedHeaders['x-injected'], undefined);
          assert.strictEqual(response.headers.get('x-server'), 'real');
          assert.strictEqual(response.headers.get('x-injected'), undefined);
        } finally {
          delete Object.prototype[Symbol.iterator];
        }
      });

      function pollute() {
        Object.prototype[toStringTagSym] = 'FormData';
        Object.prototype.append = () => {};
        Object.prototype.getHeaders = () => ({
          'x-injected': 'attacker',
          authorization: 'Bearer ATTACKER_TOKEN',
        });
        Object.prototype.pipe = function (d) {
          if (d && d.end) d.end();
          return d;
        };
        Object.prototype.on = function () {
          return this;
        };
        Object.prototype.once = function () {
          return this;
        };
      }

      function cleanup() {
        for (const k of pollutedKeys) delete Object.prototype[k];
        delete Object.prototype[toStringTagSym];
      }

      it('should not merge prototype-polluted getHeaders into outgoing request', async () => {
        // Use a stub transport rather than a real HTTP server: polluting
        // Object.prototype in-process can destabilise Node's HTTP server
        // internals and cause spurious ECONNRESET. The stub captures the final
        // outgoing headers axios constructs, which is what this test asserts on.
        let capturedHeaders;
        const stubTransport = {
          request(options, handleResponse) {
            capturedHeaders = { ...options.headers };
            const req = new EventEmitter();
            req.write = () => true;
            req.setTimeout = () => {};
            req.destroy = () => {};
            req.end = () => {
              const res = new stream.Readable({ read() {} });
              res.statusCode = 200;
              res.statusMessage = 'OK';
              res.headers = {};
              res.rawHeaders = [];
              res.req = req;
              process.nextTick(() => {
                handleResponse(res);
                res.push(null);
              });
            };
            return req;
          },
        };

        try {
          pollute();
          await axios.post(
            'http://stub.invalid/',
            { userId: 42 },
            {
              headers: { Authorization: 'Bearer VALID_USER_TOKEN' },
              transport: stubTransport,
              maxRedirects: 0,
            }
          );
        } finally {
          cleanup();
        }

        assert.ok(capturedHeaders, 'transport was not invoked');
        assert.strictEqual(capturedHeaders['x-injected'], undefined);
        assert.notStrictEqual(capturedHeaders['Authorization'], 'Bearer ATTACKER_TOKEN');
        assert.notStrictEqual(capturedHeaders['authorization'], 'Bearer ATTACKER_TOKEN');
      });
    });

    describe('formDataHeaderPolicy', () => {
      function createStubTransport(captureHeaders) {
        return {
          request(options, handleResponse) {
            captureHeaders({ ...options.headers });
            const req = new EventEmitter();
            req.write = () => true;
            req.setTimeout = () => {};
            req.destroy = () => {};
            req.end = () => {
              const res = new stream.Readable({ read() {} });
              res.statusCode = 200;
              res.statusMessage = 'OK';
              res.headers = {};
              res.rawHeaders = [];
              res.req = req;
              process.nextTick(() => {
                handleResponse(res);
                res.push(null);
              });
            };
            return req;
          },
        };
      }

      class CustomFormData extends stream.Readable {
        _read() {
          this.push(null);
        }
        append() {}
        getHeaders() {
          return {
            'content-type': 'multipart/form-data; boundary=----fake',
            'x-injected': 'custom',
            'x-forwarded-for': '10.0.0.1',
            authorization: 'Bearer CUSTOM_TOKEN',
            host: 'custom.example.com',
          };
        }
        get [Symbol.toStringTag]() {
          return 'FormData';
        }
      }

      it('preserves legacy getHeaders() propagation by default', async () => {
        let capturedHeaders;

        await axios.post('http://stub.invalid/', new CustomFormData(), {
          transport: createStubTransport((headers) => {
            capturedHeaders = headers;
          }),
          maxRedirects: 0,
        });

        assert.ok(capturedHeaders, 'transport was not invoked');
        const ct = capturedHeaders['Content-Type'] || capturedHeaders['content-type'];
        assert.match(ct, /multipart\/form-data/);
        assert.strictEqual(capturedHeaders['x-injected'], 'custom');
        assert.strictEqual(capturedHeaders['x-forwarded-for'], '10.0.0.1');
        assert.strictEqual(
          capturedHeaders.Authorization || capturedHeaders.authorization,
          'Bearer CUSTOM_TOKEN'
        );
        assert.strictEqual(capturedHeaders.Host || capturedHeaders.host, 'custom.example.com');
      });

      it('only copies content headers when formDataHeaderPolicy is content-only', async () => {
        let capturedHeaders;

        await axios.post('http://stub.invalid/', new CustomFormData(), {
          transport: createStubTransport((headers) => {
            capturedHeaders = headers;
          }),
          maxRedirects: 0,
          formDataHeaderPolicy: 'content-only',
        });

        assert.ok(capturedHeaders, 'transport was not invoked');
        const ct = capturedHeaders['Content-Type'] || capturedHeaders['content-type'];
        assert.match(ct, /multipart\/form-data/);
        assert.strictEqual(capturedHeaders['x-injected'], undefined);
        assert.strictEqual(capturedHeaders['x-forwarded-for'], undefined);
        assert.strictEqual(
          capturedHeaders.Authorization || capturedHeaders.authorization,
          undefined
        );
        assert.strictEqual(capturedHeaders.Host || capturedHeaders.host, undefined);
      });
    });
  });

  describe('toFormData helper', () => {
    it('should properly serialize nested objects for parsing with multer.js (express.js)', async () => {
      const app = express();
      const obj = {
        arr1: ['1', '2', '3'],
        arr2: ['1', ['2'], '3'],
        obj: { x: '1', y: { z: '1' } },
        users: [
          { name: 'Peter', surname: 'griffin' },
          { name: 'Thomas', surname: 'Anderson' },
        ],
      };

      app.post('/', multer().none(), (req, res) => {
        res.send(JSON.stringify(req.body));
      });

      const server = await new Promise(
        (resolve, reject) => {
          const expressServer = app.listen(0, () => resolve(expressServer));
          expressServer.on('error', reject);
        },
        { port: SERVER_PORT }
      );

      try {
        await Promise.all(
          [null, false, true].map((mode) =>
            axios
              .postForm(`http://localhost:${server.address().port}/`, obj, {
                formSerializer: { indexes: mode },
              })
              .then((response) => {
                assert.deepStrictEqual(response.data, obj, `Index mode ${mode}`);
              })
          )
        );
      } finally {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      }
    });

    it('should only match explicit routes for express 5 form handlers', async () => {
      const app = express();

      app.post('/', multer().none(), (req, res) => {
        res.status(200).send(JSON.stringify({ route: 'root', body: req.body }));
      });

      app.post('/unexpected', multer().none(), (req, res) => {
        res.status(418).send('wrong-route');
      });

      const server = await new Promise(
        (resolve, reject) => {
          const expressServer = app.listen(0, () => resolve(expressServer));
          expressServer.on('error', reject);
        },
        { port: SERVER_PORT }
      );

      const rootUrl = `http://localhost:${server.address().port}`;

      try {
        const rootResponse = await axios.postForm(rootUrl, { foo: 'bar' });
        assert.strictEqual(rootResponse.status, 200);
        assert.deepStrictEqual(rootResponse.data, { route: 'root', body: { foo: 'bar' } });

        await assert.rejects(
          () => axios.postForm(`${rootUrl}/unexpected`, { foo: 'bar' }),
          (error) => {
            assert.strictEqual(error.response.status, 418);
            assert.strictEqual(error.response.data, 'wrong-route');
            return true;
          }
        );
      } finally {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      }
    });
  });

  describe('Blob', () => {
    it('should support Blob', async () => {
      const server = await startHTTPServer(
        async (req, res) => {
          res.end(await getStream(req));
        },
        { port: SERVER_PORT }
      );

      try {
        const blobContent = 'blob-content';
        const blob = new BlobSpecCompliant([blobContent], { type: 'image/jpeg' });

        const { data } = await axios.post(`http://localhost:${server.address().port}`, blob, {
          maxRedirects: 0,
        });

        assert.deepStrictEqual(data, blobContent);
      } finally {
        await stopHTTPServer(server);
      }
    });
  });

  describe('URLEncoded Form', () => {
    it('should post object data as url-encoded form regardless of content-type header casing', async () => {
      const app = express();
      const obj = {
        arr1: ['1', '2', '3'],
        arr2: ['1', ['2'], '3'],
        obj: { x: '1', y: { z: '1' } },
        users: [
          { name: 'Peter', surname: 'griffin' },
          { name: 'Thomas', surname: 'Anderson' },
        ],
      };

      app.use(bodyParser.urlencoded({ extended: true }));

      app.post('/', (req, res) => {
        res.send(JSON.stringify(req.body));
      });

      const server = await new Promise(
        (resolve, reject) => {
          const expressServer = app.listen(0, () => resolve(expressServer));
          expressServer.on('error', reject);
        },
        { port: SERVER_PORT }
      );

      try {
        for (const headerName of ['content-type', 'Content-Type']) {
          const response = await axios.post(`http://localhost:${server.address().port}/`, obj, {
            headers: {
              [headerName]: 'application/x-www-form-urlencoded',
            },
          });

          assert.deepStrictEqual(response.data, obj);
        }
      } finally {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      }
    });

    it('should respect formSerializer config', async () => {
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

      const server = await startHTTPServer(
        (req, res) => {
          req.pipe(res);
        },
        { port: SERVER_PORT }
      );

      try {
        const response = await axios.post(`http://localhost:${server.address().port}/`, obj, {
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
          formSerializer: {
            indexes: true,
          },
        });

        assert.strictEqual(response.data, form.toString());
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should parse nested urlencoded payloads and ignore mismatched content-type', async () => {
      const app = express();

      app.use(bodyParser.urlencoded({ extended: true }));

      app.post('/', (req, res) => {
        const parserRanBeforeHandler = Boolean(req.body && Object.keys(req.body).length);

        res.send(
          JSON.stringify({
            parserRanBeforeHandler,
            body: req.body,
          })
        );
      });

      const server = await new Promise(
        (resolve, reject) => {
          const expressServer = app.listen(0, () => resolve(expressServer));
          expressServer.on('error', reject);
        },
        { port: SERVER_PORT }
      );

      const rootUrl = `http://localhost:${server.address().port}/`;
      const payload = 'user[name]=Peter&tags[]=a&tags[]=b';

      try {
        const parsedResponse = await axios.post(rootUrl, payload, {
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
        });

        assert.deepStrictEqual(parsedResponse.data, {
          parserRanBeforeHandler: true,
          body: {
            user: { name: 'Peter' },
            tags: ['a', 'b'],
          },
        });

        const ignoredResponse = await axios.post(rootUrl, payload, {
          headers: {
            'content-type': 'text/plain',
          },
        });

        assert.strictEqual(ignoredResponse.data.parserRanBeforeHandler, false);
        assert.notDeepStrictEqual(ignoredResponse.data.body, {
          user: { name: 'Peter' },
          tags: ['a', 'b'],
        });
      } finally {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      }
    });
  });

  describe('Data URL', () => {
    it('should support requesting data URL as a Buffer', async () => {
      const buffer = Buffer.from('123');
      const dataURI = `data:application/octet-stream;base64,${buffer.toString('base64')}`;

      const { data } = await axios.get(dataURI);
      assert.deepStrictEqual(data, buffer);
    });

    it('should support requesting data URL as a Blob (if supported by the environment)', async () => {
      if (!isBlobSupported) {
        return;
      }

      const buffer = Buffer.from('123');
      const dataURI = `data:application/octet-stream;base64,${buffer.toString('base64')}`;

      const { data } = await axios.get(dataURI, { responseType: 'blob' });
      assert.strictEqual(data.type, 'application/octet-stream');
      assert.deepStrictEqual(await data.text(), '123');
    });

    it('should support requesting data URL as a String (text)', async () => {
      const buffer = Buffer.from('123', 'utf-8');
      const dataURI = `data:application/octet-stream;base64,${buffer.toString('base64')}`;

      const { data } = await axios.get(dataURI, { responseType: 'text' });
      assert.deepStrictEqual(data, '123');
    });

    it('should support requesting data URL as a Stream', async () => {
      const buffer = Buffer.from('123', 'utf-8');
      const dataURI = `data:application/octet-stream;base64,${buffer.toString('base64')}`;

      const { data } = await axios.get(dataURI, { responseType: 'stream' });
      assert.strictEqual(await getStream(data), '123');
    });
  });

  describe('progress', () => {
    describe('upload', () => {
      it('should support upload progress capturing', async () => {
        const server = await startHTTPServer(
          {
            rate: 100 * 1024,
          },
          { port: SERVER_PORT }
        );

        try {
          let content = '';
          const count = 10;
          const chunk = 'test';
          const chunkLength = Buffer.byteLength(chunk);
          const contentLength = count * chunkLength;

          const readable = stream.Readable.from(
            (async function* () {
              let i = count;

              while (i-- > 0) {
                await setTimeoutAsync(1100);
                content += chunk;
                yield chunk;
              }
            })()
          );

          const samples = [];

          const { data } = await axios.post(`http://localhost:${server.address().port}`, readable, {
            onUploadProgress: ({ loaded, total, progress, bytes, upload }) => {
              samples.push({
                loaded,
                total,
                progress,
                bytes,
                upload,
              });
            },
            headers: {
              'Content-Length': contentLength,
            },
            responseType: 'text',
          });

          assert.strictEqual(data, content);
          assert.deepStrictEqual(
            samples,
            Array.from(
              (function* () {
                for (let i = 1; i <= 10; i++) {
                  yield {
                    loaded: chunkLength * i,
                    total: contentLength,
                    progress: (chunkLength * i) / contentLength,
                    bytes: 4,
                    upload: true,
                  };
                }
              })()
            )
          );
        } finally {
          await stopHTTPServer(server);
        }
      }, 15000);
    });

    describe('download', () => {
      it('should support download progress capturing', async () => {
        const server = await startHTTPServer(
          {
            rate: 100 * 1024,
          },
          { port: SERVER_PORT }
        );

        try {
          let content = '';
          const count = 10;
          const chunk = 'test';
          const chunkLength = Buffer.byteLength(chunk);
          const contentLength = count * chunkLength;

          const readable = stream.Readable.from(
            (async function* () {
              let i = count;

              while (i-- > 0) {
                await setTimeoutAsync(1100);
                content += chunk;
                yield chunk;
              }
            })()
          );

          const samples = [];

          const { data } = await axios.post(`http://localhost:${server.address().port}`, readable, {
            onDownloadProgress: ({ loaded, total, progress, bytes, download }) => {
              samples.push({
                loaded,
                total,
                progress,
                bytes,
                download,
              });
            },
            headers: {
              'Content-Length': contentLength,
            },
            responseType: 'text',
            maxRedirects: 0,
          });

          assert.strictEqual(data, content);
          assert.deepStrictEqual(
            samples,
            Array.from(
              (function* () {
                for (let i = 1; i <= 10; i++) {
                  yield {
                    loaded: chunkLength * i,
                    total: contentLength,
                    progress: (chunkLength * i) / contentLength,
                    bytes: 4,
                    download: true,
                  };
                }
              })()
            )
          );
        } finally {
          await stopHTTPServer(server);
        }
      }, 15000);
    });
  });

  describe('Rate limit', () => {
    it('should support upload rate limit', async () => {
      const secs = 10;
      const configRate = 100000;
      const chunkLength = configRate * secs;
      const server = await startHTTPServer();

      try {
        const buf = Buffer.alloc(chunkLength).fill('s');
        const samples = [];
        const skip = 4;
        const compareValues = toleranceRange(50, 50);

        const { data } = await axios.post(`http://localhost:${server.address().port}`, buf, {
          onUploadProgress: ({ loaded, total, progress, bytes, rate }) => {
            samples.push({
              loaded,
              total,
              progress,
              bytes,
              rate,
            });
          },
          maxRate: [configRate],
          responseType: 'text',
          maxRedirects: 0,
        });

        samples.slice(skip).forEach(({ rate, progress }, i, _samples) => {
          assert.ok(
            compareValues(rate, configRate),
            `Rate sample at index ${i} is out of the expected range (${rate} / ${configRate}) [${_samples
              .map((sample) => sample.rate)
              .join(', ')}]`
          );

          const progressTicksRate = 2;
          const expectedProgress = (i + skip) / secs / progressTicksRate;

          assert.ok(
            Math.abs(expectedProgress - progress) < 0.25,
            `Progress sample at index ${i} is out of the expected range (${progress} / ${expectedProgress}) [${_samples
              .map((sample) => sample.progress)
              .join(', ')}]`
          );
        });

        assert.strictEqual(data, buf.toString(), 'content corrupted');
      } finally {
        await stopHTTPServer(server);
      }
    }, 30000);

    it('should support download rate limit', async () => {
      const secs = 10;
      const configRate = 100000;
      const chunkLength = configRate * secs;
      const server = await startHTTPServer();

      try {
        const buf = Buffer.alloc(chunkLength).fill('s');
        const samples = [];
        const skip = 4;
        const compareValues = toleranceRange(50, 50);

        const { data } = await axios.post(`http://localhost:${server.address().port}`, buf, {
          onDownloadProgress: ({ loaded, total, progress, bytes, rate }) => {
            samples.push({
              loaded,
              total,
              progress,
              bytes,
              rate,
            });
          },
          maxRate: [0, configRate],
          responseType: 'text',
          maxRedirects: 0,
        });

        samples.slice(skip).forEach(({ rate, progress }, i, _samples) => {
          assert.ok(
            compareValues(rate, configRate),
            `Rate sample at index ${i} is out of the expected range (${rate} / ${configRate}) [${_samples
              .map((sample) => sample.rate)
              .join(', ')}]`
          );

          const progressTicksRate = 3;
          const expectedProgress = (i + skip) / secs / progressTicksRate;

          assert.ok(
            Math.abs(expectedProgress - progress) < 0.25,
            `Progress sample at index ${i} is out of the expected range (${progress} / ${expectedProgress}) [${_samples
              .map((sample) => sample.progress)
              .join(', ')}]`
          );
        });

        assert.strictEqual(data, buf.toString(), 'content corrupted');
      } finally {
        await stopHTTPServer(server);
      }
    }, 30000);
  });

  describe('request aborting', () => {
    it('should be able to abort the response stream', async () => {
      const server = await startHTTPServer(
        {
          rate: 100000,
          useBuffering: true,
        },
        { port: SERVER_PORT }
      );

      try {
        const buf = Buffer.alloc(1024 * 1024);
        const controller = new AbortController();

        const { data } = await axios.post(`http://localhost:${server.address().port}`, buf, {
          responseType: 'stream',
          signal: controller.signal,
          maxRedirects: 0,
        });

        setTimeout(() => {
          controller.abort();
        }, 500);

        let streamError;
        data.on('error', (error) => {
          streamError = error;
        });

        await assert.rejects(
          new Promise((resolve, reject) => {
            stream.pipeline(data, devNull(), (error) => {
              if (error) {
                reject(error);
                return;
              }

              resolve();
            });
          })
        );

        assert.strictEqual(streamError && streamError.code, 'ERR_CANCELED');
      } finally {
        await stopHTTPServer(server);
      }
    });
  });

  it('should properly handle synchronous errors inside the adapter', async () => {
    await assert.rejects(() => axios.get('http://192.168.0.285'), /Invalid URL/);
  });

  it('should support function as paramsSerializer value', async () => {
    const server = await startHTTPServer((req, res) => res.end(req.url), { port: SERVER_PORT });

    try {
      const { data } = await axios.post(`http://localhost:${server.address().port}`, 'test', {
        params: {
          x: 1,
        },
        paramsSerializer: () => 'foo',
        maxRedirects: 0,
      });

      assert.strictEqual(data, '/?foo');
    } finally {
      await stopHTTPServer(server);
    }
  });

  describe('DNS', () => {
    it('should support a custom DNS lookup function', async () => {
      const server = await startHTTPServer(SERVER_HANDLER_STREAM_ECHO);
      const payload = 'test';
      let isCalled = false;

      try {
        const { data } = await axios.post(
          `http://fake-name.axios:${server.address().port}`,
          payload,
          {
            lookup: (hostname, opt, cb) => {
              isCalled = true;
              cb(null, '127.0.0.1', 4);
            },
          }
        );

        assert.ok(isCalled);
        assert.strictEqual(data, payload);
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should support a custom DNS lookup function with address entry passing', async () => {
      const server = await startHTTPServer(SERVER_HANDLER_STREAM_ECHO);
      const payload = 'test';
      let isCalled = false;

      try {
        const { data } = await axios.post(
          `http://fake-name.axios:${server.address().port}`,
          payload,
          {
            lookup: (hostname, opt, cb) => {
              isCalled = true;
              cb(null, { address: '127.0.0.1', family: 4 });
            },
          }
        );

        assert.ok(isCalled);
        assert.strictEqual(data, payload);
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should support a custom DNS lookup function (async)', async () => {
      const server = await startHTTPServer(SERVER_HANDLER_STREAM_ECHO);
      const payload = 'test';
      let isCalled = false;

      try {
        const { data } = await axios.post(
          `http://fake-name.axios:${server.address().port}`,
          payload,
          {
            lookup: async (hostname, opt) => {
              isCalled = true;
              return ['127.0.0.1', 4];
            },
          }
        );

        assert.ok(isCalled);
        assert.strictEqual(data, payload);
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should support a custom DNS lookup function with address entry (async)', async () => {
      const server = await startHTTPServer(SERVER_HANDLER_STREAM_ECHO);
      const payload = 'test';
      let isCalled = false;

      try {
        const { data } = await axios.post(
          `http://fake-name.axios:${server.address().port}`,
          payload,
          {
            lookup: async (hostname, opt) => {
              isCalled = true;
              return { address: '127.0.0.1', family: 4 };
            },
          }
        );

        assert.ok(isCalled);
        assert.strictEqual(data, payload);
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should support a custom DNS lookup function that returns only IP address (async)', async () => {
      const server = await startHTTPServer(SERVER_HANDLER_STREAM_ECHO);
      const payload = 'test';
      let isCalled = false;

      try {
        const { data } = await axios.post(
          `http://fake-name.axios:${server.address().port}`,
          payload,
          {
            lookup: async (hostname, opt) => {
              isCalled = true;
              return '127.0.0.1';
            },
          }
        );

        assert.ok(isCalled);
        assert.strictEqual(data, payload);
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should handle errors', async () => {
      await assert.rejects(async () => {
        await axios.get('https://no-such-domain-987654.com', {
          lookup,
        });
      }, /ENOTFOUND/);
    });
  });

  describe('JSON', () => {
    it('should support reviver on JSON.parse', async () => {
      const server = await startHTTPServer(
        async (_, res) => {
          res.end(
            JSON.stringify({
              foo: 'bar',
            })
          );
        },
        { port: SERVER_PORT }
      );

      try {
        const { data } = await axios.get(`http://localhost:${server.address().port}`, {
          parseReviver: (key, value) => {
            return key === 'foo' ? 'success' : value;
          },
        });

        assert.deepStrictEqual(data, { foo: 'success' });
      } finally {
        await stopHTTPServer(server);
      }
    });
  });

  describe('HTTP2', () => {
    const createHttp2Axios = (baseURL) =>
      axios.create({
        baseURL,
        httpVersion: 2,
        http2Options: {
          rejectUnauthorized: false,
        },
      });

    it('should merge request http2Options with its instance config', async () => {
      const http2Axios = createHttp2Axios('https://localhost:8080');

      const { data } = await http2Axios.get('/', {
        http2Options: {
          foo: 'test',
        },
        adapter: async (config) => {
          return {
            data: config.http2Options,
          };
        },
      });

      assert.deepStrictEqual(data, {
        rejectUnauthorized: false,
        foo: 'test',
      });
    });

    it('should support http2 transport', async () => {
      const server = await startHTTPServer(
        (req, res) => {
          res.end('OK');
        },
        {
          useHTTP2: true,
          port: SERVER_PORT,
        }
      );

      try {
        const localServerURL = `https://localhost:${server.address().port}`;
        const http2Axios = createHttp2Axios(localServerURL);
        const { data } = await http2Axios.get(localServerURL);
        assert.deepStrictEqual(data, 'OK');
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should support request payload', async () => {
      const server = await startHTTPServer(null, {
        useHTTP2: true,
        port: SERVER_PORT,
      });

      try {
        const localServerURL = `https://localhost:${server.address().port}`;
        const http2Axios = createHttp2Axios(localServerURL);
        const payload = 'DATA';
        const { data } = await http2Axios.post(localServerURL, payload);
        assert.deepStrictEqual(data, payload);
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should enforce maxBodyLength for HTTP/2 streamed uploads', async () => {
      let bytesReceived = 0;
      const server = await startHTTPServer(
        (req, res) => {
          req.on('data', (chunk) => {
            bytesReceived += chunk.length;
          });
          req.on('error', () => {});
          req.on('end', () => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ received: bytesReceived }));
          });
        },
        {
          useHTTP2: true,
          port: SERVER_PORT,
        }
      );

      try {
        const localServerURL = `https://localhost:${server.address().port}`;
        const http2Axios = createHttp2Axios(localServerURL);
        const payload = Buffer.alloc(2 * 1024 * 1024, 0x63);
        const source = stream.Readable.from([payload]);

        await assert.rejects(
          http2Axios.post(localServerURL, source, {
            maxBodyLength: 1024,
            headers: { 'Content-Type': 'application/octet-stream' },
          }),
          (error) => {
            assert.strictEqual(error.message, 'Request body larger than maxBodyLength limit');
            assert.strictEqual(error.code, AxiosError.ERR_BAD_REQUEST);
            return true;
          }
        );

        assert.ok(
          bytesReceived <= 1024 * 4,
          `server should not receive full payload; got ${bytesReceived}`
        );
      } finally {
        if (server.closeAllSessions) {
          server.closeAllSessions();
        }
        await stopHTTPServer(server);
      }
    });

    it('should support FormData as a payload', async () => {
      if (typeof FormData !== 'function') {
        return;
      }

      const server = await startHTTPServer(
        async (req, res) => {
          const { fields, files } = await handleFormData(req);

          res.end(
            JSON.stringify({
              fields,
              files,
            })
          );
        },
        {
          useHTTP2: true,
          port: SERVER_PORT,
        }
      );

      try {
        const localServerURL = `https://localhost:${server.address().port}`;
        const http2Axios = createHttp2Axios(localServerURL);
        const form = new FormData();
        form.append('x', 'foo');
        form.append('y', 'bar');

        const { data } = await http2Axios.post(localServerURL, form);

        assert.deepStrictEqual(data, {
          fields: {
            x: ['foo'],
            y: ['bar'],
          },
          files: {},
        });
      } finally {
        await stopHTTPServer(server);
      }
    });

    describe('response types', () => {
      const originalData = '{"test": "OK"}';
      const fixtures = {
        text: (value) => assert.strictEqual(value, originalData),
        arraybuffer: (value) => assert.deepStrictEqual(value, Buffer.from(originalData)),
        stream: async (value) => assert.deepStrictEqual(await getStream(value), originalData),
        json: async (value) => assert.deepStrictEqual(value, JSON.parse(originalData)),
      };

      for (const [responseType, assertValue] of Object.entries(fixtures)) {
        it(`should support ${responseType} response type`, async () => {
          const server = await startHTTPServer(
            (req, res) => {
              res.end(originalData);
            },
            {
              useHTTP2: true,
              port: SERVER_PORT,
            }
          );

          try {
            const localServerURL = `https://localhost:${server.address().port}`;
            const http2Axios = createHttp2Axios(localServerURL);
            const { data } = await http2Axios.get(localServerURL, {
              responseType,
            });
            await assertValue(data);
          } finally {
            await stopHTTPServer(server);
          }
        });
      }
    });

    it('should support request timeout', async () => {
      let isAborted = false;
      let aborted;
      const promise = new Promise((resolve) => (aborted = resolve));

      const server = await startHTTPServer(
        (req, res) => {
          setTimeout(() => {
            res.end('OK');
          }, 15000);
        },
        {
          useHTTP2: true,
          port: SERVER_PORT,
        }
      );

      try {
        const localServerURL = `https://localhost:${server.address().port}`;
        const http2Axios = createHttp2Axios(localServerURL);

        server.on('stream', (http2Stream) => {
          http2Stream.once('aborted', () => {
            isAborted = true;
            aborted();
          });
        });

        await assert.rejects(async () => {
          await http2Axios.get(localServerURL, {
            timeout: 500,
          });
        }, /timeout/);

        await promise;
        assert.ok(isAborted);
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should support request cancellation', async () => {
      if (typeof AbortSignal !== 'function' || !AbortSignal.timeout) {
        return;
      }

      let isAborted = false;
      let aborted;
      const promise = new Promise((resolve) => (aborted = resolve));

      const server = await startHTTPServer(
        (req, res) => {
          setTimeout(() => {
            res.end('OK');
          }, 15000);
        },
        {
          useHTTP2: true,
          port: SERVER_PORT,
        }
      );

      try {
        const localServerURL = `https://localhost:${server.address().port}`;
        const http2Axios = createHttp2Axios(localServerURL);

        server.on('stream', (http2Stream) => {
          http2Stream.once('aborted', () => {
            isAborted = true;
            aborted();
          });
        });

        await assert.rejects(async () => {
          await http2Axios.get(localServerURL, {
            signal: AbortSignal.timeout(500),
          });
        }, /CanceledError: canceled/);

        await promise;
        assert.ok(isAborted);
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should support stream response cancellation', async () => {
      let isAborted = false;
      const source = axios.CancelToken.source();

      let aborted;
      const promise = new Promise((resolve) => (aborted = resolve));

      const server = await startHTTPServer(
        (req, res) => {
          generateReadable(10000, 100, 100).pipe(res);
        },
        {
          useHTTP2: true,
          port: SERVER_PORT,
        }
      );

      try {
        const localServerURL = `https://localhost:${server.address().port}`;
        const http2Axios = createHttp2Axios(localServerURL);

        server.on('stream', (http2Stream) => {
          http2Stream.once('aborted', () => {
            isAborted = true;
            aborted();
          });
        });

        const { data } = await http2Axios.get(localServerURL, {
          cancelToken: source.token,
          responseType: 'stream',
        });

        setTimeout(() => source.cancel());

        await assert.rejects(
          new Promise((resolve, reject) => {
            stream.pipeline(data, devNull(), (error) => {
              if (error) {
                reject(error);
                return;
              }

              resolve();
            });
          }),
          /CanceledError: canceled/
        );

        await promise;
        assert.ok(isAborted);
      } finally {
        await stopHTTPServer(server);
      }
    });

    describe('session', () => {
      // HTTP2 session tests are sensitive to cross-test port reuse: when one
      // test's server is torn down (closeAllSessions destroys h2 sessions),
      // a follow-up test binding the same port can observe a "Premature
      // close" on its own stream. Use ephemeral ports (port: 0, the default
      // from startHTTPServer) and a small retry budget as a backstop.
      it('should reuse session for the target authority', { retry: 2 }, async () => {
        const server = await startHTTPServer(
          (req, res) => {
            setTimeout(() => res.end('OK'), 1000);
          },
          {
            useHTTP2: true,
          }
        );

        try {
          const localServerURL = `https://localhost:${server.address().port}`;
          const http2Axios = createHttp2Axios(localServerURL);

          const [response1, response2] = await Promise.all([
            http2Axios.get(localServerURL, {
              responseType: 'stream',
            }),
            http2Axios.get(localServerURL, {
              responseType: 'stream',
            }),
          ]);

          assert.strictEqual(response1.data.session, response2.data.session);

          assert.deepStrictEqual(
            await Promise.all([getStream(response1.data), getStream(response2.data)]),
            ['OK', 'OK']
          );
        } finally {
          await stopHTTPServer(server);
        }
      });

      it('should use different sessions for different authorities', { retry: 2 }, async () => {
        const server = await startHTTPServer(
          (req, res) => {
            setTimeout(() => {
              res.end('OK');
            }, 2000);
          },
          {
            useHTTP2: true,
          }
        );

        const server2 = await startHTTPServer(
          (req, res) => {
            setTimeout(() => {
              res.end('OK');
            }, 2000);
          },
          {
            useHTTP2: true,
          }
        );

        try {
          const localServerURL = `https://localhost:${server.address().port}`;
          const localServerURL2 = `https://localhost:${server2.address().port}`;
          const http2Axios = createHttp2Axios(localServerURL);

          const [response1, response2] = await Promise.all([
            http2Axios.get(localServerURL, {
              responseType: 'stream',
            }),
            http2Axios.get(localServerURL2, {
              responseType: 'stream',
            }),
          ]);

          assert.notStrictEqual(response1.data.session, response2.data.session);

          assert.deepStrictEqual(
            await Promise.all([getStream(response1.data), getStream(response2.data)]),
            ['OK', 'OK']
          );
        } finally {
          await Promise.all([stopHTTPServer(server), stopHTTPServer(server2)]);
        }
      });

      it(
        'should use different sessions for requests with different http2Options set',
        { retry: 2 },
        async () => {
          const server = await startHTTPServer(
            (req, res) => {
              setTimeout(() => {
                res.end('OK');
              }, 1000);
            },
            {
              useHTTP2: true,
            }
          );

          try {
            const localServerURL = `https://localhost:${server.address().port}`;
            const http2Axios = createHttp2Axios(localServerURL);

            const [response1, response2] = await Promise.all([
              http2Axios.get(localServerURL, {
                http2Options: {
                  sessionTimeout: 2000,
                },
              }),
              http2Axios.get(localServerURL, {
                http2Options: {
                  sessionTimeout: 4000,
                },
              }),
            ]);

            assert.notStrictEqual(response1.request.session, response2.request.session);
            assert.deepStrictEqual([response1.data, response2.data], ['OK', 'OK']);
          } finally {
            await stopHTTPServer(server);
          }
        }
      );

      it(
        'should use the same session for request with the same resolved http2Options set',
        { retry: 2 },
        async () => {
          const server = await startHTTPServer(
            (req, res) => {
              setTimeout(() => res.end('OK'), 1000);
            },
            {
              useHTTP2: true,
            }
          );

          try {
            const localServerURL = `https://localhost:${server.address().port}`;
            const http2Axios = createHttp2Axios(localServerURL);

            const responses = await Promise.all([
              http2Axios.get(localServerURL, {
                responseType: 'stream',
              }),
              http2Axios.get(localServerURL, {
                responseType: 'stream',
                http2Options: undefined,
              }),
              http2Axios.get(localServerURL, {
                responseType: 'stream',
                http2Options: {},
              }),
            ]);

            assert.strictEqual(responses[1].data.session, responses[0].data.session);
            assert.strictEqual(responses[2].data.session, responses[0].data.session);

            assert.deepStrictEqual(
              await Promise.all(responses.map(({ data }) => getStream(data))),
              ['OK', 'OK', 'OK']
            );
          } finally {
            await stopHTTPServer(server);
          }
        }
      );

      it(
        'should use different sessions after previous session timeout',
        { retry: 2, timeout: 15000 },
        async () => {
          const server = await startHTTPServer(
            (req, res) => {
              setTimeout(() => res.end('OK'), 100);
            },
            {
              useHTTP2: true,
            }
          );

          try {
            const localServerURL = `https://localhost:${server.address().port}`;
            const http2Axios = createHttp2Axios(localServerURL);

            const response1 = await http2Axios.get(localServerURL, {
              responseType: 'stream',
              http2Options: {
                sessionTimeout: 1000,
              },
            });

            const session1 = response1.data.session;
            const data1 = await getStream(response1.data);

            await setTimeoutAsync(5000);

            const response2 = await http2Axios.get(localServerURL, {
              responseType: 'stream',
              http2Options: {
                sessionTimeout: 1000,
              },
            });

            const session2 = response2.data.session;
            const data2 = await getStream(response2.data);

            assert.notStrictEqual(session1, session2);
            assert.strictEqual(data1, 'OK');
            assert.strictEqual(data2, 'OK');
          } finally {
            await stopHTTPServer(server);
          }
        }
      );
    });
  });

  it('should not abort stream on settle rejection', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.statusCode = 404;
        res.end('OK');
      },
      { port: SERVER_PORT }
    );

    try {
      let error;

      try {
        await axios.get(`http://localhost:${server.address().port}`, {
          responseType: 'stream',
        });
      } catch (err) {
        error = err;
      }

      assert.ok(error, 'request should be rejected');
      assert.strictEqual(await getStream(error.response.data), 'OK');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should reject when only the request socket emits an error', async () => {
    const noop = () => {};
    const socket = new EventEmitter();
    socket.setKeepAlive = noop;
    socket.on('error', noop);

    const transport = {
      request() {
        return new (class MockRequest extends EventEmitter {
          constructor() {
            super();
            this.destroyed = false;
          }

          setTimeout() {}

          write() {}

          end() {
            this.emit('socket', socket);

            setImmediate(() => {
              socket.emit('error', Object.assign(new Error('write EPIPE'), { code: 'EPIPE' }));
            });
          }

          destroy(err) {
            if (this.destroyed) {
              return;
            }

            this.destroyed = true;
            err && this.emit('error', err);
            this.emit('close');
          }
        })();
      },
    };

    const error = await Promise.race([
      axios.post('http://example.com/', 'test', {
        transport,
        maxRedirects: 0,
      }),
      setTimeoutAsync(200).then(() => {
        throw new Error('socket error did not reject the request');
      }),
    ]).catch((err) => err);

    assert.ok(error instanceof AxiosError);
    assert.strictEqual(error.code, 'EPIPE');
    assert.strictEqual(error.message, 'write EPIPE');
  });

  describe('keep-alive', () => {
    it('should not emit MaxListenersExceededWarning under concurrent requests through a pooled keep-alive agent (regression #10780)', async () => {
      const server = await startHTTPServer(
        (req, res) => {
          // Small delay forces concurrent requests to queue on the single pooled socket.
          setTimeout(() => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('ok');
          }, 5);
        },
        { port: SERVER_PORT }
      );

      const warnings = [];
      const warningHandler = (warning) => {
        if (warning && warning.name === 'MaxListenersExceededWarning') {
          warnings.push(warning);
        }
      };
      process.on('warning', warningHandler);

      const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });

      try {
        const baseURL = `http://localhost:${server.address().port}`;
        const CONCURRENCY = 30;

        const results = await Promise.all(
          Array.from({ length: CONCURRENCY }, (_, i) =>
            axios.get(`/req-${i}`, { baseURL, httpAgent: agent })
          )
        );

        assert.strictEqual(results.length, CONCURRENCY);
        for (const r of results) {
          assert.strictEqual(r.status, 200);
          assert.strictEqual(r.data, 'ok');
        }

        // Allow any deferred process 'warning' emissions to flush.
        await setTimeoutAsync(50);

        assert.strictEqual(
          warnings.length,
          0,
          `expected no MaxListenersExceededWarning, got ${warnings.length}: ${warnings.map((w) => w.message).join('; ')}`
        );

        // Inspect live sockets on the agent: none should have more than one
        // axios-installed error listener, regardless of how many requests ran.
        const allSockets = []
          .concat(...Object.values(agent.sockets || {}))
          .concat(...Object.values(agent.freeSockets || {}));
        for (const sock of allSockets) {
          assert.ok(
            sock.listenerCount('error') <= 2,
            `socket should have at most a couple of error listeners (agent + axios), got ${sock.listenerCount('error')}`
          );
        }
      } finally {
        process.removeListener('warning', warningHandler);
        agent.destroy();
        await stopHTTPServer(server);
      }
    }, 30000);

    it('should not leak memory via retained request closures under a long burst of keep-alive requests (regression #10780)', async () => {
      // This guards against stage88's report of OOM at ~480k sequential requests:
      // if the per-request closure leaked, heap would grow linearly. We simulate
      // a shorter burst and verify retained closures are released (via WeakRef
      // reachability check after GC, if exposed).
      if (typeof global.gc !== 'function') {
        // Skip when GC is not exposed (run with `node --expose-gc`).
        return;
      }

      const server = await startHTTPServer(
        (req, res) => {
          res.writeHead(200);
          res.end('ok');
        },
        { port: SERVER_PORT }
      );

      const agent = new http.Agent({ keepAlive: true, maxSockets: 4 });

      try {
        const baseURL = `http://localhost:${server.address().port}`;

        const refs = [];
        for (let i = 0; i < 200; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          const response = await axios.get('/', { baseURL, httpAgent: agent });
          refs.push(new WeakRef(response.request));
        }

        // Drop strong refs and force GC.
        global.gc();
        await setTimeoutAsync(10);
        global.gc();

        const retained = refs.filter((r) => r.deref() !== undefined).length;
        // Some trailing requests may still be referenced in internal buffers.
        // The fix's correctness: retained count scales with agent socket count,
        // NOT with request count. A pre-fix leak would keep >>socket count.
        assert.ok(
          retained <= 20,
          `expected most request objects to be collectible after GC; ${retained}/200 retained suggests a closure leak`
        );
      } finally {
        agent.destroy();
        await stopHTTPServer(server);
      }
    }, 30000);

    it('should not fail with "socket hang up" when using timeouts', async () => {
      const server = await startHTTPServer(
        async (req, res) => {
          if (req.url === '/wait') {
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }

          res.end('ok');
        },
        { port: SERVER_PORT }
      );

      try {
        const baseURL = `http://localhost:${server.address().port}`;
        await axios.get('/1', { baseURL, timeout: 1000 });
        await axios.get('/wait', { baseURL, timeout: 0 });
      } finally {
        await stopHTTPServer(server);
      }
    }, 15000);

    it('should install at most one socket error listener across reused keep-alive sockets', async () => {
      const noop = () => {};
      const socket = new EventEmitter();
      socket.setKeepAlive = noop;
      socket.on('error', noop);

      const baseErrorListenerCount = socket.listenerCount('error');

      const transport = {
        request(_, cb) {
          return new (class MockRequest extends EventEmitter {
            constructor() {
              super();
              this.destroyed = false;
            }

            setTimeout() {}

            write() {}

            end() {
              this.emit('socket', socket);

              setImmediate(() => {
                const response = stream.Readable.from(['ok']);
                response.statusCode = 200;
                response.headers = {};

                cb(response);
                this.emit('close');
              });
            }

            destroy(err) {
              if (this.destroyed) {
                return;
              }

              this.destroyed = true;
              err && this.emit('error', err);
              this.emit('close');
            }
          })();
        },
      };

      // First request: axios installs its single per-socket listener.
      await axios.get('http://example.com/first', {
        transport,
        maxRedirects: 0,
      });
      await setTimeoutAsync(0);
      assert.strictEqual(
        socket.listenerCount('error'),
        baseErrorListenerCount + 1,
        'axios should install exactly one socket error listener'
      );

      // Many subsequent requests reusing the same socket must not add more listeners.
      for (let i = 0; i < 20; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await axios.get(`http://example.com/next-${i}`, {
          transport,
          maxRedirects: 0,
        });
        // eslint-disable-next-line no-await-in-loop
        await setTimeoutAsync(0);
        assert.strictEqual(
          socket.listenerCount('error'),
          baseErrorListenerCount + 1,
          'listener count must stay constant across keep-alive reuse'
        );
      }
    });

    it('should not accumulate socket error listeners when a pooled socket is reassigned before the previous request closes (regression #10780)', async () => {
      const noop = () => {};
      const socket = new EventEmitter();
      socket.setKeepAlive = noop;
      socket.on('error', noop);

      const baseErrorListenerCount = socket.listenerCount('error');

      // Each request defers its 'close' emission so that the socket is
      // reassigned to the next request before the previous one closes.
      // This reproduces the race condition described in #10780.
      const pendingRequests = [];

      const transport = {
        request(_, cb) {
          const req = new (class MockRequest extends EventEmitter {
            constructor() {
              super();
              this.destroyed = false;
            }

            setTimeout() {}
            write() {}

            end() {
              // Share the single pooled socket across every request.
              this.emit('socket', socket);

              setImmediate(() => {
                const response = stream.Readable.from(['ok']);
                response.statusCode = 200;
                response.headers = {};
                cb(response);
                // Intentionally do NOT emit 'close' yet. Collect the req
                // so close can be emitted later, after other reqs have
                // already claimed the socket.
                pendingRequests.push(this);
              });
            }

            destroy(err) {
              if (this.destroyed) return;
              this.destroyed = true;
              err && this.emit('error', err);
              this.emit('close');
            }
          })();

          return req;
        },
      };

      const results = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          axios.get(`http://example.com/concurrent-${i}`, {
            transport,
            maxRedirects: 0,
          })
        )
      );

      assert.strictEqual(results.length, 20);

      // Critical assertion: despite 20 concurrent requests all claiming the
      // same pooled socket before any emitted 'close', only ONE axios listener
      // must be attached. This is the difference between the pre-fix
      // behaviour (20 listeners, MaxListenersExceededWarning) and the fix.
      assert.strictEqual(
        socket.listenerCount('error'),
        baseErrorListenerCount + 1,
        `expected a single axios socket error listener under concurrent reuse, got ${socket.listenerCount('error') - baseErrorListenerCount}`
      );

      // Now drain the queued close events. Listener count must still be 1.
      for (const req of pendingRequests) {
        req.emit('close');
      }
      await setTimeoutAsync(0);

      assert.strictEqual(
        socket.listenerCount('error'),
        baseErrorListenerCount + 1,
        'listener must persist on the socket after requests close (cleanup is per-request ownership, not per-listener removal)'
      );
    });

    it('should route a socket error to the currently-active request after the socket has been reassigned', async () => {
      const noop = () => {};
      const socket = new EventEmitter();
      socket.setKeepAlive = noop;
      socket.on('error', noop);

      const createdReqs = [];

      // First transport: completes cleanly (emits response then close).
      const cleanTransport = {
        request(_, cb) {
          const emitter = new (class MockRequest extends EventEmitter {
            constructor() {
              super();
              this.destroyed = false;
              createdReqs.push(this);
            }
            setTimeout() {}
            write() {}
            end() {
              this.emit('socket', socket);
              setImmediate(() => {
                const response = stream.Readable.from(['ok']);
                response.statusCode = 200;
                response.headers = {};
                cb(response);
                this.emit('close');
              });
            }
            destroy(err) {
              if (this.destroyed) return;
              this.destroyed = true;
              err && this.emit('error', err);
              this.emit('close');
            }
          })();
          return emitter;
        },
      };

      // Second transport: emits socket error instead of a response.
      const errorTransport = {
        request() {
          const emitter = new (class MockRequest extends EventEmitter {
            constructor() {
              super();
              this.destroyed = false;
              createdReqs.push(this);
            }
            setTimeout() {}
            write() {}
            end() {
              this.emit('socket', socket);
              setImmediate(() => {
                socket.emit('error', Object.assign(new Error('boom'), { code: 'EPIPE' }));
              });
            }
            destroy(err) {
              if (this.destroyed) return;
              this.destroyed = true;
              err && this.emit('error', err);
              this.emit('close');
            }
          })();
          return emitter;
        },
      };

      // First request completes successfully; socket is released.
      await axios.get('http://example.com/first', { transport: cleanTransport, maxRedirects: 0 });
      await setTimeoutAsync(0);

      const firstReq = createdReqs[0];
      assert.ok(
        firstReq && firstReq.destroyed === false,
        'first request must not have been destroyed by a socket error'
      );

      // Stray socket error after first req has closed: must not destroy firstReq.
      socket.emit('error', new Error('stray error after close'));
      assert.strictEqual(
        firstReq.destroyed,
        false,
        'socket error after close must not destroy the old request'
      );

      // Second request claims the socket, then its socket errors. It should reject.
      const err = await axios
        .get('http://example.com/second', { transport: errorTransport, maxRedirects: 0 })
        .catch((e) => e);

      assert.ok(err instanceof AxiosError, 'second request should reject with an AxiosError');
      assert.strictEqual(err.code, 'EPIPE');

      const secondReq = createdReqs[1];
      assert.strictEqual(
        secondReq.destroyed,
        true,
        'second request should be destroyed by its own active socket error'
      );
    });

    it('should not throw TypeError when a proxy agent stream does not define setKeepAlive (regression #10908)', async () => {
      // proxy agents (e.g. agent-base) may provide a generic Duplex stream as
      // the socket; that stream does not define setKeepAlive.
      const socket = new stream.Duplex({
        read() {},
        write(_chunk, _encoding, callback) {
          callback();
        },
      });
      assert.strictEqual(typeof socket.setKeepAlive, 'undefined');

      const transport = {
        request(_, cb) {
          return new (class MockRequest extends EventEmitter {
            constructor() {
              super();
              this.destroyed = false;
            }

            setTimeout() {}
            write() {}

            end() {
              this.emit('socket', socket);

              setImmediate(() => {
                const response = stream.Readable.from(['ok']);
                response.statusCode = 200;
                response.headers = {};
                cb(response);
                this.emit('close');
              });
            }

            destroy(err) {
              if (this.destroyed) return;
              this.destroyed = true;
              err && this.emit('error', err);
              this.emit('close');
            }
          })();
        },
      };

      const result = await axios.get('http://example.com/', {
        transport,
        maxRedirects: 0,
      });

      assert.strictEqual(result.status, 200);
    });
  });

  describe('redirect listener accumulation', () => {
    it('should not emit MaxListenersExceededWarning when a single request follows >= 11 redirects', async () => {
      const REDIRECT_COUNT = 11;

      const server = await startHTTPServer(
        (req, res) => {
          const match = req.url.match(/^\/redirect\/(\d+)$/);
          if (match) {
            const n = Number(match[1]);
            if (n < REDIRECT_COUNT) {
              res.writeHead(302, { Location: `/redirect/${n + 1}` });
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ redirects: n }));
              return;
            }
            res.end();
            return;
          }
          res.writeHead(302, { Location: '/redirect/1' });
          res.end();
        },
        { port: SERVER_PORT }
      );

      const warnings = [];
      const warningHandler = (warning) => {
        if (warning && warning.name === 'MaxListenersExceededWarning') {
          warnings.push(warning);
        }
      };
      process.on('warning', warningHandler);

      try {
        const baseURL = `http://localhost:${server.address().port}`;
        const response = await axios.get('/start', {
          baseURL,
          maxRedirects: REDIRECT_COUNT + 5,
        });

        assert.strictEqual(response.status, 200);
        assert.deepStrictEqual(response.data, { redirects: REDIRECT_COUNT });

        // Allow any deferred process 'warning' emissions to flush.
        await setTimeoutAsync(50);

        assert.strictEqual(
          warnings.length,
          0,
          `expected no MaxListenersExceededWarning across ${REDIRECT_COUNT} redirects, got ${warnings.length}: ${warnings.map((w) => w.message).join('; ')}`
        );
      } finally {
        process.removeListener('warning', warningHandler);
        await stopHTTPServer(server);
      }
    }, 30000);

    it('should attach at most one close listener to the outer request across a long redirect chain', async () => {
      const REDIRECT_COUNT = 20;
      const maxObservedCloseListeners = { value: 0 };

      const server = await startHTTPServer(
        (req, res) => {
          const match = req.url.match(/^\/r\/(\d+)$/);
          if (match) {
            const n = Number(match[1]);
            if (n < REDIRECT_COUNT) {
              res.writeHead(302, { Location: `/r/${n + 1}` });
            } else {
              res.writeHead(200);
              res.end('done');
              return;
            }
            res.end();
            return;
          }
          res.writeHead(302, { Location: '/r/1' });
          res.end();
        },
        { port: SERVER_PORT }
      );

      try {
        const baseURL = `http://localhost:${server.address().port}`;

        // Patch EventEmitter.prototype.on briefly to observe the peak close-listener
        // count on any emitter. The outer RedirectableRequest is the only target
        // that would accumulate listeners under the bug. Other emitters in the
        // process (server sockets, etc.) will also be observed but are irrelevant
        // as long as the peak stays within a small bound.
        const originalOn = EventEmitter.prototype.on;
        const originalOnce = EventEmitter.prototype.once;
        function record(eventName) {
          if (eventName === 'close') {
            const count = this.listenerCount('close');
            if (count > maxObservedCloseListeners.value) {
              maxObservedCloseListeners.value = count;
            }
          }
        }
        EventEmitter.prototype.on = function patchedOn(eventName, listener) {
          const res = originalOn.call(this, eventName, listener);
          record.call(this, eventName);
          return res;
        };
        EventEmitter.prototype.once = function patchedOnce(eventName, listener) {
          const res = originalOnce.call(this, eventName, listener);
          record.call(this, eventName);
          return res;
        };

        try {
          const response = await axios.get('/start', {
            baseURL,
            maxRedirects: REDIRECT_COUNT + 5,
          });
          assert.strictEqual(response.status, 200);
        } finally {
          EventEmitter.prototype.on = originalOn;
          EventEmitter.prototype.once = originalOnce;
        }

        // Pre-fix: peak would be >= REDIRECT_COUNT (one axios close listener per hop
        // on the outer RedirectableRequest). Post-fix: axios attaches exactly one
        // close listener to the outer request; framework internals typically add
        // a couple more. A generous bound of 10 distinguishes the behaviours.
        assert.ok(
          maxObservedCloseListeners.value < 10,
          `close listener count should stay below 10 across ${REDIRECT_COUNT} redirects, peak was ${maxObservedCloseListeners.value}`
        );
      } finally {
        await stopHTTPServer(server);
      }
    }, 30000);
  });

  describe('socketPath security', () => {
    function makeSocketPath() {
      const pipe = `axios-socketpath-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      return os.platform() === 'win32'
        ? `\\\\.\\pipe\\${pipe}`
        : path.join(os.tmpdir(), `${pipe}.sock`);
    }

    function startUnixServer(socketPath, onRequest) {
      return new Promise((resolveStart, rejectStart) => {
        const server = http.createServer((req, res) => {
          onRequest && onRequest(req);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, url: req.url }));
        });
        try {
          fs.unlinkSync(socketPath);
        } catch (_) {
          /* noop */
        }
        server.once('error', rejectStart);
        server.listen(socketPath, () => resolveStart(server));
      });
    }

    function stopUnixServer(server, socketPath) {
      return new Promise((done) => {
        server.close(() => {
          try {
            fs.unlinkSync(socketPath);
          } catch (_) {
            /* noop */
          }
          done();
        });
      });
    }

    it('allows socketPath when no allowedSocketPaths is set (backwards compatible)', async () => {
      const socketPath = makeSocketPath();
      const server = await startUnixServer(socketPath);
      try {
        const res = await axios.get('http://localhost/echo', { socketPath });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.ok, true);
      } finally {
        await stopUnixServer(server, socketPath);
      }
    });

    it('accepts a path-only url when socketPath is set (regression #6611)', async () => {
      const socketPath = makeSocketPath();
      const server = await startUnixServer(socketPath);
      try {
        const res = await axios.get('/echo?q=1', { socketPath });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.ok, true);
        assert.strictEqual(res.data.url, '/echo?q=1');
      } finally {
        await stopUnixServer(server, socketPath);
      }
    });

    it('accepts a path-only url when socketPath matches allowedSocketPaths', async () => {
      const socketPath = makeSocketPath();
      const server = await startUnixServer(socketPath);
      try {
        const res = await axios.get('/echo?q=1', {
          socketPath,
          allowedSocketPaths: [socketPath],
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.ok, true);
        assert.strictEqual(res.data.url, '/echo?q=1');
      } finally {
        await stopUnixServer(server, socketPath);
      }
    });

    it('ignores a prototype-polluted socketPath (security, regression #6611)', async () => {
      const socketPath = makeSocketPath();
      let requestCount = 0;
      const server = await startUnixServer(socketPath, () => {
        requestCount += 1;
      });
      // Pollute the prototype so `socketPath` is visible via the chain but is
      // NOT an own property of the request config.
      Object.prototype.socketPath = socketPath;
      try {
        // With no own socketPath, the polluted prototype value must not be
        // honored: the path-only url gets no synthetic base and the request is
        // never routed to the (attacker-controlled) socket, so it rejects
        // instead of silently connecting.
        await assert.rejects(axios.get('/echo?q=1'), (err) => {
          assert.ok(err instanceof Error);
          assert.strictEqual(err.code, AxiosError.ERR_INVALID_URL);
          return true;
        });
        assert.strictEqual(requestCount, 0);
      } finally {
        delete Object.prototype.socketPath;
        await stopUnixServer(server, socketPath);
      }
    });

    it('allows socketPath when it matches an allowedSocketPaths string', async () => {
      const socketPath = makeSocketPath();
      const server = await startUnixServer(socketPath);
      try {
        const res = await axios.get('http://localhost/echo', {
          socketPath,
          allowedSocketPaths: socketPath,
        });
        assert.strictEqual(res.status, 200);
      } finally {
        await stopUnixServer(server, socketPath);
      }
    });

    it('allows socketPath when it matches an entry in allowedSocketPaths array', async () => {
      const socketPath = makeSocketPath();
      const server = await startUnixServer(socketPath);
      try {
        const res = await axios.get('http://localhost/echo', {
          socketPath,
          allowedSocketPaths: ['/var/run/does-not-exist.sock', socketPath],
        });
        assert.strictEqual(res.status, 200);
      } finally {
        await stopUnixServer(server, socketPath);
      }
    });

    it('rejects socketPath not in allowedSocketPaths', async () => {
      await assert.rejects(
        axios.get('http://localhost/echo', {
          socketPath: '/var/run/docker.sock',
          allowedSocketPaths: ['/tmp/allowed.sock'],
        }),
        (err) => {
          assert.ok(err instanceof AxiosError);
          assert.strictEqual(err.code, AxiosError.ERR_BAD_OPTION_VALUE);
          assert.match(err.message, /allowedSocketPaths/);
          return true;
        }
      );
    });

    it('rejects socketPath attempting path traversal that escapes allowlist', async () => {
      const allowedDir = path.join(os.tmpdir(), 'axios-allowed');
      const allowed = path.join(allowedDir, 'app.sock');
      await assert.rejects(
        axios.get('http://localhost/echo', {
          socketPath: path.join(allowedDir, '..', 'other.sock'),
          allowedSocketPaths: [allowed],
        }),
        (err) => {
          assert.strictEqual(err.code, AxiosError.ERR_BAD_OPTION_VALUE);
          return true;
        }
      );
    });

    it('treats relative and absolute allowedSocketPaths entries equivalently', async () => {
      const socketPath = makeSocketPath();
      const server = await startUnixServer(socketPath);
      try {
        const relative = path.relative(process.cwd(), socketPath);
        const res = await axios.get('http://localhost/echo', {
          socketPath,
          allowedSocketPaths: [relative],
        });
        assert.strictEqual(res.status, 200);
      } finally {
        await stopUnixServer(server, socketPath);
      }
    });

    it('rejects non-string socketPath', async () => {
      await assert.rejects(axios.get('http://localhost/echo', { socketPath: 12345 }), (err) => {
        assert.ok(err instanceof AxiosError);
        assert.strictEqual(err.code, AxiosError.ERR_BAD_OPTION_VALUE);
        assert.match(err.message, /socketPath must be a string/);
        return true;
      });
    });

    it('empty allowedSocketPaths array blocks all socketPath values', async () => {
      await assert.rejects(
        axios.get('http://localhost/echo', {
          socketPath: '/tmp/anything.sock',
          allowedSocketPaths: [],
        }),
        (err) => {
          assert.strictEqual(err.code, AxiosError.ERR_BAD_OPTION_VALUE);
          return true;
        }
      );
    });
  });
});
