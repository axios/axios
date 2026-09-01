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
  describe('synchronous request interceptor chain', () => {
    const SYNC = { synchronous: true };
    // Registration order, so the chain reads the same way the test does.
    const ORDERED = { legacyInterceptorReqResOrdering: false };

    const create = (calls) => {
      const instance = axios.create({
        transitional: ORDERED,
        adapter: (config) => {
          calls.push('dispatch');
          return Promise.resolve({ data: 'ok', status: 200, headers: {}, config });
        },
      });
      return instance;
    };

    it('offers the error to a rejection handler registered on a later interceptor', async () => {
      const calls = [];
      const instance = create(calls);
      const error = new Error('boom');

      instance.interceptors.request.use(
        () => {
          calls.push('fulfilled0');
          throw error;
        },
        null,
        SYNC
      );
      instance.interceptors.request.use(
        undefined,
        (err) => {
          calls.push('rejected1');
          return Promise.reject(err);
        },
        SYNC
      );

      await expect(instance.get('/foo')).rejects.toBe(error);
      expect(calls).toEqual(['fulfilled0', 'rejected1']);
    });

    it('resumes the chain when a rejection handler recovers synchronously', async () => {
      const calls = [];
      const instance = create(calls);
      let lastConfig;

      instance.interceptors.request.use(
        (config) => {
          calls.push('fulfilled0');
          lastConfig = config;
          throw new Error('boom');
        },
        null,
        SYNC
      );
      instance.interceptors.request.use(
        undefined,
        () => {
          calls.push('rejected1');
          return lastConfig;
        },
        SYNC
      );
      instance.interceptors.request.use(
        (config) => {
          calls.push('fulfilled2');
          return config;
        },
        null,
        SYNC
      );

      await instance.get('/foo');
      expect(calls).toEqual(['fulfilled0', 'rejected1', 'fulfilled2', 'dispatch']);
    });

    it('carries an error rethrown by one handler to the next one', async () => {
      const calls = [];
      const instance = create(calls);
      const rethrown = new Error('rethrown');

      instance.interceptors.request.use(
        () => {
          throw new Error('original');
        },
        () => {
          calls.push('rejected0');
          throw rethrown;
        },
        SYNC
      );
      instance.interceptors.request.use(
        undefined,
        (err) => {
          calls.push(`rejected1:${err.message}`);
          return Promise.reject(err);
        },
        SYNC
      );

      await expect(instance.get('/foo')).rejects.toBe(rethrown);
      expect(calls).toEqual(['rejected0', 'rejected1:rethrown']);
      expect(calls).not.toContain('dispatch');
    });

    it('still calls the rejection handler on the interceptor that threw', async () => {
      const calls = [];
      const instance = create(calls);
      const error = new Error('boom');

      instance.interceptors.request.use(
        () => {
          throw error;
        },
        (err) => {
          calls.push('rejected0');
          return Promise.reject(err);
        },
        SYNC
      );

      await expect(instance.get('/foo')).rejects.toBe(error);
      expect(calls).toEqual(['rejected0']);
    });

    it('rejects with the original error and does not dispatch when nothing handles it', async () => {
      const calls = [];
      const instance = create(calls);
      const error = new Error('deadly');

      instance.interceptors.request.use(
        () => {
          throw error;
        },
        null,
        SYNC
      );

      await expect(instance.get('/foo')).rejects.toBe(error);
      expect(calls).toEqual([]);
    });

    it('dispatches with the last valid config when a handler recovers asynchronously', async () => {
      const calls = [];
      const instance = create(calls);
      let dispatchedUrl;

      instance.interceptors.request.use(
        () => {
          throw new Error('boom');
        },
        () => Promise.resolve({ url: '/bar' }),
        SYNC
      );
      instance.interceptors.response.use((response) => {
        dispatchedUrl = response.config.url;
        return response;
      });

      await instance.get('/foo');
      expect(dispatchedUrl).toBe('/foo');
      expect(calls).toEqual(['dispatch']);
    });

    it('skips interceptors that only supply a fulfilled handler while in the error state', async () => {
      const calls = [];
      const instance = create(calls);
      const error = new Error('boom');

      instance.interceptors.request.use(
        () => {
          throw error;
        },
        null,
        SYNC
      );
      instance.interceptors.request.use(
        (config) => {
          calls.push('fulfilled1');
          return config;
        },
        null,
        SYNC
      );

      await expect(instance.get('/foo')).rejects.toBe(error);
      expect(calls).toEqual([]);
    });
  });
});
