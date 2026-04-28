import { describe, it } from 'vitest';
import assert from 'assert';
import dispatchRequest from '../../../lib/core/dispatchRequest.js';
import AxiosError from '../../../lib/core/AxiosError.js';
import defaults from '../../../lib/defaults/index.js';

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
