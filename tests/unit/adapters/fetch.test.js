import { describe, it, vi } from 'vitest';
import assert from 'assert';
import {
  startHTTPServer,
  stopHTTPServer,
  setTimeoutAsync,
  makeReadableStream,
  generateReadable,
  makeEchoStream,
} from '../../setup/server.js';
import axios from '../../../index.js';
import { getFetch } from '../../../lib/adapters/fetch.js';
import stream from 'stream';
import { AbortController } from 'abortcontroller-polyfill/dist/cjs-ponyfill.js';
import util from 'util';
import NodeFormData from 'form-data';

const SERVER_PORT = 8010;
const LOCAL_SERVER_URL = `http://localhost:${SERVER_PORT}`;

const pipelineAsync = util.promisify(stream.pipeline);

const fetchAxios = axios.create({
  baseURL: LOCAL_SERVER_URL,
  adapter: 'fetch',
});

describe.runIf(typeof fetch === 'function')('supports fetch with nodejs', () => {
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
      {
        port: SERVER_PORT,
      }
    );

    try {
      const { data } = await fetchAxios.get(`${LOCAL_SERVER_URL}/`, {
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

  describe('responses', () => {
    it('should support text response type', async () => {
      const originalData = 'my data';

      const server = await startHTTPServer((req, res) => res.end(originalData), {
        port: SERVER_PORT,
      });

      try {
        const { data } = await fetchAxios.get(`http://localhost:${server.address().port}/`, {
          responseType: 'text',
        });

        assert.deepStrictEqual(data, originalData);
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should support arraybuffer response type', async () => {
      const originalData = 'my data';

      const server = await startHTTPServer((req, res) => res.end(originalData), {
        port: SERVER_PORT,
      });

      try {
        const { data } = await fetchAxios.get(`http://localhost:${server.address().port}/`, {
          responseType: 'arraybuffer',
        });

        assert.deepStrictEqual(
          data,
          Uint8Array.from(await new TextEncoder().encode(originalData)).buffer
        );
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should support blob response type', async () => {
      const originalData = 'my data';

      const server = await startHTTPServer((req, res) => res.end(originalData), {
        port: SERVER_PORT,
      });

      try {
        const { data } = await fetchAxios.get(`http://localhost:${server.address().port}/`, {
          responseType: 'blob',
        });

        assert.deepStrictEqual(data, new Blob([originalData]));
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should support stream response type', async () => {
      const originalData = 'my data';

      const server = await startHTTPServer((req, res) => res.end(originalData), {
        port: SERVER_PORT,
      });

      try {
        const { data } = await fetchAxios.get(`http://localhost:${server.address().port}/`, {
          responseType: 'stream',
        });

        assert.ok(data instanceof ReadableStream, 'data is not instanceof ReadableStream');

        const response = new Response(data);

        assert.deepStrictEqual(await response.text(), originalData);
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should support formData response type', async () => {
      const originalData = new FormData();

      originalData.append('x', '123');

      const server = await startHTTPServer(
        async (req, res) => {
          const response = await new Response(originalData);

          res.setHeader('Content-Type', response.headers.get('Content-Type'));

          res.end(await response.text());
        },
        { port: SERVER_PORT }
      );

      try {
        const { data } = await fetchAxios.get(`http://localhost:${server.address().port}/`, {
          responseType: 'formdata',
        });

        assert.ok(data instanceof FormData, 'data is not instanceof FormData');

        assert.deepStrictEqual(
          Object.fromEntries(data.entries()),
          Object.fromEntries(originalData.entries())
        );
      } finally {
        await stopHTTPServer(server);
      }
    }, 5000);

    it('should support json response type', async () => {
      const originalData = { x: 'my data' };

      const server = await startHTTPServer((req, res) => res.end(JSON.stringify(originalData)), {
        port: SERVER_PORT,
      });

      try {
        const { data } = await fetchAxios.get(`http://localhost:${server.address().port}/`, {
          responseType: 'json',
        });

        assert.deepStrictEqual(data, originalData);
      } finally {
        await stopHTTPServer(server);
      }
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

          const { data } = await fetchAxios.post(
            `http://localhost:${server.address().port}/`,
            readable,
            {
              onUploadProgress: ({ loaded, total, progress, bytes, upload }) => {
                console.log(
                  `Upload Progress ${loaded} from ${total} bytes (${(progress * 100).toFixed(1)}%)`
                );

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
            }
          );

          await setTimeoutAsync(500);

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

      it('should not fail with get method', async () => {
        const server = await startHTTPServer((req, res) => res.end('OK'), { port: SERVER_PORT });

        try {
          const { data } = await fetchAxios.get(`http://localhost:${server.address().port}/`, {
            onUploadProgress() {},
          });

          assert.strictEqual(data, 'OK');
        } finally {
          await stopHTTPServer(server);
        }
      });
    });

    describe('download', () => {
      it('should support download progress capturing', async () => {
        const server = await startHTTPServer(
          {
            rate: 100 * 1024,
          },
          {
            port: SERVER_PORT,
          }
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

          const { data } = await fetchAxios.post(
            `http://localhost:${server.address().port}/`,
            readable,
            {
              onDownloadProgress: ({ loaded, total, progress, bytes, download }) => {
                console.log(
                  `Download Progress ${loaded} from ${total} bytes (${(progress * 100).toFixed(1)}%)`
                );

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
            }
          );

          await setTimeoutAsync(500);

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

  it('should support basic auth', async () => {
    const server = await startHTTPServer((req, res) => res.end(req.headers.authorization), {
      port: SERVER_PORT,
    });

    try {
      const user = 'foo';
      const headers = { Authorization: 'Bearer 1234' };
      const res = await axios.get(`http://${user}@localhost:${server.address().port}/`, {
        headers,
      });

      const base64 = Buffer.from(`${user}:`, 'utf8').toString('base64');
      assert.equal(res.data, `Basic ${base64}`);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support stream.Readable as a payload', async () => {
    const server = await startHTTPServer(async (req, res) => res.end('OK'), { port: SERVER_PORT });

    try {
      const { data } = await fetchAxios.post(
        `http://localhost:${server.address().port}/`,
        stream.Readable.from('OK')
      );

      assert.strictEqual(data, 'OK');
    } finally {
      await stopHTTPServer(server);
    }
  });

  describe('request aborting', () => {
    it('should be able to abort the request stream', async () => {
      const server = await startHTTPServer(
        {
          rate: 100000,
          useBuffering: true,
        },
        { port: SERVER_PORT }
      );

      try {
        const controller = new AbortController();

        setTimeout(() => {
          controller.abort();
        }, 500);

        await assert.rejects(async () => {
          await fetchAxios.post(
            `http://localhost:${server.address().port}/`,
            makeReadableStream(),
            {
              responseType: 'stream',
              signal: controller.signal,
            }
          );
        }, /CanceledError/);
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should be able to abort the response stream', async () => {
      const server = await startHTTPServer(
        (req, res) => {
          pipelineAsync(generateReadable(10000, 10), res).catch(() => {
            // Client-side abort intentionally closes the stream early in this test.
          });
        },
        { port: SERVER_PORT }
      );

      try {
        const controller = new AbortController();

        setTimeout(() => {
          controller.abort(new Error('test'));
        }, 800);

        const { data } = await fetchAxios.get(`http://localhost:${server.address().port}/`, {
          responseType: 'stream',
          signal: controller.signal,
        });

        await assert.rejects(async () => {
          await data.pipeTo(makeEchoStream());
        }, /^(AbortError|CanceledError):/);
      } finally {
        await stopHTTPServer(server);
      }
    });
  });

  it('should support a timeout', async () => {
    const server = await startHTTPServer(
      async (req, res) => {
        await setTimeoutAsync(1000);
        res.end('OK');
      },
      { port: SERVER_PORT }
    );

    try {
      const timeout = 500;

      const ts = Date.now();

      await assert.rejects(async () => {
        await fetchAxios(`http://localhost:${server.address().port}/`, {
          timeout,
        });
      }, /timeout/);

      const passed = Date.now() - ts;

      assert.ok(passed >= timeout - 5, `early cancellation detected (${passed} ms)`);
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should combine baseURL and url', async () => {
    const server = await startHTTPServer(async (req, res) => res.end('OK'), { port: SERVER_PORT });
    try {
      const res = await fetchAxios('/foo');

      assert.equal(res.config.baseURL, LOCAL_SERVER_URL);
      assert.equal(res.config.url, '/foo');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should support params', async () => {
    const server = await startHTTPServer((req, res) => res.end(req.url), { port: SERVER_PORT });
    try {
      const { data } = await fetchAxios.get(`http://localhost:${server.address().port}/?test=1`, {
        params: {
          foo: 1,
          bar: 2,
        },
      });

      assert.strictEqual(data, '/?test=1&foo=1&bar=2');
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('should handle fetch failed error as an AxiosError with ERR_NETWORK code', async () => {
    try {
      await fetchAxios('http://notExistsUrl.in.nowhere');
      assert.fail('should fail');
    } catch (err) {
      assert.strictEqual(String(err), 'AxiosError: Network Error');
      assert.strictEqual(err.cause && err.cause.code, 'ENOTFOUND');
    }
  });

  it('should get response headers', async () => {
    const server = await startHTTPServer(
      (req, res) => {
        res.setHeader('foo', 'bar');
        res.end(req.url);
      },
      { port: SERVER_PORT }
    );

    try {
      const { headers } = await fetchAxios.get(`http://localhost:${server.address().port}/`, {
        responseType: 'stream',
      });

      assert.strictEqual(headers.get('foo'), 'bar');
    } finally {
      await stopHTTPServer(server);
    }
  });

  describe('fetch adapter - Content-Type handling', () => {
    it('should set correct Content-Type for FormData automatically', async () => {
      const form = new NodeFormData();
      form.append('foo', 'bar');

      const server = await startHTTPServer(
        (req, res) => {
          const contentType = req.headers['content-type'];
          assert.match(contentType, /^multipart\/form-data; boundary=/i);
          res.end('OK');
        },
        { port: SERVER_PORT }
      );

      try {
        await fetchAxios.post(`http://localhost:${server.address().port}/form`, form);
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should remove manually set Content-Type without boundary for FormData', async () => {
      const form = new FormData();
      form.append('foo', 'bar');

      const server = await startHTTPServer(
        (req, res) => {
          const contentType = req.headers['content-type'];
          assert.match(contentType, /^multipart\/form-data; boundary=/i);
          res.end('OK');
        },
        { port: SERVER_PORT }
      );

      try {
        await fetchAxios.post(`http://localhost:${server.address().port}/form`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should preserve Content-Type if it already has boundary', async () => {
      const form = new FormData();
      form.append('foo', 'bar');

      const customBoundary = '----CustomBoundary123';

      const server = await startHTTPServer(
        (req, res) => {
          const contentType = req.headers['content-type'];
          assert.ok(contentType.includes(customBoundary));
          res.end('OK');
        },
        { port: SERVER_PORT }
      );

      try {
        await fetchAxios.post(`http://localhost:${server.address().port}/form`, form, {
          headers: {
            'Content-Type': `multipart/form-data; boundary=${customBoundary}`,
          },
        });
      } finally {
        await stopHTTPServer(server);
      }
    });
  });

  describe('env config', () => {
    it('should respect env fetch API configuration', async () => {
      const { data, headers } = await fetchAxios.get('/', {
        env: {
          fetch() {
            return {
              headers: {
                foo: '1',
              },
              text: async () => 'test',
            };
          },
        },
      });

      assert.strictEqual(headers.get('foo'), '1');
      assert.strictEqual(data, 'test');
    });

    it('should be able to request with lack of Request object', async () => {
      const form = new FormData();

      form.append('x', '1');

      const { data, headers } = await fetchAxios.post('/', form, {
        onUploadProgress() {
          // dummy listener to activate streaming
        },
        env: {
          Request: null,
          fetch() {
            return {
              headers: {
                foo: '1',
              },
              text: async () => 'test',
            };
          },
        },
      });

      assert.strictEqual(headers.get('foo'), '1');
      assert.strictEqual(data, 'test');
    });

    it('should be able to handle response with lack of Response object', async () => {
      const { data, headers } = await fetchAxios.get('/', {
        onDownloadProgress() {
          // dummy listener to activate streaming
        },
        env: {
          Request: null,
          Response: null,
          fetch() {
            return {
              headers: {
                foo: '1',
              },
              text: async () => 'test',
            };
          },
        },
      });

      assert.strictEqual(headers.get('foo'), '1');
      assert.strictEqual(data, 'test');
    });

    it('should fallback to the global on undefined env value', async () => {
      const server = await startHTTPServer((req, res) => res.end('OK'), { port: SERVER_PORT });

      try {
        const { data } = await fetchAxios.get(`http://localhost:${server.address().port}/`, {
          env: {
            fetch: undefined,
          },
        });

        assert.strictEqual(data, 'OK');
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should use current global fetch when env fetch is not specified', async () => {
      const globalFetch = global.fetch;

      vi.stubGlobal('fetch', async () => {
        return {
          headers: {
            foo: '1',
          },
          text: async () => 'global',
        };
      });

      const server = await startHTTPServer((req, res) => res.end('OK'), { port: SERVER_PORT });

      try {
        const { data } = await fetchAxios.get(`http://localhost:${server.address().port}/`, {
          env: {
            fetch: undefined,
          },
        });

        assert.strictEqual(data, 'global');
      } finally {
        vi.stubGlobal('fetch', globalFetch);
        await stopHTTPServer(server);
      }
    });
  });

  describe('size limits (GHSA-777c-7fjr-54vf)', () => {
    it('should reject an outbound body that exceeds maxBodyLength with ERR_BAD_REQUEST', async () => {
      const server = await startHTTPServer(
        (req, res) => {
          res.end('ok');
        },
        { port: SERVER_PORT }
      );

      try {
        await assert.rejects(
          fetchAxios.post(`${LOCAL_SERVER_URL}/`, 'A'.repeat(2048), {
            maxBodyLength: 1024,
          }),
          (err) => {
            assert.strictEqual(err.code, 'ERR_BAD_REQUEST');
            assert.match(err.message, /Request body larger than maxBodyLength limit/);
            return true;
          }
        );
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should reject a response whose Content-Length exceeds maxContentLength with ERR_BAD_RESPONSE', async () => {
      const payload = 'A'.repeat(8 * 1024);
      const server = await startHTTPServer(
        (req, res) => {
          res.setHeader('Content-Length', Buffer.byteLength(payload));
          res.end(payload);
        },
        { port: SERVER_PORT }
      );

      try {
        await assert.rejects(
          fetchAxios.get(`${LOCAL_SERVER_URL}/`, {
            maxContentLength: 1024,
          }),
          (err) => {
            assert.strictEqual(err.code, 'ERR_BAD_RESPONSE');
            assert.match(err.message, /maxContentLength size of 1024 exceeded/);
            return true;
          }
        );
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should reject a chunked response that exceeds maxContentLength during streaming', async () => {
      const server = await startHTTPServer(
        (req, res) => {
          // Omit content-length so the cheap pre-check cannot fire; force
          // the stream-based enforcement path.
          res.setHeader('Transfer-Encoding', 'chunked');
          const chunk = 'B'.repeat(1024);
          let sent = 0;
          const writeNext = () => {
            if (sent >= 8) {
              return res.end();
            }
            sent++;
            res.write(chunk, writeNext);
          };
          writeNext();
        },
        { port: SERVER_PORT }
      );

      try {
        await assert.rejects(
          fetchAxios.get(`${LOCAL_SERVER_URL}/`, {
            maxContentLength: 512,
          }),
          (err) => {
            assert.strictEqual(err.code, 'ERR_BAD_RESPONSE');
            assert.match(err.message, /maxContentLength size of 512 exceeded/);
            return true;
          }
        );
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should reject a data: URL whose decoded size exceeds maxContentLength (base64)', async () => {
      const payload = 'A'.repeat(4096);
      const dataUrl = 'data:application/octet-stream;base64,' + Buffer.from(payload).toString('base64');

      // Use a dedicated instance without baseURL — combineURLs would otherwise
      // prepend baseURL to a data: URL and neutralise the pre-check.
      const bareAxios = axios.create({ adapter: 'fetch' });

      await assert.rejects(
        bareAxios.get(dataUrl, { maxContentLength: 16 }),
        (err) => {
          assert.strictEqual(err.code, 'ERR_BAD_RESPONSE');
          assert.match(err.message, /maxContentLength size of 16 exceeded/);
          return true;
        }
      );
    });

    it('should reject a data: URL whose body size exceeds maxContentLength (non-base64)', async () => {
      const dataUrl = 'data:text/plain,' + 'X'.repeat(4096);

      const bareAxios = axios.create({ adapter: 'fetch' });

      await assert.rejects(
        bareAxios.get(dataUrl, { maxContentLength: 16 }),
        (err) => {
          assert.strictEqual(err.code, 'ERR_BAD_RESPONSE');
          assert.match(err.message, /maxContentLength size of 16 exceeded/);
          return true;
        }
      );
    });

    it('should allow a response at or below maxContentLength', async () => {
      const payload = 'ok';
      const server = await startHTTPServer(
        (req, res) => {
          res.end(payload);
        },
        { port: SERVER_PORT }
      );

      try {
        const { data } = await fetchAxios.get(`${LOCAL_SERVER_URL}/`, {
          maxContentLength: 1024,
        });
        assert.strictEqual(data, payload);
      } finally {
        await stopHTTPServer(server);
      }
    });

    it('should allow a body at or below maxBodyLength', async () => {
      const payload = 'hello';
      let received;
      const server = await startHTTPServer(
        (req, res) => {
          const chunks = [];
          req.on('data', (c) => chunks.push(c));
          req.on('end', () => {
            received = Buffer.concat(chunks).toString();
            res.end('ok');
          });
        },
        { port: SERVER_PORT }
      );

      try {
        await fetchAxios.post(`${LOCAL_SERVER_URL}/`, payload, {
          maxBodyLength: 1024,
        });
        assert.strictEqual(received, payload);
      } finally {
        await stopHTTPServer(server);
      }
    });
  });

  describe('capability probe cleanup', () => {
    it('should cancel the ReadableStream created during the request stream probe', () => {
      // The fetch adapter factory probes for request-stream support by creating
      // a ReadableStream as a Request body.  Previously the stream was never
      // cancelled, leaving a dangling pull-algorithm promise (async resource leak
      // visible via `--detect-async-leaks` or Node.js async_hooks).
      //
      // Calling getFetch with a unique env triggers a fresh factory() execution
      // (including the probe).  We spy on ReadableStream.prototype.cancel to
      // verify it is invoked during the probe.

      const cancelSpy = vi.spyOn(ReadableStream.prototype, 'cancel');

      try {
        // Unique fetch function ensures cache miss → factory() re-runs the probe.
        const uniqueFetch = async () => new Response('ok');
        getFetch({ env: { fetch: uniqueFetch } });

        assert.ok(
          cancelSpy.mock.calls.length > 0,
          'ReadableStream.prototype.cancel should be called during the capability probe'
        );
      } finally {
        cancelSpy.mockRestore();
      }
    });
  });
});
