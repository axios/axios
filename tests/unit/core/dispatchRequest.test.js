import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import assert from 'assert';
import axios from '../../../index.js';
import dispatchRequest from '../../../lib/core/dispatchRequest.js';
import AxiosError from '../../../lib/core/AxiosError.js';
import defaults from '../../../lib/defaults/index.js';
import adapters from '../../../lib/adapters/adapters.js';
import fetchAdapter from '../../../lib/adapters/fetch.js';
import resolveConfig from '../../../lib/helpers/resolveConfig.js';

class ReactNativeFormData {
  append() {}

  getParts() {
    return [];
  }

  get [Symbol.toStringTag]() {
    return 'FormData';
  }
}

function baseConfig(overrides = {}) {
  return {
    method: 'get',
    url: '/test',
    headers: {},
    transformRequest: defaults.transformRequest,
    transformResponse: defaults.transformResponse,
    transitional: { silentJSONParsing: false, forcedJSONParsing: true },
    responseType: 'json',
    ...overrides,
  };
}

describe('core::dispatchRequest', () => {
  describe('request url validation', () => {
    const PARAMS = { foo: 'bar' };

    const okResponse = (config) =>
      Promise.resolve({
        data: null,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {},
      });

    // dispatchRequest throws synchronously when the guard rejects.
    const rejection = async (dispatch) => {
      try {
        await dispatch();
      } catch (e) {
        return e;
      }

      assert.fail('expected the request to reject');
    };

    const assertGuardRejection = (error) => {
      assert.ok(error instanceof AxiosError, 'must be AxiosError');
      assert.strictEqual(error.code, AxiosError.ERR_INVALID_URL);
      assert.match(error.message, /for a dispatched request$/);
    };

    // Swap the registered `http` built-in for a stub. `getAdapter('http')` and
    // the built-in check both read the same registry, so the stub is treated
    // as the built-in transport and the guard runs in full against it.
    let stubbedHttp;
    let originalHttp;

    beforeEach(() => {
      originalHttp = adapters.adapters.http;
      stubbedHttp = vi.fn(okResponse);
      adapters.adapters.http = stubbedHttp;
    });

    afterEach(() => {
      adapters.adapters.http = originalHttp;
    });

    const builtinConfig = (overrides = {}) => baseConfig({ adapter: 'http', ...overrides });

    describe.each([null, undefined])('a %s url', (url) => {
      it.each([
        ['without params', undefined],
        ['with params', PARAMS],
      ])('rejects on the default adapter path %s', async (_, params) => {
        // The default adapter list resolves to the real Node HTTP adapter.
        adapters.adapters.http = originalHttp;

        assertGuardRejection(
          await rejection(() => dispatchRequest(baseConfig({ url, params, adapter: undefined })))
        );
      });

      it('rejects on a built-in adapter before it runs', async () => {
        assertGuardRejection(await rejection(() => dispatchRequest(builtinConfig({ url }))));
        assert.strictEqual(stubbedHttp.mock.calls.length, 0, 'adapter must not run');
      });

      it('rejects when a built-in name wins the resolution of an array', async () => {
        assertGuardRejection(
          await rejection(() =>
            dispatchRequest(baseConfig({ url, adapter: ['xhr', 'http', 'fetch'] }))
          )
        );
        assert.strictEqual(stubbedHttp.mock.calls.length, 0, 'adapter must not run');
      });

      it.each([
        ['the global fetch', undefined],
        ['a custom env.fetch', true],
      ])('rejects on the fetch adapter with %s', async (_, useCustomFetch) => {
        const customFetch = vi.fn(() => Promise.resolve(new Response('{}')));

        assertGuardRejection(
          await rejection(() =>
            dispatchRequest(
              baseConfig({
                url,
                params: PARAMS,
                adapter: 'fetch',
                env: useCustomFetch ? { fetch: customFetch } : undefined,
              })
            )
          )
        );
        assert.strictEqual(customFetch.mock.calls.length, 0, 'fetch must not be called');
      });

      // A fetch adapter passed as a function can be cached for a different
      // environment from the request's: a real request inherits `env.Blob`
      // from the defaults, so `fetch.get(config)` returns another instance.
      it.each([
        ["axios.getAdapter('fetch')", () => axios.getAdapter('fetch')],
        ['the default export of the fetch adapter module', () => fetchAdapter],
        [
          "axios.getAdapter('fetch') for a custom env.fetch",
          (customFetch) => axios.getAdapter('fetch', { env: { fetch: customFetch } }),
        ],
      ])('rejects when the fetch adapter is passed as %s', async (_, resolve) => {
        const customFetch = vi.fn(() => Promise.resolve(new Response('{}')));

        assertGuardRejection(
          await rejection(() =>
            dispatchRequest(
              baseConfig({
                url,
                params: PARAMS,
                env: defaults.env,
                adapter: resolve(customFetch),
              })
            )
          )
        );
        assert.strictEqual(customFetch.mock.calls.length, 0, 'fetch must not be called');
      });

      it('is accepted on a built-in adapter when a baseURL supplies the destination', async () => {
        await dispatchRequest(builtinConfig({ url, baseURL: 'https://example.com' }));

        assert.strictEqual(stubbedHttp.mock.calls.length, 1, 'adapter must run');
      });

      it('is accepted on the fetch adapter when a baseURL supplies the destination', async () => {
        const customFetch = vi.fn(() => Promise.resolve(new Response('{}')));

        await dispatchRequest(
          baseConfig({
            url,
            baseURL: 'https://example.com',
            params: PARAMS,
            adapter: 'fetch',
            env: { fetch: customFetch },
          })
        );

        assert.strictEqual(customFetch.mock.calls.length, 1, 'fetch must be called');
        assert.strictEqual(customFetch.mock.calls[0][0].url, 'https://example.com/?foo=bar');
      });

      it('is accepted on the HTTP adapter when a socketPath supplies the destination', async () => {
        await dispatchRequest(builtinConfig({ url, socketPath: '/var/run/app.sock' }));

        assert.strictEqual(stubbedHttp.mock.calls.length, 1, 'adapter must run');
      });

      it('rejects on the fetch adapter even when a socketPath is set', async () => {
        const customFetch = vi.fn(() => Promise.resolve(new Response('{}')));

        assertGuardRejection(
          await rejection(() =>
            dispatchRequest(
              baseConfig({
                url,
                socketPath: '/var/run/app.sock',
                adapter: 'fetch',
                env: { fetch: customFetch },
              })
            )
          )
        );
        assert.strictEqual(customFetch.mock.calls.length, 0, 'fetch must not be called');
      });

      it.each([
        ['on its own', (adapter) => adapter],
        ['inside an array', (adapter) => [adapter]],
        ['listed before a built-in name', (adapter) => [adapter, 'xhr', 'http', 'fetch']],
      ])('is left to a caller-supplied adapter %s', async (_, wrap) => {
        const customAdapter = vi.fn(okResponse);

        await dispatchRequest(baseConfig({ url, params: PARAMS, adapter: wrap(customAdapter) }));

        assert.strictEqual(customAdapter.mock.calls.length, 1, 'adapter must run');
        assert.strictEqual(stubbedHttp.mock.calls.length, 0, 'built-in must not run');
      });
    });

    it.each([
      ['without params', undefined],
      ['with params', PARAMS],
    ])('accepts an empty-string url on a built-in adapter %s', async (_, params) => {
      await dispatchRequest(builtinConfig({ url: '', params }));

      assert.strictEqual(stubbedHttp.mock.calls.length, 1, 'adapter must run');
    });
  });

  describe('JSON FormData transform', () => {
    it('rejects deeply nested field paths before adapter dispatch', async () => {
      const data = new FormData();
      let adapterCalled = false;

      data.append('foo' + '[bar]'.repeat(101), '123');

      const config = baseConfig({
        data,
        headers: { 'Content-Type': 'application/json' },
        method: 'post',
        adapter(adapterConfig) {
          adapterCalled = true;
          return Promise.resolve({
            data: null,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: adapterConfig,
            request: {},
          });
        },
      });

      let thrown;
      try {
        await dispatchRequest(config);
      } catch (e) {
        thrown = e;
      }

      assert.ok(thrown instanceof AxiosError, 'must be AxiosError');
      assert.strictEqual(thrown.code, AxiosError.ERR_FORM_DATA_DEPTH_EXCEEDED);
      assert.strictEqual(adapterCalled, false);
    });
  });

  describe('JSON parse failure on adapter resolution', () => {
    it('rejects with AxiosError carrying response and status', async () => {
      const response = {
        data: '{bad json',
        status: 418,
        statusText: "I'm a teapot",
        headers: {},
        config: null,
        request: {},
      };
      const config = baseConfig({ adapter: () => Promise.resolve(response) });

      let thrown;
      try {
        await dispatchRequest(config);
      } catch (e) {
        thrown = e;
      }

      assert.ok(thrown instanceof AxiosError, 'must be AxiosError');
      assert.strictEqual(thrown.code, AxiosError.ERR_BAD_RESPONSE);
      assert.strictEqual(thrown.response, response, 'error.response must be the original response');
      assert.strictEqual(thrown.status, 418, 'error.status must equal response status');
    });

    it('cleans up config.response after the transform throws', async () => {
      const response = {
        data: '{bad json',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: null,
        request: {},
      };
      const config = baseConfig({ adapter: () => Promise.resolve(response) });

      try {
        await dispatchRequest(config);
      } catch (_) {
        // expected
      }

      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(config, 'response'),
        false,
        'config.response must be deleted in finally'
      );
    });
  });

  describe('JSON parse failure on adapter rejection', () => {
    it('rejects with AxiosError carrying response and status (rejection path)', async () => {
      const response = {
        data: '{bad json',
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: null,
        request: {},
      };
      const reason = new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE);
      reason.response = response;
      const config = baseConfig({ adapter: () => Promise.reject(reason) });

      let thrown;
      try {
        await dispatchRequest(config);
      } catch (e) {
        thrown = e;
      }

      assert.ok(thrown instanceof AxiosError, 'must be AxiosError');
      assert.strictEqual(thrown.response, response, 'error.response must be the original response');
      assert.strictEqual(thrown.status, 500, 'error.status must equal response status');
    });

    it('cleans up config.response after the rejection-path transform', async () => {
      const response = {
        data: '{bad json',
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: null,
        request: {},
      };
      const reason = new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE);
      reason.response = response;
      const config = baseConfig({ adapter: () => Promise.reject(reason) });

      try {
        await dispatchRequest(config);
      } catch (_) {
        // expected
      }

      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(config, 'response'),
        false,
        'config.response must be deleted in finally on the rejection path'
      );
    });
  });

  describe('happy path', () => {
    it('clears default Content-Type for React Native FormData before adapter headers are sent', async () => {
      const data = new ReactNativeFormData();
      const response = {
        data: '{"ok":true}',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: null,
        request: {},
      };
      const config = baseConfig({
        method: 'post',
        data,
        adapter: (adapterConfig) => {
          assert.strictEqual(
            adapterConfig.headers.getContentType(),
            'application/x-www-form-urlencoded',
            'dispatchRequest should apply the default POST Content-Type first'
          );

          const resolvedConfig = resolveConfig(adapterConfig);

          assert.strictEqual(resolvedConfig.data, data);
          assert.strictEqual(resolvedConfig.headers.getContentType(), undefined);
          assert.strictEqual(
            Object.prototype.hasOwnProperty.call(resolvedConfig.headers.toJSON(), 'Content-Type'),
            false,
            'resolved adapter headers must omit Content-Type for React Native FormData'
          );

          return Promise.resolve(response);
        },
      });

      const result = await dispatchRequest(config);

      assert.deepStrictEqual(result.data, { ok: true });
    });

    it('cleans up config.response after a successful resolution', async () => {
      const response = {
        data: '{"ok":true}',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: null,
        request: {},
      };
      const config = baseConfig({ adapter: () => Promise.resolve(response) });

      const result = await dispatchRequest(config);

      assert.deepStrictEqual(result.data, { ok: true });
      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(config, 'response'),
        false,
        'config.response must not be left set after a successful request'
      );
    });
  });
});

describe('core::dispatchRequest response timing', () => {
  let now;

  beforeEach(() => {
    now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const createResponse = (config, status = 200) => ({
    status,
    statusText: status === 200 ? 'OK' : 'Server Error',
    headers: {},
    data: '{"ok":true}',
    config,
  });

  for (const status of [200, 500]) {
    it.each([25, -25])(
      `measures only adapter execution for status ${status} with a %s ms elapsed clock`,
      async (elapsed) => {
        const expectedDuration = Math.max(0, elapsed);
        const client = axios.create({
          transformRequest: [
            (data) => {
              now += 200;
              return data;
            },
          ],
          transformResponse: [
            function (data) {
              assert.strictEqual(this.response.duration, expectedDuration);
              now += 400;
              return JSON.parse(data);
            },
          ],
          adapter: async (config) => {
            now += elapsed;
            const response = createResponse(config, status);
            if (status === 500) {
              throw new AxiosError('boom', AxiosError.ERR_BAD_RESPONSE, config, null, response);
            }
            return response;
          },
        });
        client.interceptors.request.use((config) => {
          now += 100;
          return config;
        });
        client.interceptors.response.use(
          (response) => {
            now += 800;
            return response;
          },
          (error) => {
            now += 800;
            throw error;
          }
        );

        const result = await client.get('/timing').catch((error) => error);
        assert.strictEqual(axios.isAxiosError(result), status === 500);
        const response = status === 500 ? result.response : result;
        assert.strictEqual(response.duration, expectedDuration);
        assert.deepStrictEqual(response.data, { ok: true });
        assert.strictEqual(now, 2500 + elapsed);
      }
    );

    it(`retains duration when strict JSON parsing fails for status ${status}`, async () => {
      const error = await axios
        .get('/invalid-json', {
          responseType: 'json',
          transitional: { silentJSONParsing: false },
          adapter: async (config) => {
            now += 25;
            const response = { ...createResponse(config, status), data: '{bad json' };
            if (status === 500) {
              throw new AxiosError('boom', AxiosError.ERR_BAD_RESPONSE, config, null, response);
            }
            return response;
          },
        })
        .catch((error) => error);

      assert.strictEqual(error.code, AxiosError.ERR_BAD_RESPONSE);
      assert.strictEqual(error.response.status, status);
      assert.strictEqual(error.response.duration, 25);
    });
  }

  it('keeps start times independent for overlapping requests', async () => {
    const pending = [];
    const client = axios.create({
      adapter: (config) =>
        new Promise((resolve) => {
          pending.push(() => resolve(createResponse(config)));
        }),
    });

    const first = client.get('/first');
    now += 10;
    const second = client.get('/second');
    now += 20;
    pending[0]();
    assert.strictEqual((await first).duration, 30);
    now += 20;
    pending[1]();
    assert.strictEqual((await second).duration, 40);
  });

  it.each([AxiosError.ERR_NETWORK, AxiosError.ECONNABORTED])(
    'preserves %s errors without creating a response or duration',
    async (code) => {
      let reason;
      const error = await axios
        .get('/failure', {
          adapter: async (config) => {
            now += 25;
            reason = new AxiosError('failure', code, config);
            throw reason;
          },
        })
        .catch((error) => error);

      assert.strictEqual(error, reason);
      assert.strictEqual(error.response, undefined);
      assert.strictEqual(Object.hasOwn(error, 'duration'), false);
    }
  );

  it.each(['signal', 'cancelToken'])(
    'preserves %s cancellation before timing a response',
    async (kind) => {
      const controller = new AbortController();
      const source = axios.CancelToken.source();
      let response;
      const error = await axios
        .get('/cancel', {
          ...(kind === 'signal' ? { signal: controller.signal } : { cancelToken: source.token }),
          adapter: async (config) => {
            response = createResponse(config);
            now += 25;
            kind === 'signal' ? controller.abort() : source.cancel();
            return response;
          },
        })
        .catch((error) => error);

      assert.strictEqual(axios.isCancel(error), true);
      assert.strictEqual(error.response, undefined);
      assert.strictEqual(Object.hasOwn(response, 'duration'), false);
    }
  );

  it('does not read the wall clock when performance.now() is available', async () => {
    // Next.js Cache Components rejects Date.now() during prerendering (#11407).
    const dateNow = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('Date.now() must not be called');
    });

    const response = await axios.get('/monotonic', {
      adapter: async (config) => {
        now += 25;
        return createResponse(config);
      },
    });

    assert.strictEqual(response.duration, 25);
    assert.strictEqual(dateNow.mock.calls.length, 0);
  });

  it('rounds sub-millisecond performance.now() readings to whole milliseconds', async () => {
    now = 1000.2;
    const response = await axios.get('/fractional', {
      adapter: async (config) => {
        now += 24.6;
        return createResponse(config);
      },
    });

    assert.strictEqual(response.duration, 25);
  });

  it.each([
    ['is missing', undefined],
    ['has no now()', {}],
  ])('falls back to Date.now() when performance %s', async (_label, stub) => {
    vi.stubGlobal('performance', stub);
    vi.spyOn(Date, 'now').mockImplementation(() => now);

    const forward = await axios.get('/fallback', {
      adapter: async (config) => {
        now += 25;
        return createResponse(config);
      },
    });
    const backward = await axios.get('/fallback-backward', {
      adapter: async (config) => {
        now -= 25;
        return createResponse(config);
      },
    });

    assert.strictEqual(forward.duration, 25);
    assert.strictEqual(backward.duration, 0);
  });

  it('replaces a custom adapter duration with the dispatch measurement', async () => {
    const response = await axios.get('/custom', {
      adapter: async (config) => {
        now += 25;
        return { ...createResponse(config), duration: 999 };
      },
    });

    assert.strictEqual(response.duration, 25);
  });
});
