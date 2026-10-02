import { describe, it } from 'vitest';
import assert from 'assert';
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
