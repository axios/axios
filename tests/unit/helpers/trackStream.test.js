import { describe, it, expect, vi } from 'vitest';
import { Readable } from 'node:stream';
import { trackStream } from '../../../lib/helpers/trackStream.js';

describe('helpers::trackStream', () => {
  it('allows cancellation after the source finishes with queued data', async () => {
    const cancel = vi.fn();
    const source = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.close();
      },
      cancel,
    });
    const onProgress = vi.fn();
    const onFinish = vi.fn();
    const reader = trackStream(source, 2, onProgress, onFinish).getReader();

    try {
      await vi.waitFor(() => expect(onFinish).toHaveBeenCalledExactlyOnceWith(undefined));
      expect(onProgress).toHaveBeenCalledExactlyOnceWith(2);
      expect(source.locked).toBe(false);
      await expect(reader.cancel('stop')).resolves.toBeUndefined();
      expect(await reader.read()).toEqual({ done: true, value: undefined });
      expect(cancel).not.toHaveBeenCalled();
      expect(onFinish).toHaveBeenCalledExactlyOnceWith(undefined);
    } finally {
      reader.releaseLock();
    }
  });

  for (const useAsyncIterator of [true, false]) {
    for (const phase of ['before pulling', 'during a pending read', 'between split chunks']) {
      it(`cancels the source ${phase} (async iterator: ${useAsyncIterator})`, async () => {
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
              if (phase === 'between split chunks') {
                controller.enqueue(new Uint8Array([1, 2, 3, 4]));
              }
            },
            pull: reading,
            cancel,
          },
          { highWaterMark: 0 }
        );
        if (!useAsyncIterator) {
          source[Symbol.asyncIterator] = undefined;
        }
        const onProgress = vi.fn();
        const onFinish = vi.fn();
        const reader = trackStream(source, 2, onProgress, onFinish).getReader();
        const reason = new Error('consumer stopped reading');
        let pendingRead;
        let cancellation;

        try {
          if (phase === 'during a pending read') {
            pendingRead = reader.read();
            await started;
          } else if (phase === 'between split chunks') {
            expect(await reader.read()).toEqual({ done: false, value: new Uint8Array([1, 2]) });
          }

          const progressCount = onProgress.mock.calls.length;
          cancellation = reader.cancel(reason);
          await vi.waitFor(() => expect(cancel).toHaveBeenCalledExactlyOnceWith(reason));
          await cancellation;
          if (pendingRead) {
            expect(await pendingRead).toEqual({ done: true, value: undefined });
          }
          expect(source.locked).toBe(false);
          expect(onProgress).toHaveBeenCalledTimes(progressCount);
          expect(onFinish).toHaveBeenCalledExactlyOnceWith(reason);
        } finally {
          // Also let the unpatched implementation finish after a failed assertion.
          if (!cancel.mock.calls.length) {
            controller.close();
          }
          await cancellation?.catch(() => {});
          reader.releaseLock();
        }
      });
    }
  }

  it.each(['resolve', 'reject'])(
    'follows a pending source cancellation that will %s',
    async (outcome) => {
      let controller;
      let reading;
      let completeCancel;
      const started = new Promise((resolve) => {
        reading = resolve;
      });
      const error = new Error('source cancellation failed');
      const cancelResult = new Promise((resolve, reject) => {
        completeCancel = () => (outcome === 'resolve' ? resolve() : reject(error));
      });
      // A failing regression may never reach the source's cancel hook.
      cancelResult.catch(() => {});
      const cancel = vi.fn(() => cancelResult);
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
      const onFinish = vi.fn();
      const reader = trackStream(source, 2, undefined, onFinish).getReader();
      const pendingRead = reader.read();
      await started;
      let settled = false;
      const cancellation = reader.cancel('stop').then(
        () => {
          settled = true;
        },
        (reason) => {
          settled = true;
          return reason;
        }
      );

      try {
        await vi.waitFor(() => expect(cancel).toHaveBeenCalledExactlyOnceWith('stop'));
        expect(await pendingRead).toEqual({ done: true, value: undefined });
        expect(source.locked).toBe(false);
        expect(settled).toBe(false);
        expect(onFinish).toHaveBeenCalledExactlyOnceWith('stop');
        completeCancel();
        expect(await cancellation).toBe(outcome === 'resolve' ? undefined : error);
        expect(onFinish).toHaveBeenCalledTimes(1);
      } finally {
        completeCancel();
        if (!cancel.mock.calls.length) {
          controller.close();
        }
        await cancellation;
        reader.releaseLock();
      }
    }
  );

  it('releases the source reader and preserves a source error', async () => {
    const error = new Error('source failed');
    const source = new ReadableStream({
      pull(controller) {
        controller.error(error);
      },
    });
    const onFinish = vi.fn();
    const reader = trackStream(source, 2, undefined, onFinish).getReader();
    try {
      await expect(reader.read()).rejects.toBe(error);
      expect(source.locked).toBe(false);
      expect(onFinish).toHaveBeenCalledExactlyOnceWith(error);
    } finally {
      reader.releaseLock();
    }
  });

  it.each(['async iterable', 'Node readable', 'async iterable with getReader'])(
    'still closes a %s when the consumer cancels',
    async (kind) => {
      const close = vi.fn();
      async function* source() {
        try {
          yield new Uint8Array([1, 2, 3, 4]);
        } finally {
          close();
        }
      }
      const onFinish = vi.fn();
      const stream = kind === 'Node readable' ? Readable.from(source()) : source();
      const getReader = vi.fn(() => {
        throw new Error('getReader must not be used for this async iterable');
      });
      if (kind === 'async iterable with getReader') {
        stream.getReader = getReader;
      }
      const reader = trackStream(stream, 2, undefined, onFinish).getReader();
      try {
        expect(await reader.read()).toEqual({ done: false, value: new Uint8Array([1, 2]) });
        await reader.cancel('stop');
        expect(close).toHaveBeenCalledTimes(1);
        expect(onFinish).toHaveBeenCalledExactlyOnceWith('stop');
        expect(getReader).not.toHaveBeenCalled();
      } finally {
        reader.releaseLock();
      }
    }
  );

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
    expect(source.locked).toBe(false);
  });
});
