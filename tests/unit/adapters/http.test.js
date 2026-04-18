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
import { __setProxy } from '../../../lib/adapters/http.js';
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
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Encoding', 'gzip');
          res.end('invalid response');
        },
        { port: SERVER_PORT }
      );

      try {
        await assert.rejects(async () => {
          await axios.get(`http://localhost:${server.address().port}/`);
        });
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

      for (const [typeName, zipped] of Object.entries({
        gzip: gzip(responseBody),
        GZIP: gzip(responseBody),
        compress: gzip(responseBody),
        deflate: deflate(responseBody),
        'deflate-raw': deflateRaw(responseBody),
        br: brotliCompress(responseBody),
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

  it('should enforce maxBodyLength for streamed uploads with maxRedirects: 0 (GHSA-5c9x-8gcm-mpgx)', async () => {
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

      const response = await axios.post(
        `http://localhost:${server.address().port}/`,
        source,
        {
          maxBodyLength: 1024,
          maxRedirects: 0,
          headers: { 'Content-Type': 'application/octet-stream' },
        }
      );

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
          assert.deepStrictEqual(error.exists, true);
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

    try {
      const response = await axios.get(`http://localhost:${server.address().port}/`, {
        proxy: {
          host: 'localhost',
          port: proxy.address().port,
        },
      });

      assert.strictEqual(Number(response.data), 123456789, 'should pass through proxy');
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
      const httpsServer = https
        .createServer(
          tlsOptions,
          (req, res) => {
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            res.end('12345');
          },
          { port: SERVER_PORT }
        )
        .listen(SERVER_PORT, () => resolve(httpsServer));

      httpsServer.on('error', reject);
    });

    const proxy = await new Promise((resolve, reject) => {
      const httpsProxy = https
        .createServer(
          tlsOptions,
          (request, response) => {
            const targetUrl = new URL(request.url);
            const opts = {
              host: targetUrl.hostname,
              port: targetUrl.port,
              path: `${targetUrl.pathname}${targetUrl.search}`,
              protocol: targetUrl.protocol,
              rejectUnauthorized: false,
            };

            const proxyRequest = https.get(opts, (res) => {
              let body = '';

              res.on('data', (data) => {
                body += data;
              });

              res.on('end', () => {
                response.setHeader('Content-Type', 'text/html; charset=UTF-8');
                response.end(body + '6789');
              });
            });

            proxyRequest.on('error', () => {
              response.statusCode = 502;
              response.end();
            });
          },
          { port: PROXY_PORT }
        )
        .listen(PROXY_PORT, () => resolve(httpsProxy));

      httpsProxy.on('error', reject);
    });

    try {
      const response = await axios.get(`https://localhost:${server.address().port}/`, {
        proxy: {
          host: 'localhost',
          port: proxy.address().port,
          protocol: 'https:',
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      });

      assert.strictEqual(Number(response.data), 123456789, 'should pass through proxy');
    } finally {
      await Promise.all([closeServer(server), closeServer(proxy)]);
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
      const httpsServer = https
        .createServer(
          tlsOptions,
          (req, res) => {
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            res.end('12345');
          },
          { port: SERVER_PORT }
        )
        .listen(SERVER_PORT, () => resolve(httpsServer));

      httpsServer.on('error', reject);
    });

    const proxy = await new Promise((resolve, reject) => {
      const httpsProxy = https
        .createServer(
          tlsOptions,
          (request, response) => {
            const targetUrl = new URL(request.url);
            const opts = {
              host: targetUrl.hostname,
              port: targetUrl.port,
              path: `${targetUrl.pathname}${targetUrl.search}`,
              protocol: targetUrl.protocol,
              rejectUnauthorized: false,
            };

            const proxyRequest = https.get(opts, (res) => {
              let body = '';

              res.on('data', (data) => {
                body += data;
              });

              res.on('end', () => {
                response.setHeader('Content-Type', 'text/html; charset=UTF-8');
                response.end(body + '6789');
              });
            });

            proxyRequest.on('error', () => {
              response.statusCode = 502;
              response.end();
            });
          },
          { port: PROXY_PORT }
        )
        .listen(PROXY_PORT, () => resolve(httpsProxy));

      httpsProxy.on('error', reject);
    });

    const proxyUrl = `https://localhost:${proxy.address().port}/`;
    process.env.https_proxy = proxyUrl;
    process.env.HTTPS_PROXY = proxyUrl;
    process.env.no_proxy = '';
    process.env.NO_PROXY = '';

    try {
      const response = await axios.get(`https://localhost:${server.address().port}/`, {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      });

      assert.equal(response.data, '123456789', 'should pass through proxy');
    } finally {
      await Promise.all([closeServer(server), closeServer(proxy)]);

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
        res.writeHead(200, { 'Content-Type': 'text/plain' });
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
      it('should allow passing FormData', async () => {
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
          { port: SERVER_PORT }
        );

        try {
          const form = new FormDataSpecCompliant();
          const blobContent = 'blob-content';
          const blob = new BlobSpecCompliant([blobContent], { type: 'image/jpeg' });

          form.append('foo1', 'bar1');
          form.append('foo2', 'bar2');
          form.append('file1', blob);

          const { data } = await axios.post(`http://localhost:${server.address().port}`, form, {
            maxRedirects: 0,
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
          await stopHTTPServer(server);
        }
      });
    });

    describe('prototype pollution (GHSA-6chq-wfr3-2hj9)', () => {
      const pollutedKeys = ['getHeaders', 'append', 'pipe', 'on', 'once'];
      const toStringTagSym = Symbol.toStringTag;

      function pollute() {
        Object.prototype[toStringTagSym] = 'FormData';
        Object.prototype.append = () => {};
        Object.prototype.getHeaders = () => ({
          'x-injected': 'attacker',
          'authorization': 'Bearer ATTACKER_TOKEN',
        });
        Object.prototype.pipe = function (d) { if (d && d.end) d.end(); return d; };
        Object.prototype.on = function () { return this; };
        Object.prototype.once = function () { return this; };
      }

      function cleanup() {
        for (const k of pollutedKeys) delete Object.prototype[k];
        delete Object.prototype[toStringTagSym];
      }

      it('should not merge prototype-polluted getHeaders into outgoing request', async () => {
        let receivedHeaders;
        const server = await startHTTPServer(
          (req, res) => {
            receivedHeaders = req.headers;
            res.end('{}');
          },
          { port: SERVER_PORT }
        );

        try {
          pollute();
          await axios.post(
            `http://localhost:${server.address().port}/`,
            { userId: 42 },
            { headers: { 'Authorization': 'Bearer VALID_USER_TOKEN' } }
          );
        } finally {
          cleanup();
          await stopHTTPServer(server);
        }

        assert.ok(receivedHeaders, 'request did not reach server');
        assert.strictEqual(receivedHeaders['x-injected'], undefined);
        assert.notStrictEqual(receivedHeaders['authorization'], 'Bearer ATTACKER_TOKEN');
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
      it('should reuse session for the target authority', async () => {
        const server = await startHTTPServer(
          (req, res) => {
            setTimeout(() => res.end('OK'), 1000);
          },
          {
            useHTTP2: true,
            port: SERVER_PORT,
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

      it('should use different sessions for different authorities', async () => {
        const server = await startHTTPServer(
          (req, res) => {
            setTimeout(() => {
              res.end('OK');
            }, 2000);
          },
          {
            useHTTP2: true,
            port: SERVER_PORT,
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
            port: ALTERNATE_SERVER_PORT,
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

      it('should use different sessions for requests with different http2Options set', async () => {
        const server = await startHTTPServer(
          (req, res) => {
            setTimeout(() => {
              res.end('OK');
            }, 1000);
          },
          {
            useHTTP2: true,
            port: SERVER_PORT,
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
      });

      it('should use the same session for request with the same resolved http2Options set', async () => {
        const server = await startHTTPServer(
          (req, res) => {
            setTimeout(() => res.end('OK'), 1000);
          },
          {
            useHTTP2: true,
            port: SERVER_PORT,
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

          assert.deepStrictEqual(await Promise.all(responses.map(({ data }) => getStream(data))), [
            'OK',
            'OK',
            'OK',
          ]);
        } finally {
          await stopHTTPServer(server);
        }
      });

      it('should use different sessions after previous session timeout', async () => {
        const server = await startHTTPServer(
          (req, res) => {
            setTimeout(() => res.end('OK'), 100);
          },
          {
            useHTTP2: true,
            port: SERVER_PORT,
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
      }, 15000);
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

    it('should remove request socket error listeners after keep-alive requests close', async () => {
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

      await axios.get('http://example.com/first', {
        transport,
        maxRedirects: 0,
      });
      await setTimeoutAsync(0);
      assert.strictEqual(socket.listenerCount('error'), baseErrorListenerCount);

      await axios.get('http://example.com/second', {
        transport,
        maxRedirects: 0,
      });
      await setTimeoutAsync(0);
      assert.strictEqual(socket.listenerCount('error'), baseErrorListenerCount);
    });
  });
});
