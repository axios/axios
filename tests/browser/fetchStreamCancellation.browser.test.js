import { describe, expect, it, vi } from 'vitest';
import axios from '../../index.js';

describe('fetch response stream cancellation', () => {
  it('allows cancellation after the source finishes with queued data', async () => {
    const source = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.close();
      },
    });
    const { data } = await axios.get('https://example.com/stream', {
      adapter: 'fetch',
      responseType: 'stream',
      onDownloadProgress() {},
      env: { fetch: async () => new Response(source) },
    });
    const reader = data.getReader();

    try {
      await vi.waitFor(() => expect(source.locked).toBe(false));
      await expect(reader.cancel('stop')).resolves.toBeUndefined();
      expect(await reader.read()).toEqual({ done: true, value: undefined });
    } finally {
      reader.releaseLock();
    }
  });

  it.each([
    ['untracked', {}],
    ['download progress', { onDownloadProgress() {} }],
    ['response size limit', { maxContentLength: 1024 }],
    ['abort signal', { signal: new AbortController().signal }],
  ])('cancels a pending read with %s', async (_, options) => {
    let controller;
    let reading;
    const started = new Promise((resolve) => {
      reading = resolve;
    });
    const cancel = vi.fn();
    const source = new ReadableStream(
      {
        start(value) {
          controller = value;
        },
        pull: reading,
        cancel,
      },
      { highWaterMark: 0 }
    );
    const { data } = await axios.get('https://example.com/stream', {
      adapter: 'fetch',
      responseType: 'stream',
      ...options,
      env: { fetch: async () => new Response(source) },
    });
    const reader = data.getReader();
    const pendingRead = reader.read();
    await started;
    const reason = new Error('no more data needed');
    const cancellation = reader.cancel(reason);

    try {
      await vi.waitFor(() => {
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(cancel.mock.calls[0][0]).toBe(reason);
      });
      await cancellation;
      expect(await pendingRead).toEqual({ done: true, value: undefined });
    } finally {
      if (!cancel.mock.calls.length) {
        controller.close();
      }
      await cancellation?.catch(() => {});
      reader.releaseLock();
    }
  });
});
