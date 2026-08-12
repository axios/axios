import { describe, it, expect } from 'vitest';
import axios from '../../../index.js';

describe('core::Axios', () => {
  describe('request error stack decoration', () => {
    async function expectAdapterFailurePreserved() {
      const failure = new Error('adapter failure');

      await expect(
        axios.request({
          url: 'http://localhost/test',
          adapter: () => Promise.reject(failure),
        })
      ).rejects.toBe(failure);
    }

    it('preserves the original error when Error.prepareStackTrace returns a non-string stack', async () => {
      const original = Error.prepareStackTrace;
      // Simulates instrumentation that overrides the V8 hook to return
      // structured call-site data instead of a formatted string.
      Error.prepareStackTrace = () => ({});

      try {
        await expectAdapterFailurePreserved();
      } finally {
        Error.prepareStackTrace = original;
      }
    });

    it('preserves the original error when Error.prepareStackTrace throws', async () => {
      const original = Error.prepareStackTrace;
      Error.prepareStackTrace = () => {
        throw new Error('stack formatting failure');
      };

      try {
        await expectAdapterFailurePreserved();
      } finally {
        Error.prepareStackTrace = original;
      }
    });

    it('preserves the original error when Error.captureStackTrace throws', async () => {
      const original = Error.captureStackTrace;
      Error.captureStackTrace = () => {
        throw new Error('stack capture failure');
      };

      try {
        await expectAdapterFailurePreserved();
      } finally {
        Error.captureStackTrace = original;
      }
    });
  });

  describe('interceptor handlers replaced with a nullish value', () => {
    it('dispatches the request and skips the interceptor chains', async () => {
      const instance = axios.create({
        adapter: (config) =>
          Promise.resolve({
            data: 'ok',
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          }),
      });

      instance.interceptors.request.use((config) => config);
      instance.interceptors.response.use((response) => response);

      instance.interceptors.request.handlers = null;
      instance.interceptors.response.handlers = undefined;

      const response = await instance.get('http://localhost/test');

      expect(response.data).toBe('ok');
    });
  });
});
