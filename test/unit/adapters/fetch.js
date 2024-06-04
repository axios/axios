import assert from 'assert';
import {
  startHTTPServer,
  stopHTTPServer,
  LOCAL_SERVER_URL,
  setTimeoutAsync,
  makeReadableStream,
  generateReadable,
  makeEchoStream
} from '../../helpers/server.js';
import axios from '../../../index.js';
import stream from "stream";
import {AbortController} from "abortcontroller-polyfill/dist/cjs-ponyfill.js";
import util from "util";

const pipelineAsync = util.promisify(stream.pipeline);

const fetchAxios = axios.create({
  baseURL: LOCAL_SERVER_URL,
  adapter: 'fetch'
});

let server;

describe('supports fetch with nodejs', function () {
  before(function () {
    if (typeof fetch !== 'function') {
      this.skip();
    }
  })

  afterEach(async function () {
    await stopHTTPServer(server);

    server = null;
  });

  describe('responses', async () => {
    it(`should support text response type`, async () => {
      const originalData = 'my data';

      server = await startHTTPServer((req, res) => res.end(originalData));

      const {data} = await fetchAxios.get('/', {
        responseType: 'text'
      });

      assert.deepStrictEqual(data, originalData);
    });

    it(`should support arraybuffer response type`, async () => {
      const originalData = 'my data';

      server = await startHTTPServer((req, res) => res.end(originalData));

      const {data} = await fetchAxios.get('/', {
        responseType: 'arraybuffer'
      });

      assert.deepStrictEqual(data, Uint8Array.from(await new TextEncoder().encode(originalData)).buffer);
    });

    it(`should support blob response type`, async () => {
      const originalData = 'my data';

      server = await startHTTPServer((req, res) => res.end(originalData));

      const {data} = await fetchAxios.get('/', {
        responseType: 'blob'
      });

      assert.deepStrictEqual(data, new Blob([originalData]));
    });

    it(`should support stream response type`, async () => {
      const originalData = 'my data';

      server = await startHTTPServer((req, res) => res.end(originalData));

      const {data} = await fetchAxios.get('/', {
        responseType: 'stream'
      });

      assert.ok(data instanceof ReadableStream, 'data is not instanceof ReadableStream');

      let response = new Response(data);

      assert.deepStrictEqual(await response.text(), originalData);
    });

    it(`should support formData response type`, async function () {
      this.timeout(5000);

      const originalData = new FormData();

      originalData.append('x', '123');

      server = await startHTTPServer(async (req, res) => {

        const response = await new Response(originalData);

        res.setHeader('Content-Type', response.headers.get('Content-Type'));

        res.end(await response.text());
      });

      const {data} = await fetchAxios.get('/', {
        responseType: 'formdata'
      });

      assert.ok(data instanceof FormData, 'data is not instanceof FormData');

      assert.deepStrictEqual(Object.fromEntries(data.entries()), Object.fromEntries(originalData.entries()));
    });

    it(`should support json response type`, async () => {
      const originalData = {x: 'my data'};

      server = await startHTTPServer((req, res) => res.end(JSON.stringify(originalData)));

      const {data} = await fetchAxios.get('/', {
        responseType: 'json'
      });

      assert.deepStrictEqual(data, originalData);
    });
  });

  describe("progress", () => {
    describe('upload', function () {
      it('should support upload progress capturing', async function () {
        this.timeout(15000);

        server = await startHTTPServer({
          rate: 100 * 1024
        });

        let content = '';
        const count = 10;
        const chunk = "test";
        const chunkLength = Buffer.byteLength(chunk);
        const contentLength = count * chunkLength;

        const readable = stream.Readable.from(async function* () {
          let i = count;

          while (i-- > 0) {
            await setTimeoutAsync(1100);
            content += chunk;
            yield chunk;
          }
        }());

        const samples = [];

        const {data} = await fetchAxios.post('/', readable, {
          onUploadProgress: ({loaded, total, progress, bytes, upload}) => {
            console.log(`Upload Progress ${loaded} from ${total} bytes (${(progress * 100).toFixed(1)}%)`);

            samples.push({
              loaded,
              total,
              progress,
              bytes,
              upload
            });
          },
          headers: {
            'Content-Length': contentLength
          },
          responseType: 'text'
        });

        await setTimeoutAsync(500);

        assert.strictEqual(data, content);

        assert.deepStrictEqual(samples, Array.from(function* () {
          for (let i = 1; i <= 10; i++) {
            yield ({
              loaded: chunkLength * i,
              total: contentLength,
              progress: (chunkLength * i) / contentLength,
              bytes: 4,
              upload: true
            });
          }
        }()));
      });

      it('should not fail with get method', async() => {
        server = await startHTTPServer((req, res) => res.end('OK'));

        const {data} = await fetchAxios.get('/', {
          onUploadProgress() {

          }
        });

        assert.strictEqual(data, 'OK');
      });
    });

    describe('download', function () {
      it('should support download progress capturing', async function () {
        this.timeout(15000);

        server = await startHTTPServer({
          rate: 100 * 1024
        });

        let content = '';
        const count = 10;
        const chunk = "test";
        const chunkLength = Buffer.byteLength(chunk);
        const contentLength = count * chunkLength;

        const readable = stream.Readable.from(async function* () {
          let i = count;

          while (i-- > 0) {
            await setTimeoutAsync(1100);
            content += chunk;
            yield chunk;
          }
        }());

        const samples = [];

        const {data} = await fetchAxios.post('/', readable, {
          onDownloadProgress: ({loaded, total, progress, bytes, download}) => {
            console.log(`Download Progress ${loaded} from ${total} bytes (${(progress * 100).toFixed(1)}%)`);

            samples.push({
              loaded,
              total,
              progress,
              bytes,
              download
            });
          },
          headers: {
            'Content-Length': contentLength
          },
          responseType: 'text',
          maxRedirects: 0
        });

        await setTimeoutAsync(500);

        assert.strictEqual(data, content);

        assert.deepStrictEqual(samples, Array.from(function* () {
          for (let i = 1; i <= 10; i++) {
            yield ({
              loaded: chunkLength * i,
              total: contentLength,
              progress: (chunkLength * i) / contentLength,
              bytes: 4,
              download: true
            });
          }
        }()));
      });
    });
  });

  it('should support basic auth', async () => {
    server = await startHTTPServer((req, res) => res.end(req.headers.authorization));

    const user = 'foo';
    const headers = {Authorization: 'Bearer 1234'};
    const res = await axios.get('http://' + user + '@localhost:4444/', {headers: headers});

    const base64 = Buffer.from(user + ':', 'utf8').toString('base64');
    assert.equal(res.data, 'Basic ' + base64);
  });

  it("should support stream.Readable as a payload", async () => {
    server = await startHTTPServer();

    const {data} = await fetchAxios.post('/', stream.Readable.from('OK'));

    assert.strictEqual(data, 'OK');
  });

  describe('request aborting', function() {
    it('should be able to abort the request stream', async function () {
      server = await startHTTPServer({
        rate: 100000,
        useBuffering: true
      });

      const controller = new AbortController();

      setTimeout(() => {
        controller.abort();
      }, 500);

      await assert.rejects(async () => {
        await fetchAxios.post('/', makeReadableStream(), {
          responseType: 'stream',
          signal: controller.signal
        });
      }, /CanceledError/);
    });

    it('should be able to abort the response stream', async function () {
      server = await startHTTPServer((req, res) => {
        pipelineAsync(generateReadable(10000, 10), res);
      });

      const controller = new AbortController();

      setTimeout(() => {
        controller.abort(new Error('test'));
      }, 800);

      const {data} = await fetchAxios.get('/', {
        responseType: 'stream',
        signal: controller.signal
      });

      await assert.rejects(async () => {
        await data.pipeTo(makeEchoStream());
      }, /^(AbortError|CanceledError):/);
    });
  });

  it('should support a timeout', async () => {
    server = await startHTTPServer(async(req, res) => {
      await setTimeoutAsync(1000);
      res.end('OK');
    });

    const timeout = 500;

    const ts = Date.now();

    await assert.rejects(async() => {
      await fetchAxios('/', {
        timeout
      })
    }, /timeout/);

    const passed = Date.now() - ts;

    assert.ok(passed >= timeout - 5, `early cancellation detected (${passed} ms)`);
  });


  it('should combine baseURL and url', async () => {
    server = await startHTTPServer();

    const res = await fetchAxios('/foo');

    assert.equal(res.config.baseURL, LOCAL_SERVER_URL);
    assert.equal(res.config.url, '/foo');
  });

  it('should support params', async() => {
    server = await startHTTPServer((req, res) => res.end(req.url));

    const {data} = await fetchAxios.get('/?test=1', {
      params: {
        foo: 1,
        bar: 2
      }
    });

    assert.strictEqual(data, '/?test=1&foo=1&bar=2');
  });

  it('should handle fetch failed error as an AxiosError with ERR_NETWORK code', async () => {
    try{
      await fetchAxios('http://notExistsUrl.in.nowhere');
      assert.fail('should fail');
    } catch (err) {
      assert.strictEqual(String(err), 'AxiosError: Network Error');
      assert.strictEqual(err.cause && err.cause.code, 'ENOTFOUND');
    }
  });

  it('should get response headers', async () => {
    server = await startHTTPServer((req, res) => {
      res.setHeader('foo', 'bar');
      res.end(req.url)
    });

    const {headers} = await fetchAxios.get('/', {
      responseType: 'stream'
    });

    assert.strictEqual(headers.get('foo'), 'bar');
  });
});
