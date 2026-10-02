import { describe, it, expect, vi } from 'vitest';
import axios from '../../../index.js';

describe('fetch response stream cancellation', () => {
  for (const trackProgress of [false, true]) {
    it(`cancels a pending response read (progress: ${trackProgress})`, async () => {
      let controller;
      let started;
      const pulled = new Promise((resolve) => {
        started = resolve;
      });
      const cancel = vi.fn();
      const source = new ReadableStream(
        {
          start(value) {
            controller = value;
          },
          pull: started,
          cancel,
        },
        { highWaterMark: 0 }
      );
      const response = await axios.get('https://example.com/stream', {
        adapter: 'fetch',
        responseType: 'stream',
        onDownloadProgress: trackProgress ? vi.fn() : undefined,
        env: { fetch: async () => new Response(source) },
      });
      const reader = response.data.getReader();
      const read = reader.read();
      await pulled;
      const cancellation = reader.cancel('finished');

      try {
        expect(cancel).toHaveBeenCalledExactlyOnceWith('finished');
        await cancellation;
        await expect(read).resolves.toEqual({ done: true, value: undefined });
        if (trackProgress) expect(source.locked).toBe(false);
      } finally {
        if (!cancel.mock.calls.length) controller.close();
        await cancellation;
        reader.releaseLock();
      }
    });
  }
});
