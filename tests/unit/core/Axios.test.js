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

    it('keeps reconstructed caller frames ahead of the inlined cause stack', async () => {
      const cause = new Error('socket hang up');

      cause.stack = 'Error: socket hang up\n    at Socket.socketOnEnd (node:_http_client)';

      const failure = AxiosError.from(cause, 'ECONNRESET');
      const causeSection = '\nCaused by: ' + cause.stack;

      const error = await axios
        .request({
          url: 'http://localhost/test',
          adapter: () => Promise.reject(failure)
        })
        .catch((reason) => reason);

      const stack = String(error.stack);
      const causeIndex = stack.indexOf('\nCaused by: ');

      expect(causeIndex).not.toBe(-1);
      // Everything after the marker has to stay the wrapped error's own stack,
      // so the frames rebuilt by `request()` belong ahead of it.
      expect(stack.slice(causeIndex)).toBe(causeSection);
    });
  });
});
