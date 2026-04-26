import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../index.js';

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

  it('should have CanceledError, CancelToken, and isCancel properties', () => {
    assert.strictEqual(typeof axios.Cancel, 'function');
    assert.strictEqual(typeof axios.CancelToken, 'function');
    assert.strictEqual(typeof axios.isCancel, 'function');
  });

  it('should have getUri method', () => {
    assert.strictEqual(typeof axios.getUri, 'function');
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
  });

  it('should have interceptors', () => {
    assert.strictEqual(typeof instance.interceptors.request, 'object');
    assert.strictEqual(typeof instance.interceptors.response, 'object');
  });
});
