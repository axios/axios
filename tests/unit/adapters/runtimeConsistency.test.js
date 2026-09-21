import { describe, it } from 'vitest';
import assert from 'assert';
import { execFile } from 'child_process';
import { AbortController } from 'abortcontroller-polyfill/dist/cjs-ponyfill.js';
import axios from '../../../index.js';
import composeSignals from '../../../lib/helpers/composeSignals.js';
import { getFetch } from '../../../lib/adapters/fetch.js';
import estimateDataURLDecodedBytes from '../../../lib/helpers/estimateDataURLDecodedBytes.js';

describe('runtime option consistency', function () {
  ['data:', 'DATA:', 'DaTa:', ' \tDATA:', 'd\na\rt\ta:'].forEach(function (scheme) {
    it('checks the size of ' + JSON.stringify(scheme) + ' URLs before fetch', async function () {
      var calls = 0;
      var fetch = function () {
        calls++;
        return Promise.resolve(new Response('unexpected'));
      };
      await assert.rejects(
        axios.get(scheme + 'text/plain,' + 'a'.repeat(64), {
          adapter: 'fetch',
          maxContentLength: 16,
          env: { fetch: fetch },
        }),
        function (error) {
          return error.code === 'ERR_BAD_RESPONSE';
        }
      );
      assert.strictEqual(calls, 0);
    });
  });

  it('estimates case-variant data URL payloads consistently', function () {
    assert.strictEqual(estimateDataURLDecodedBytes('DATA:text/plain;base64,YWJjZA=='), 4);
    assert.strictEqual(estimateDataURLDecodedBytes('DaTa:text/plain,%41%42'), 2);
  });

  it('retains a permitted case-variant data response', async function () {
    if (typeof fetch !== 'function') return;
    var response = await axios.get('DATA:text/plain,ok', { adapter: 'fetch', maxContentLength: 2 });
    assert.strictEqual(response.data, 'ok');
  });

  it('selects fetch implementations only from own environment entries', async function () {
    if (typeof fetch !== 'function' || typeof Response !== 'function') return;
    var inheritedCalls = 0;
    var ownCalls = 0;
    var env = { Request: null, Response: null };
    Object.defineProperty(Object.prototype, 'fetch', {
      configurable: true,
      writable: true,
      value: function () {
        inheritedCalls++;
        return Promise.resolve(new Response('inherited'));
      },
    });
    try {
      var adapter = getFetch({ env: env });
      var response = await axios.get('data:text/plain,ok', { adapter: adapter });
      assert.strictEqual(response.data, 'ok');
      assert.strictEqual(inheritedCalls, 0);
      var ownResponse = await axios.get('data:text/plain,unused', {
        adapter: 'fetch',
        env: {
          fetch: function () {
            ownCalls++;
            return Promise.resolve(new Response('own'));
          },
        },
      });
      assert.strictEqual(ownResponse.data, 'own');
      assert.strictEqual(ownCalls, 1);
    } finally {
      delete Object.prototype.fetch;
    }
    assert.strictEqual(getFetch({ env: env }), getFetch({ env: env }));
  });

  it('ignores a shared unsubscribe member during signal cleanup', async function () {
    var controller = new AbortController();
    var calls = 0;
    Object.defineProperty(Object.prototype, 'unsubscribe', {
      configurable: true,
      writable: true,
      value: function () {
        calls++;
      },
    });
    try {
      var signal = composeSignals([controller.signal]);
      signal.unsubscribe();
      await new Promise(function (resolve) {
        setImmediate(resolve);
      });
      assert.strictEqual(calls, 0);
      controller.abort();
      assert.strictEqual(signal.aborted, false);
    } finally {
      delete Object.prototype.unsubscribe;
    }
  });

  it('retains an explicitly supplied signal cleanup method', async function () {
    var controller = new AbortController();
    var calls = 0;
    controller.signal.unsubscribe = function (listener) {
      calls++;
      this.removeEventListener('abort', listener);
    };
    var signal = composeSignals([controller.signal]);
    signal.unsubscribe();
    signal.unsubscribe();
    await new Promise(function (resolve) {
      setImmediate(resolve);
    });
    assert.strictEqual(calls, 1);
  });

  it('uses own absolute URL defaults', async function () {
    var client = axios.create({ baseURL: 'http://base.example.invalid/api/' });
    var adapter = function (config) {
      return Promise.resolve({
        data: client.getUri(config),
        status: 200,
        headers: {},
        config: config,
      });
    };
    Object.defineProperty(Object.prototype, 'allowAbsoluteUrls', {
      configurable: true,
      writable: true,
      value: false,
    });
    try {
      var response = await client.get('http://other.example.invalid/resource', {
        adapter: adapter,
      });
      assert.strictEqual(response.data, 'http://other.example.invalid/resource');
      var explicit = await client.get('http://other.example.invalid/resource', {
        adapter: adapter,
        allowAbsoluteUrls: false,
      });
      assert.strictEqual(
        explicit.data,
        'http://base.example.invalid/api/http://other.example.invalid/resource'
      );
    } finally {
      delete Object.prototype.allowAbsoluteUrls;
    }
  });

  [0.5, 1, 1.5].forEach(function (rate) {
    it('continues servicing timers at a rate of ' + rate, function () {
      var moduleURL = new URL('../../../lib/helpers/AxiosTransformStream.js', import.meta.url).href;
      var source =
        'import Transform from ' +
        JSON.stringify(moduleURL) +
        ';' +
        'var stream = new Transform({maxRate: ' +
        rate +
        '});' +
        'var bytes = 0; stream.on("data", function(chunk) {bytes += chunk.length;});' +
        'stream.end(Buffer.alloc(101));' +
        'setTimeout(function() { stream.destroy(); console.log(bytes); }, 30);';
      return new Promise(function (resolve, reject) {
        execFile(
          process.execPath,
          ['--input-type=module', '-e', source],
          {
            timeout: 3000,
            killSignal: 'SIGKILL',
          },
          function (error, stdout) {
            if (error) return reject(error);
            try {
              assert.strictEqual(Number(stdout.trim()), 1);
              resolve();
            } catch (failure) {
              reject(failure);
            }
          }
        );
      });
    });
  });
});
