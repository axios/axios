import { describe, it, expect } from 'vitest';
import axios from '../../../index.js';
import assert from 'assert';

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
  describe('caller stack reconstruction', () => {
    it('appends the caller stack when the reconstructed stack has fewer than three frames', async () => {
      const original = Error.stackTraceLimit;
      Error.stackTraceLimit = 2;

      try {
        async function requestFromNamedCaller() {
          await axios.request({
            url: 'http://localhost/test',
            adapter: () =>
              new Promise((resolve, reject) => {
                setTimeout(() => reject(new Error('adapter failure')), 0);
              }),
          });
        }

        await expect(requestFromNamedCaller()).rejects.toSatisfy((err) =>
          String(err.stack).includes('requestFromNamedCaller')
        );
      } finally {
        Error.stackTraceLimit = original;
      }
    });

    it('does not append a caller stack that is already present', async () => {
      const original = Error.stackTraceLimit;
      Error.stackTraceLimit = 2;

      try {
        async function repeatedCaller() {
          await axios.request({
            url: 'http://localhost/test',
            adapter: () =>
              new Promise((resolve, reject) => {
                setTimeout(() => reject(new Error('adapter failure')), 0);
              }),
          });
        }

        let stack;
        try {
          await repeatedCaller();
        } catch (err) {
          stack = String(err.stack);
        }

        const frames = stack.split('\n').filter((line) => line.includes('at '));

        // The appended stack must not be duplicated onto itself.
        assert.strictEqual(new Set(frames).size, frames.length);
      } finally {
        Error.stackTraceLimit = original;
      }
    });
  });
});
