import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import assert from 'assert';
import axios from '../../../index.js';
import dispatchRequest from '../../../lib/core/dispatchRequest.js';
import AxiosError from '../../../lib/core/AxiosError.js';
import defaults from '../../../lib/defaults/index.js';
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
    vi.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
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
      `measures only adapter execution for status ${status} with a %s ms clock change`,
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
