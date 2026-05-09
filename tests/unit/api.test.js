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

  it('should support URL object shorthand with config', async () => {
    const url = new URL('http://example.com/test?a=1');

    const response = await axios(url, {
      params: {
        b: 2,
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
    });

    assert.strictEqual(response.config.url, url.toString());
    assert.deepStrictEqual(response.config.params, { b: 2 });
  });

  it('should not require global URL to be a constructor for string requests', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'URL');

    Object.defineProperty(globalThis, 'URL', {
      configurable: true,
      writable: true,
      value: {},
    });

    try {
      const response = await axios('/test', {
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

      assert.strictEqual(response.config.url, '/test');
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, 'URL', descriptor);
      } else {
        delete globalThis.URL;
      }
    }
  });

  it('should normalize URL object set by a request interceptor before dispatch', async () => {
    const url = new URL('http://example.com/interceptor');
    let transformUrl;
    const interceptorId = axios.interceptors.request.use((config) => {
      config.url = url;
      return config;
    });

    try {
      const response = await axios('/test', {
        transformRequest: [
          function (data) {
            transformUrl = this.url;
            return data;
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

      assert.strictEqual(transformUrl, url.toString());
      assert.strictEqual(response.config.url, url.toString());
    } finally {
      axios.interceptors.request.eject(interceptorId);
    }
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

  it('should support URL object config in getUri', () => {
    const url = new URL('https://api.example.com/foo');

    assert.strictEqual(axios.getUri({ url }), url.toString());
    assert.strictEqual(
      axios.getUri({ baseURL: 'https://example.com/base', url }),
      url.toString()
    );
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
});
