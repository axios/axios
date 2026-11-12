import { describe, it, expect, vi } from 'vitest';
import { trackStream } from '../../../lib/helpers/trackStream.js';

describe('helpers::trackStream', () => {
  for (const useAsyncIterator of [true, false]) {
    for (const rejectCancel of [true, false]) {
      it(`closes the source after progress fails (async iterator: ${useAsyncIterator}, cancel rejects: ${rejectCancel})`, async () => {
        const error = new Error('progress failed');
        const cancel = vi.fn(() => {
          if (rejectCancel) {
            throw new Error('cancel failed');
          }
        });
        const source = new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array([1, 2, 3, 4]));
          },
          cancel,
        });
        if (!useAsyncIterator) {
          source[Symbol.asyncIterator] = undefined;
        }
        const onFinish = vi.fn();
        const reader = trackStream(
          source,
          2,
          () => {
            throw error;
          },
          onFinish
        ).getReader();

        try {
          await expect(reader.read()).rejects.toBe(error);
          await vi.waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
          expect(onFinish).toHaveBeenCalledExactlyOnceWith(error);
          await expect(reader.read()).rejects.toBe(error);
        } finally {
          reader.releaseLock();
        }
      });
    }
  }

  it('rejects promptly even if source cancellation never settles', async () => {
    const error = new Error('progress failed');
    const cancel = vi.fn(() => new Promise(() => {}));
    const source = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1]));
      },
      cancel,
    });
    const reader = trackStream(source, 2, () => {
      throw error;
    }).getReader();
    try {
      await expect(reader.read()).rejects.toBe(error);
      await vi.waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
    } finally {
      reader.releaseLock();
    }
  });

  it('preserves chunks and progress on normal completion', async () => {
    const source = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.enqueue(new Uint8Array([4]));
        controller.close();
      },
    });
    const onProgress = vi.fn();
    const onFinish = vi.fn();
    const chunks = [];
    for await (const chunk of trackStream(source, 2, onProgress, onFinish)) {
      chunks.push([...chunk]);
    }
    expect(chunks).toEqual([[1, 2], [3], [4]]);
    expect(onProgress.mock.calls).toEqual([[2], [3], [4]]);
    expect(onFinish).toHaveBeenCalledExactlyOnceWith(undefined);
  });
});
