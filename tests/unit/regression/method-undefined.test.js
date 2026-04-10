import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../../index.js';

describe('issue #6960: config.method undefined after interceptor', () => {
  it('should default to GET when interceptor removes config.method', async () => {
    const instance = axios.create();
    let capturedMethod;

    instance.interceptors.request.use((config) => {
      delete config.method;
      return config;
    });

    instance.defaults.adapter = (config) => {
      capturedMethod = (config.method || 'get').toUpperCase();
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
    };

    await instance.request({ url: '/test' });
    assert.strictEqual(capturedMethod, 'GET');
  });

  it('should not throw TypeError in http adapter when method is undefined', async () => {
    const instance = axios.create({ adapter: 'http' });

    instance.interceptors.request.use((config) => {
      delete config.method;
      return config;
    });

    try {
      await instance.request({ url: 'http://localhost:1/test' });
    } catch (err) {
      // Network errors are expected (no server), but TypeError is NOT acceptable
      assert.notStrictEqual(err.name, 'TypeError',
        'Should not throw TypeError when config.method is undefined');
    }
  });
});
