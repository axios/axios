import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../index.js';
import Axios from '../../lib/core/Axios.js';
import methodList from '../../lib/core/methodList.js';
import defaults from '../../lib/defaults/index.js';

const expectedMethodList = [
  'get',
  'delete',
  'head',
  'options',
  'post',
  'put',
  'patch',
  'purge',
  'link',
  'unlink',
  'query',
];

describe('Axios', () => {
  describe('handle un-writable error stack', () => {
    const testUnwritableErrorStack = async (stackAttributes) => {
      const axios = new Axios({});
      // Mock axios._request to return an Error with an un-writable stack property.
      axios._request = () => {
        const mockError = new Error('test-error');
        Object.defineProperty(mockError, 'stack', stackAttributes);
        throw mockError;
      };

      try {
        await axios.request('test-url', {});
      } catch (e) {
        assert.strictEqual(e.message, 'test-error');
      }
    };

    it('should support errors with a defined but un-writable stack', async () => {
      await testUnwritableErrorStack({ value: {}, writable: false });
    });

    it('should support errors with an undefined and un-writable stack', async () => {
      await testUnwritableErrorStack({ value: undefined, writable: false });
    });

    it('should support errors with a custom getter/setter for the stack property', async () => {
      await testUnwritableErrorStack({
        get: () => ({}),
        set: () => {
          throw new Error('read-only');
        },
      });
    });

    it('should support errors with a custom getter/setter for the stack property (null case)', async () => {
      await testUnwritableErrorStack({
        get: () => null,
        set: () => {
          throw new Error('read-only');
        },
      });
    });
  });

  it('should not throw if the config argument is omitted', () => {
    const client = new Axios();

    assert.deepStrictEqual(client.defaults, {});
  });

  it('should not mutate the config object passed alongside a url string', async () => {
    const client = new Axios({
      adapter: () => Promise.resolve({ data: null, status: 200, statusText: 'OK', headers: {}, config: {} }),
    });
    const config = { headers: { 'X-Test': '1' } };

    await client.request('test-url', config);

    assert.deepStrictEqual(config, { headers: { 'X-Test': '1' } });
  });

  it('should define default headers for every supported method', () => {
    assert.deepStrictEqual(methodList, expectedMethodList);
    assert.strictEqual(Object.isFrozen(methodList), true);

    expectedMethodList.forEach((method) => {
      assert.deepStrictEqual(defaults.headers[method], {});
    });
  });

  it('should apply only the matching method header defaults', async () => {
    const client = axios.create();

    expectedMethodList.forEach((method) => {
      client.defaults.headers[method][`X-Method-${method}`] = method;
    });

    for (const requestMethod of expectedMethodList) {
      await client.request({
        method: requestMethod,
        url: '/method-headers',
        adapter: async (config) => {
          assert.strictEqual(config.headers.get(`X-Method-${requestMethod}`), requestMethod);

          expectedMethodList.forEach((method) => {
            assert.strictEqual(config.headers.has(method), false);

            if (method !== requestMethod) {
              assert.strictEqual(config.headers.has(`X-Method-${method}`), false);
            }
          });

          return {
            data: null,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          };
        },
      });
    }
  });
});
