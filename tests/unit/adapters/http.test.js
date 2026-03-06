import { describe, it } from 'vitest';
import assert from 'assert';
import {
  startHTTPServer,
  stopHTTPServer,
  handleFormData,
  generateReadable,
} from '../../setup/server.js';
import axios from '../../../index.js';
import AxiosError from '../../../lib/core/AxiosError.js';
import { __setProxy } from '../../../lib/adapters/http.js';
import http from 'http';
import https from 'https';
import net from 'net';
import stream from 'stream';
import url from 'url';
import zlib from 'zlib';
import fs from 'fs';
import os from 'os';
import path from 'path';
import devNull from 'dev-null';
import FormDataLegacy from 'form-data';
import formidable from 'formidable';
import { FormData as FormDataPolyfill, Blob as BlobPolyfill } from 'formdata-node';
import express from 'express';
import multer from 'multer';
import getStream from 'get-stream';
import bodyParser from 'body-parser';

describe('supports http with nodejs', () => {
  const adaptersTestsDir = path.join(process.cwd(), 'tests/unit/adapters');
  const thisTestFilePath = path.join(adaptersTestsDir, 'http.test.js');
  const FormDataSpecCompliant = typeof FormData !== 'undefined' ? FormData : FormDataPolyfill;
  const BlobSpecCompliant = typeof Blob !== 'undefined' ? Blob : BlobPolyfill;

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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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

  it('should parse the timeout property', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        setTimeout(() => {
          res.end();
        }, 1000);
      },
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
          res.setHeader('Location', 'http://localhost:8080');
          res.writeHead(302);
        }
        res.end();
      },
      { port: 8080 }
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
    const server = await startHTTPServer(
      (req, res) => {
        res.statusCode = 400;
        res.end();
      },
      { port: 8080 }
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
      { port: 8080 }
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

        var parsed = url.parse(req.url);
        if (parsed.pathname === '/one') {
          res.setHeader('Location', '/two');
          res.statusCode = 302;
          res.end();
        } else {
          res.end();
        }
      },
      { port: 8080 }
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
        { port: 8080 }
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
        { port: 8080 }
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
        { port: 8080 }
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
  });

  /// algos for later

  it('should support UTF8', async () => {
    const str = Array(100000).join('ж');

    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end(str);
      },
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
        const parsed = url.parse(req.url);

        if (parsed.pathname === '/two') {
          res.setHeader('Content-Type', 'text/html; charset=UTF-8');
          res.end(str);
          return;
        }

        res.setHeader('Location', '/two');
        res.statusCode = 302;
        res.end();
      },
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
    const server = await startHTTPServer(() => {}, { port: 8080 });

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
        { port: 8080 }
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
      const server = await startHTTPServer(() => {}, { port: 8080 });
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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 0 }
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
          { port: 8080 }
        )
        .listen(8080, () => resolve(httpsServer));

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
          { port: 8081 }
        )
        .listen(8081, () => resolve(httpsProxy));

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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8081 }
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
          { port: 8080 }
        )
        .listen(8080, () => resolve(httpsServer));

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
          { port: 8081 }
        )
        .listen(8081, () => resolve(httpsProxy));

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
      { port: 8080 }
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
      { port: 8081 }
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
      { port: 8080 }
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
      { port: 8081 }
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
      { port: 8080 }
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
      { port: 8081 }
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
      { port: 8080 }
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
      { port: 8081 }
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
      { port: 8080 }
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
      { port: 8081 }
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
        port: 3300,
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
        proxyConfig: { hostname: '127.0.0.1', protocol: 'http:', port: 80 },
        expectedOptions: { host: '127.0.0.1', protocol: 'http:', port: 80, path: destination },
      },
      {
        description: 'hostname and no trailing colon in protocol',
        proxyConfig: { hostname: '127.0.0.1', protocol: 'http', port: 80 },
        expectedOptions: { host: '127.0.0.1', protocol: 'http:', port: 80, path: destination },
      },
      {
        description: 'both hostname and host -> hostname takes precedence',
        proxyConfig: { hostname: '127.0.0.1', host: '0.0.0.0', protocol: 'http', port: 80 },
        expectedOptions: { host: '127.0.0.1', protocol: 'http:', port: 80, path: destination },
      },
      {
        description: 'only host and https protocol',
        proxyConfig: { host: '0.0.0.0', protocol: 'https', port: 80 },
        expectedOptions: { host: '0.0.0.0', protocol: 'https:', port: 80, path: destination },
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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
          { port: 8080 }
        )
        .listen(8080, () => resolve(httpsServer));

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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
      { port: 8080 }
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
            const receivedForm = new formidable.IncomingForm();

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
          { port: 8080 }
        );

        try {
          const response = await axios.post(`http://localhost:${server.address().port}/`, form, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          assert.deepStrictEqual(response.data.fields, { foo: 'bar' });

          assert.strictEqual(response.data.files.file1.mimetype, 'image/jpeg');
          assert.strictEqual(response.data.files.file1.originalFilename, 'temp/bar.jpg');
          assert.strictEqual(response.data.files.file1.size, 3);

          assert.strictEqual(response.data.files.fileStream.mimetype, 'image/png');
          assert.strictEqual(response.data.files.fileStream.originalFilename, 'axios.png');
          assert.strictEqual(response.data.files.fileStream.size, stat.size);
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
          { port: 8080 }
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

          assert.deepStrictEqual(data.fields, { foo1: 'bar1', foo2: 'bar2' });
          assert.deepStrictEqual(typeof data.files.file1, 'object');

          const { size, mimetype, originalFilename } = data.files.file1;

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
        { port: 8080 }
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
  });

  describe('Blob', () => {
    it('should support Blob', async () => {
      const server = await startHTTPServer(
        async (req, res) => {
          res.end(await getStream(req));
        },
        { port: 8080 }
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
    it('should post object data as url-encoded form if content-type is application/x-www-form-urlencoded', async () => {
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
        { port: 8080 }
      );

      try {
        const response = await axios.post(`http://localhost:${server.address().port}/`, obj, {
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
        });
        assert.deepStrictEqual(response.data, obj);
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
        { port: 8080 }
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
  });
});
