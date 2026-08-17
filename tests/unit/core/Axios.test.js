import { describe, it, expect } from 'vitest';
import axios from '../../../index.js';

describe('core::Axios', () => {
  describe('request error stack decoration', () => {
    async function namedCaller() {
      await axios.request({
        url: 'http://localhost/test',
        adapter: () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('adapter failure')), 0);
          }),
      });
    }

    async function expectAdapterFailurePreserved() {
      const failure = new Error('adapter failure');

      await expect(
        axios.request({
          url: 'http://localhost/test',
          adapter: () => Promise.reject(failure),
        })
      ).rejects.toBe(failure);
    }

    it('appends a caller stack of fewer than three frames', async () => {
      const original = Error.stackTraceLimit;
      Error.stackTraceLimit = 2;

      try {
        await namedCaller();
        throw new Error('request should have rejected');
      } catch (error) {
        expect(error.stack).toContain('namedCaller');
      } finally {
        Error.stackTraceLimit = original;
      }
    });

    it('does not append a caller stack the error already ends with', async () => {
      const failure = new Error('adapter failure');
      failure.stack = 'Error: adapter failure';
      const before = failure.stack;

      await expect(
        axios.request({ url: 'http://localhost/test', adapter: () => Promise.reject(failure) })
      ).rejects.toBe(failure);

      expect(failure.stack.startsWith(before)).toBe(true);
    });

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
});
