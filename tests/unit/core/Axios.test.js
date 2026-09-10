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

  describe('caller stack reconstruction (gh-11131)', () => {
    async function requestWithShallowStack(stackTraceLimit) {
      const originalStackTraceLimit = Error.stackTraceLimit;
      Error.stackTraceLimit = stackTraceLimit;

      async function namedCaller() {
        return axios.request({
          url: 'http://localhost/test',
          // Rejects from a distinct (async) context: the adapter's own stack
          // has nothing to do with request()'s reconstructed caller stack.
          adapter: () => Promise.reject(new Error('adapter failure')),
        });
      }

      try {
        await namedCaller();
        throw new Error('expected axios.request to reject');
      } catch (e) {
        return e;
      } finally {
        Error.stackTraceLimit = originalStackTraceLimit;
      }
    }

    // Regression: when the reconstructed caller stack has fewer than 3
    // lines, it used to be silently dropped instead of appended, because
    // the empty-string fallback made the duplicate check trivially true
    // (every string ends with ''). "Axios.request" only appears in the
    // freshly-reconstructed portion (captured inside request()'s own catch
    // block) -- the adapter error's original stack never contains it -- so
    // its presence proves the reconstructed stack was actually appended.
    it('appends the caller stack when the reconstructed stack has only 2 frames', async () => {
      const err = await requestWithShallowStack(2);
      expect(err.stack).toContain('Axios.request');
    });

    it('appends the caller stack when the reconstructed stack has only 1 frame', async () => {
      const err = await requestWithShallowStack(1);
      expect(err.stack).toContain('Axios.request');
    });
  });
});
