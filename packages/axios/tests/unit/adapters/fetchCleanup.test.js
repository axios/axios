import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import axios from '../../../index.js';
import AxiosError from '../../../lib/core/AxiosError.js';

describe('Fetch declared response-length cleanup', () => {
  for (const behavior of ['throws', 'rejects', 'never settles']) {
    it(`preserves prompt size rejection when body cancellation ${behavior}`, async () => {
      const response = new Response('oversized', { headers: { 'Content-Length': '1024' } });
      const cleanupError = new Error('cleanup failed');
      const body = response.body;
      const cancel = body.cancel;
      const cancellations = [];
      // A spy records rejected promises by attaching its own rejection handler,
      // which would hide the unhandled cleanup rejection we need to detect.
      body.cancel = (reason) => {
        cancellations.push(reason);
        if (behavior === 'throws') throw cleanupError;
        if (behavior === 'rejects') return Promise.reject(cleanupError);
        return new Promise(() => {});
      };
      const unhandled = [];
      const onUnhandled = (error) => unhandled.push(error);
      process.on('unhandledRejection', onUnhandled);
      let deadline;
      let dispatchedRequest;

      try {
        const request = axios.get('http://service.invalid/oversized', {
          adapter: 'fetch',
          maxContentLength: 1,
          env: {
            async fetch(request) {
              dispatchedRequest = request;
              return response;
            },
          },
        });
        const stalled = new Promise((resolve, reject) => {
          deadline = setTimeout(() => reject(new Error('size rejection waited for cleanup')), 1000);
        });
        await assert.rejects(Promise.race([request, stalled]), (error) => {
          assert.ok(error instanceof AxiosError);
          assert.equal(error.code, AxiosError.ERR_BAD_RESPONSE);
          assert.equal(error.message, 'maxContentLength size of 1 exceeded');
          assert.equal(error.config.maxContentLength, 1);
          assert.equal(error.request, dispatchedRequest);
          assert.equal(cancellations.length, 1);
          assert.equal(cancellations[0], error, 'preserve the original size error');
          return true;
        });
        // Let Node report any unhandled cleanup rejection before checking and
        // removing the listener. Vitest's own rejection tracking remains active.
        await setImmediate();
        await setImmediate();
        assert.deepEqual(unhandled, []);
      } finally {
        clearTimeout(deadline);
        process.off('unhandledRejection', onUnhandled);
        delete body.cancel;
        await cancel.call(body);
      }
    });
  }
});
