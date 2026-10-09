import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../index.js';
import Axios from '../../lib/core/Axios.js';
import AxiosHeaders from '../../lib/core/AxiosHeaders.js';
import methodList from '../../lib/core/methodList.js';
import defaults from '../../lib/defaults/index.js';
import { echoHeaders } from '../setup/adapters.js';

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

    const response = await client.post(
      '/axios-headers-bucket',
      {},
      {
        headers: {
          common: new AxiosHeaders({ 'X-Common': 'from-common' }),
          post: new AxiosHeaders({ 'X-Post': 'from-post' }),
        },
        adapter: echoHeaders,
      }
    );

    assert.strictEqual(response.config.headers.get('X-Common'), 'from-common');
    assert.strictEqual(response.config.headers.get('X-Post'), 'from-post');
    assert.strictEqual(response.config.headers.has('common'), false);
    assert.strictEqual(response.config.headers.has('post'), false);
  });

  it('should send an explicitly stringified object as a literal method-named header', async () => {
    const client = axios.create();
    const date = new Date(0);

    const response = await client.post(
      '/non-plain-literal-header',
      {},
      {
        headers: { link: String(date) },
        adapter: echoHeaders,
      }
    );

    assert.strictEqual(response.config.headers.get('Link'), date.toString());
  });

  describe('method-named request headers', () => {
    for (const name of [...expectedMethodList, 'common']) {
      it(`should preserve literal ${name} headers without merging them as defaults`, async () => {
        const client = axios.create({ adapter: echoHeaders });

        for (const headerName of [name, name.toUpperCase()]) {
          for (const value of [
            '<https://example.com/resource>; rel="type"',
            '',
            0,
            true,
            ['a', 'b'],
          ]) {
            const response = await client.request({
              url: '/literal-method-header',
              method: name === 'common' ? 'post' : name,
              headers: { [headerName]: value },
            });

            assert.deepStrictEqual(
              response.config.headers.get(name),
              Array.isArray(value) ? value : String(value)
            );
            assert.strictEqual(response.config.headers.has('0'), false);
            assert.strictEqual(response.config.headers.has('1'), false);
          }
        }
      });
    }

    it('should omit disabled and nullish method-named headers', async () => {
      for (const value of [false, null, undefined]) {
        const response = await axios.request({
          url: '/disabled-method-header',
          method: 'link',
          headers: { link: value, common: value },
          adapter: echoHeaders,
        });

        assert.strictEqual(Object.hasOwn(response.config.headers.toJSON(), 'link'), false);
        assert.strictEqual(Object.hasOwn(response.config.headers.toJSON(), 'common'), false);
        assert.strictEqual(response.config.headers.has('0'), false);
      }
    });

    const bucketFactories = {
      'plain objects': (headers) => ({ ...headers }),
      'null-prototype objects': (headers) => Object.assign(Object.create(null), headers),
      AxiosHeaders: (headers) => new axios.AxiosHeaders(headers),
      'class instances': (headers) => {
        class HeaderDefaults {
          constructor() {
            Object.assign(this, headers);
          }

          toString() {
            throw new Error('A defaults bucket must never become a literal header');
          }
        }

        return new HeaderDefaults();
      },
    };

    for (const [shape, createBucket] of Object.entries(bucketFactories)) {
      it(`should preserve common and method defaults supplied as ${shape}`, async () => {
        const client = axios.create({
          adapter: echoHeaders,
          headers: {
            common: createBucket({ 'X-Common': 'common', 'X-Precedence': 'common' }),
            post: createBucket({ Authorization: 'Bearer TEST_ONLY', 'X-Precedence': 'post' }),
          },
        });

        for (const method of ['get', 'post']) {
          const response = await client.request({ url: '/header-defaults', method });
          const headers = response.config.headers;

          assert.strictEqual(headers.get('X-Common'), 'common');
          assert.strictEqual(headers.get('X-Precedence'), method === 'post' ? 'post' : 'common');
          assert.strictEqual(
            headers.get('Authorization'),
            method === 'post' ? 'Bearer TEST_ONLY' : undefined
          );
          assert.strictEqual(headers.has('common'), false);
          assert.strictEqual(headers.has('post'), false);
        }

        const response = await client.post('/header-override', null, {
          headers: { 'X-Precedence': 'request' },
        });
        assert.strictEqual(response.config.headers.get('X-Precedence'), 'request');
      });
    }

    it('should preserve application-prototype buckets without reading shared-prototype buckets', async () => {
      const headers = Object.create({ common: { 'X-Template': 'kept' } });
      let accessed = false;

      Object.defineProperty(Object.prototype, 'propfind', {
        configurable: true,
        get() {
          accessed = true;
          throw new Error('Shared prototype bucket was read');
        },
      });

      try {
        const response = await axios.request({
          url: '/inherited-buckets',
          method: 'propfind',
          headers,
          adapter: echoHeaders,
        });

        assert.strictEqual(response.config.headers.get('X-Template'), 'kept');
        assert.strictEqual(accessed, false);
      } finally {
        delete Object.prototype.propfind;
      }
    });
  });
});
