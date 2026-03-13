import { describe, it } from 'vitest';
import defaults from '../../lib/defaults/index.js';
import transformData from '../../lib/core/transformData.js';
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
