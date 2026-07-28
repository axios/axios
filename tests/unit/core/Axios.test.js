import { describe, it, expect } from 'vitest';
import axios from '../../../index.js';

describe('core::Axios', () => {
  describe('request error stack decoration', () => {
    it('preserves the original error when Error.prepareStackTrace returns a non-string stack', async () => {
      const original = Error.prepareStackTrace;
      // Simulates instrumentation that overrides the V8 hook to return
      // structured call-site data instead of a formatted string.
      Error.prepareStackTrace = () => ({});
      try {
        const failure = new Error('adapter failure');
        await expect(
          axios.request({
            url: 'http://localhost/test',
            adapter: () => Promise.reject(failure)
          })
        ).rejects.toBe(failure);
      } finally {
        Error.prepareStackTrace = original;
      }
    });
  });
});
