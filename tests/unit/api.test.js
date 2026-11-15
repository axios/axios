import { describe, it } from 'vitest';
import assert from 'assert';
import axios, { create } from '../../index.js';

describe('static api', () => {
  it('should have request method helpers', () => {
    assert.strictEqual(typeof axios.request, 'function');
    assert.strictEqual(typeof axios.get, 'function');
    assert.strictEqual(typeof axios.head, 'function');
    assert.strictEqual(typeof axios.options, 'function');
    assert.strictEqual(typeof axios.delete, 'function');
    assert.strictEqual(typeof axios.post, 'function');
    assert.strictEqual(typeof axios.put, 'function');
    assert.strictEqual(typeof axios.patch, 'function');
    assert.strictEqual(typeof axios.query, 'function');
  });

  it('should have promise method helpers', async () => {
    const promise = axios.request({
      url: '/test',
      adapter: (config) =>
        Promise.resolve({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {},
        }),
    });

    assert.strictEqual(typeof promise.then, 'function');
    assert.strictEqual(typeof promise.catch, 'function');

    await promise;
  });

  it('should have defaults', () => {
    assert.strictEqual(typeof axios.defaults, 'object');
    assert.strictEqual(typeof axios.defaults.headers, 'object');
  });

  it('should have interceptors', () => {
    assert.strictEqual(typeof axios.interceptors.request, 'object');
    assert.strictEqual(typeof axios.interceptors.response, 'object');
  });

  it('should have all/spread helpers', () => {
    assert.strictEqual(typeof axios.all, 'function');
    assert.strictEqual(typeof axios.spread, 'function');
  });

  it('should have factory method', () => {
    assert.strictEqual(typeof axios.create, 'function');
  });

  it('should expose create as a named export', () => {
    assert.strictEqual(typeof create, 'function');
    assert.strictEqual(create, axios.create);
  });

  it('should have CanceledError, CancelToken, and isCancel properties', () => {
    assert.strictEqual(typeof axios.Cancel, 'function');
    assert.strictEqual(typeof axios.CancelToken, 'function');
    assert.strictEqual(typeof axios.isCancel, 'function');
  });

  it('should have getUri method', () => {
    assert.strictEqual(typeof axios.getUri, 'function');
  });

  describe('getUri url validation', () => {
    // `getUri` applies the same url check as a dispatched request, so it never
    // returns a uri that the request itself would reject.
    const PARAMS = { foo: 'bar' };

    const assertInvalidUrl = (fn, kind) =>
      assert.throws(fn, (error) => {
        assert.strictEqual(error.name, 'AxiosError');
        assert.strictEqual(error.code, 'ERR_INVALID_URL');
        assert.strictEqual(
          error.message,
          `Invalid URL: url cannot be ${kind} when baseURL is not set`
        );
        return true;
      });

    it('should reject a nullish url without baseURL', () => {
      assertInvalidUrl(() => axios.getUri(), 'undefined');
      assertInvalidUrl(() => axios.getUri({}), 'undefined');
      assertInvalidUrl(() => axios.getUri({ params: PARAMS }), 'undefined');
      assertInvalidUrl(() => axios.getUri({ url: undefined, params: PARAMS }), 'undefined');
      assertInvalidUrl(() => axios.getUri({ url: null, params: PARAMS }), 'null');
    });

    it.runIf(typeof fetch === 'function')(
      'should reject a nullish url on a built-in adapter selected by name',
      () => {
        assertInvalidUrl(() => axios.getUri({ adapter: 'fetch', params: PARAMS }), 'undefined');
        assertInvalidUrl(
          () => axios.getUri({ adapter: 'fetch', socketPath: '/tmp/axios.sock', params: PARAMS }),
          'undefined'
        );
      }
    );

    it('should keep building urls that a request would accept', () => {
      assert.strictEqual(axios.getUri({ url: '', params: PARAMS }), '?foo=bar');
      assert.strictEqual(axios.getUri({ url: '/foo', params: PARAMS }), '/foo?foo=bar');
      assert.strictEqual(
        create({ baseURL: 'https://api.example.com' }).getUri({ params: PARAMS }),
        'https://api.example.com?foo=bar'
      );
      assert.strictEqual(
        axios.getUri({ adapter: 'http', socketPath: '/tmp/axios.sock', params: PARAMS }),
        '?foo=bar'
      );
      assert.strictEqual(
        axios.getUri({ adapter: (config) => Promise.resolve({ config }), params: PARAMS }),
        '?foo=bar'
      );
    });

    it('should not resolve the adapter for a usable url', () => {
      // `xhr` is unavailable in Node; resolving it would throw ERR_NOT_SUPPORT.
      assert.strictEqual(axios.getUri({ adapter: 'xhr', url: '/foo' }), '/foo');
      assert.strictEqual(
        create({ baseURL: 'https://api.example.com' }).getUri({ adapter: 'xhr' }),
        'https://api.example.com'
      );
    });

    it('should not see a url that a request interceptor would supply', () => {
      // `getUri` does not run interceptors.
      const instance = create();
      instance.interceptors.request.use((config) => ({ ...config, url: '/foo' }));

      assertInvalidUrl(() => instance.getUri({ params: PARAMS }), 'undefined');
    });
  });

  it('should ignore inherited data for bodyless method helpers', async () => {
    Object.defineProperty(Object.prototype, 'data', {
      value: 'inherited-body',
      configurable: true,
    });

    try {
      await Promise.all(
        ['delete', 'get', 'head', 'options'].map(async (method) => {
          let seenData = 'unset';

          await axios[method]('/test', {
            adapter(config) {
              seenData = config.data;

              return Promise.resolve({
                data: null,
                status: 200,
                statusText: 'OK',
                headers: {},
                config,
                request: {},
              });
            },
          });

          assert.strictEqual(seenData, undefined);
        })
      );
    } finally {
      delete Object.prototype.data;
    }
  });

  it('should ignore inherited nested serializer fields in getUri', () => {
    let serializeInvoked = false;

    Object.defineProperty(Object.prototype, 'serialize', {
      value() {
        serializeInvoked = true;
        return 'inherited=1';
      },
      configurable: true,
    });

    try {
      assert.strictEqual(
        axios.getUri({
          url: '/foo',
          params: { value: 'a b' },
          paramsSerializer: {},
        }),
        '/foo?value=a+b'
      );
      assert.strictEqual(serializeInvoked, false);
    } finally {
      delete Object.prototype.serialize;
    }
  });

  it('should have isAxiosError properties', () => {
    assert.strictEqual(typeof axios.isAxiosError, 'function');
  });

  it('should have mergeConfig properties', () => {
    assert.strictEqual(typeof axios.mergeConfig, 'function');
  });

  it('should have getAdapter properties', () => {
    assert.strictEqual(typeof axios.getAdapter, 'function');
  });

  it('should pass symbol keys to transformRequest', async () => {
    const symbolKey = Symbol('example');
    let transformedData;

    await axios.post(
      '/test',
      {
        [symbolKey]: 'value',
        stringKey: 'value',
      },
      {
        transformRequest(data) {
          transformedData = data;
          return '';
        },
        adapter: (config) =>
          Promise.resolve({
            data: null,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          }),
      }
    );

    assert.strictEqual(transformedData[symbolKey], 'value');
  });
});

describe('instance api', () => {
  const instance = axios.create();

  it('should have request methods', () => {
    assert.strictEqual(typeof instance.request, 'function');
    assert.strictEqual(typeof instance.get, 'function');
    assert.strictEqual(typeof instance.options, 'function');
    assert.strictEqual(typeof instance.head, 'function');
    assert.strictEqual(typeof instance.delete, 'function');
    assert.strictEqual(typeof instance.post, 'function');
    assert.strictEqual(typeof instance.put, 'function');
    assert.strictEqual(typeof instance.patch, 'function');
    assert.strictEqual(typeof instance.query, 'function');
  });

  it('should have interceptors', () => {
    assert.strictEqual(typeof instance.interceptors.request, 'object');
    assert.strictEqual(typeof instance.interceptors.response, 'object');
  });

  it('should pass symbol keys to transformRequest through axios.create', async () => {
    const symbolKey = Symbol('example');
    let transformedData;

    const client = axios.create({
      transformRequest: [
        (data) => {
          transformedData = data;
          return '';
        },
      ],
      adapter: (config) =>
        Promise.resolve({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {},
        }),
    });

    await client.post('/test', {
      [symbolKey]: 'value',
      stringKey: 'value',
    });

    assert.strictEqual(transformedData[symbolKey], 'value');
    assert.strictEqual(transformedData.stringKey, 'value');
  });
});
