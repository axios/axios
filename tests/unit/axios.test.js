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

  it('should not read __proto__/constructor/prototype getters off the config object passed alongside a url string', async () => {
    const gets = [];
    const config = { headers: { 'X-Test': '1' } };

    ['__proto__', 'constructor', 'prototype'].forEach((key) => {
      Object.defineProperty(config, key, {
        enumerable: true,
        configurable: true,
        get() {
          gets.push(key);
          return key === '__proto__' ? Object.prototype : function () {};
        },
      });
    });

    const client = new Axios({
      adapter: () => Promise.resolve({ data: null, status: 200, statusText: 'OK', headers: {}, config: {} }),
    });

    await client.request('test-url', config);

    assert.deepStrictEqual(gets, []);
  });

  it('should not throw when the url shorthand is called without a config argument', async () => {
    const client = new Axios({
      adapter: (cfg) => Promise.resolve({ data: null, status: 200, statusText: 'OK', headers: {}, config: cfg }),
    });

    const response = await client.request('test-url');

    assert.strictEqual(response.config.url, 'test-url');
  });

  it('should not read non-enumerable own properties off the config object passed alongside a url string', async () => {
    const config = { headers: { 'X-Test': '1' } };

    Object.defineProperty(config, 'hidden', {
      enumerable: false,
      configurable: true,
      get() {
        throw new Error('hidden getter should not be read');
      },
    });

    const client = new Axios({
      adapter: (cfg) => Promise.resolve({ data: null, status: 200, statusText: 'OK', headers: {}, config: cfg }),
    });

    const response = await client.request('test-url', config);

    assert.strictEqual(response.config.url, 'test-url');
  });

  it('should not throw when a config Proxy reports a symbol key with no property descriptor', async () => {
    const phantomSymbol = Symbol('phantom');
    const target = { headers: { 'X-Test': '1' } };
    const config = new Proxy(target, {
      ownKeys(t) {
        return [...Reflect.ownKeys(t), phantomSymbol];
      },
      getOwnPropertyDescriptor(t, prop) {
        if (prop === phantomSymbol) {
          return undefined;
        }
        return Reflect.getOwnPropertyDescriptor(t, prop);
      },
    });

    const client = new Axios({
      adapter: (cfg) => Promise.resolve({ data: null, status: 200, statusText: 'OK', headers: {}, config: cfg }),
    });

    const response = await client.request('test-url', config);

    assert.strictEqual(response.config.url, 'test-url');
  });

  it('should not invoke an inherited Object.prototype setter while copying the config object', async () => {
    let setterInvoked = false;

    Object.defineProperty(Object.prototype, 'baseURL', {
      configurable: true,
      set() {
        setterInvoked = true;
      },
      get() {
        return undefined;
      },
    });

    try {
      const config = { baseURL: 'https://example.com', headers: { 'X-Test': '1' } };
      const client = new Axios({
        adapter: (cfg) => Promise.resolve({ data: null, status: 200, statusText: 'OK', headers: {}, config: cfg }),
      });

      const response = await client.request('test-url', config);

      assert.strictEqual(setterInvoked, false);
      assert.strictEqual(response.config.baseURL, 'https://example.com');
    } finally {
      delete Object.prototype.baseURL;
    }
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
