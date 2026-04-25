import { describe, it } from 'vitest';
import defaults from '../../lib/defaults/index.js';
import transformData from '../../lib/core/transformData.js';
import AxiosError from '../../lib/core/AxiosError.js';
import assert from 'assert';

describe('transformResponse', () => {
  describe('200 request', () => {
    it('parses json', () => {
      const data = '{"message": "hello, world"}';
      const result = transformData.call(
        {
          data,
          response: {
            headers: { 'content-type': 'application/json' },
            status: 200,
          },
        },
        defaults.transformResponse
      );
      assert.strictEqual(result.message, 'hello, world');
    });

    it('ignores XML', () => {
      const data = '<message>hello, world</message>';
      const result = transformData.call(
        {
          data,
          response: {
            headers: { 'content-type': 'text/xml' },
            status: 200,
          },
        },
        defaults.transformResponse
      );
      assert.strictEqual(result, data);
    });
  });

  describe('malformed JSON with responseType: json', () => {
    it('throws AxiosError with ERR_BAD_RESPONSE code', () => {
      const response = { status: 200, headers: {}, data: '{bad json' };
      const config = {
        responseType: 'json',
        transitional: { silentJSONParsing: false, forcedJSONParsing: true },
        response,
      };

      assert.throws(
        () => transformData.call(config, defaults.transformResponse, response),
        (e) => e instanceof AxiosError && e.code === AxiosError.ERR_BAD_RESPONSE
      );
    });

    it('attaches response to AxiosError so error.status and error.response are available', () => {
      // Regression test for https://github.com/axios/axios/issues/7224
      // When JSON.parse fails in strict mode, the thrown AxiosError must carry
      // the original response so callers can inspect error.status and
      // error.response without having to re-examine the raw response.
      const response = { status: 200, headers: {}, data: '{bad json' };
      const config = {
        responseType: 'json',
        transitional: { silentJSONParsing: false, forcedJSONParsing: true },
        response,
      };

      let thrown;
      try {
        transformData.call(config, defaults.transformResponse, response);
      } catch (e) {
        thrown = e;
      }

      assert.ok(thrown instanceof AxiosError, 'must be AxiosError');
      assert.strictEqual(thrown.status, 200, 'error.status must equal response status');
      assert.strictEqual(thrown.response, response, 'error.response must be the original response');
    });
  });

  describe('204 request', () => {
    it('does not parse the empty string', () => {
      const data = '';
      const result = transformData.call(
        {
          data,
          response: {
            headers: { 'content-type': undefined },
            status: 204,
          },
        },
        defaults.transformResponse
      );
      assert.strictEqual(result, '');
    });

    it('does not parse undefined', () => {
      const data = undefined;
      const result = transformData.call(
        {
          data,
          response: {
            headers: { 'content-type': undefined },
            status: 200,
          },
        },
        defaults.transformResponse
      );
      assert.strictEqual(result, data);
    });
  });
});
