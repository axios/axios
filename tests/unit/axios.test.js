import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../index.js';
import Axios from '../../lib/core/Axios.js';
import AxiosHeaders from '../../lib/core/AxiosHeaders.js';
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

  it('should send a literal header that shares its name with a method', async () => {
    const client = axios.create();
    const link = '<http://www.w3.org/ns/ldp#Resource>; rel="type"';

    const echoHeaders = async (config) => ({
      data: null,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {},
    });

    for (const headerName of ['link', 'Link']) {
      const response = await client.post(
        '/literal-method-header',
        {},
        {
          headers: { [headerName]: link },
          adapter: echoHeaders,
        }
      );

      assert.strictEqual(response.config.headers.get('Link'), link);
    }

    const response = await client.post(
      '/literal-method-header',
      {},
      {
        headers: { options: 'a', purge: 'b', unlink: 'c', query: 'd' },
        adapter: echoHeaders,
      }
    );

    assert.strictEqual(response.config.headers.get('options'), 'a');
    assert.strictEqual(response.config.headers.get('purge'), 'b');
    assert.strictEqual(response.config.headers.get('unlink'), 'c');
    assert.strictEqual(response.config.headers.get('query'), 'd');
  });

  it('should treat an AxiosHeaders instance under a method name as defaults', async () => {
    const client = axios.create();

    const echoHeaders = async (config) => ({
      data: null,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {},
    });

    const response = await client.post(
      '/axios-headers-bucket',
      {},
      {
        headers: {
          common: new AxiosHeaders({'X-Common': 'from-common'}),
          post: new AxiosHeaders({'X-Post': 'from-post'}),
        },
        adapter: echoHeaders,
      }
    );

    assert.strictEqual(response.config.headers.get('X-Common'), 'from-common');
    assert.strictEqual(response.config.headers.get('X-Post'), 'from-post');
    assert.strictEqual(response.config.headers.has('common'), false);
    assert.strictEqual(response.config.headers.has('post'), false);
  });

  it('should send a non-plain object under a method name as a literal header', async () => {
    const client = axios.create();
    const date = new Date(0);

    const echoHeaders = async (config) => ({
      data: null,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {},
    });

    const response = await client.post(
      '/non-plain-literal-header',
      {},
      {
        headers: {link: date},
        adapter: echoHeaders,
      }
    );

    assert.strictEqual(response.config.headers.get('Link'), date.toString());
  });
});
