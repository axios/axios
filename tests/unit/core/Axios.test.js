import { describe, it, expect } from 'vitest';
import axios from '../../../index.js';
import AxiosError from '../../../lib/core/AxiosError.js';

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

  describe('getUri with a missing url', () => {
    it('rejects a nullish url instead of returning a query-only relative url', () => {
      for (const url of [undefined, null]) {
        let error;

        try {
          axios.getUri({ url, params: { foo: 'bar' } });
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(AxiosError);
        expect(error.code).toBe(AxiosError.ERR_INVALID_URL);
      }
    });

    it('still resolves a request configured with only a baseURL', () => {
      expect(axios.getUri({ baseURL: 'https://api.example.com', params: { foo: 'bar' } })).toBe(
        'https://api.example.com?foo=bar'
      );
    });

    it('still builds the uri when a url is provided', () => {
      expect(axios.getUri({ url: '/foo', params: { foo: 'bar' } })).toBe('/foo?foo=bar');
    });
  });
});
