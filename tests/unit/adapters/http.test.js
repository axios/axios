import { describe, it } from 'vitest';
import assert from 'assert';
import { startHTTPServer, stopHTTPServer, generateReadable } from '../../setup/server.js';
import axios from '../../../index.js';
import AxiosError from '../../../lib/core/AxiosError.js';
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

describe('supports http with nodejs', () => {
  const adaptersTestsDir = path.join(process.cwd(), 'tests/unit/adapters');
  const thisTestFilePath = path.join(adaptersTestsDir, 'http.test.js');

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
      const { data: responseData } = await axios.get(`http://127.0.0.1:${server.address().port}`);
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
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Location', '/foo');
        res.statusCode = 302;
        res.end();
      },
      { port: 8080 }
    );

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
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('Location', '/foo');
        res.statusCode = 302;
        res.end();
      },
      { port: 8080 }
    );

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

    const server = await startHTTPServer(
      (req, res) => {
        requestCount += 1;
        if (requestCount <= totalRedirectCount) {
          res.setHeader('Location', 'http://127.0.0.1:8080');
          res.writeHead(302);
        }
        res.end();
      },
      { port: 8080 }
    );

    const proxy = await startHTTPServer(
      (req, res) => {
        proxyUseCount += 1;
        const targetUrl = new URL(req.url, `http://127.0.0.1:${server.address().port}`);
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
});
