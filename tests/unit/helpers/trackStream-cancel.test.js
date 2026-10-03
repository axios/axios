import { describe, it, expect, vi } from 'vitest';
import { Readable } from 'stream';
import { trackStream } from '../../../lib/helpers/trackStream.js';

function stalledStream(useAsyncIterator, cancel) {
  let controller;
  let started;
  const pulled = new Promise((resolve) => {
    started = resolve;
  });
  const stream = new ReadableStream(
    {
      start(value) {
        controller = value;
      },
      pull: started,
      cancel,
    },
    { highWaterMark: 0 }
  );
  if (!useAsyncIterator) {
    stream[Symbol.asyncIterator] = undefined;
  }
  const getReader = stream.getReader.bind(stream);
  const release = vi.fn();
  stream.getReader = () => {
    const reader = getReader();
    const releaseLock = reader.releaseLock.bind(reader);
    reader.releaseLock = () => {
      release();
      releaseLock();
    };
    return reader;
  };
  return { stream, controller, pulled, release };
}

describe('trackStream cancellation', () => {
  for (const useAsyncIterator of [true, false]) {
    it(`cancels a pending read (async iterator: ${useAsyncIterator})`, async () => {
      const cancel = vi.fn();
      const source = stalledStream(useAsyncIterator, cancel);
      const onFinish = vi.fn();
      const reader = trackStream(source.stream, 2, undefined, onFinish).getReader();
      const pendingRead = reader.read();
      await source.pulled;

      const reason = new Error('stop reading');
      const cancellation = reader.cancel(reason);
      try {
        expect(cancel).toHaveBeenCalledExactlyOnceWith(reason);
        await cancellation;
        await expect(pendingRead).resolves.toEqual({ done: true, value: undefined });
        await reader.cancel('second cancellation');
        expect(onFinish).toHaveBeenCalledExactlyOnceWith(reason);
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(source.release).toHaveBeenCalledTimes(1);
        expect(source.stream.locked).toBe(false);
      } finally {
        if (!cancel.mock.calls.length) source.controller.close();
        await cancellation;
        reader.releaseLock();
      }
    });

    it(`cancels before the first pull (async iterator: ${useAsyncIterator})`, async () => {
      const cancel = vi.fn();
      const source = stalledStream(useAsyncIterator, cancel);
      const onFinish = vi.fn();
      const tracked = trackStream(source.stream, 2, undefined, onFinish);

      await tracked.cancel('early cancellation');

      expect(cancel).toHaveBeenCalledExactlyOnceWith('early cancellation');
      expect(onFinish).toHaveBeenCalledExactlyOnceWith('early cancellation');
      expect(source.release).toHaveBeenCalledTimes(1);
      expect(source.stream.locked).toBe(false);
    });

    it(`cancels while splitting a chunk (async iterator: ${useAsyncIterator})`, async () => {
      const cancel = vi.fn();
      const source = stalledStream(useAsyncIterator, cancel);
      source.controller.enqueue(new Uint8Array(10));
      const reader = trackStream(source.stream, 2).getReader();

      await expect(reader.read()).resolves.toEqual({ done: false, value: new Uint8Array(2) });
      await reader.cancel('stop');

      expect(cancel).toHaveBeenCalledExactlyOnceWith('stop');
      expect(source.release).toHaveBeenCalledTimes(1);
      expect(source.stream.locked).toBe(false);
      reader.releaseLock();
    });

    it(`releases completed sources (async iterator: ${useAsyncIterator})`, async () => {
      const cancel = vi.fn();
      const source = stalledStream(useAsyncIterator, cancel);
      source.controller.enqueue(new Uint8Array([1, 2, 3]));
      source.controller.close();
      const onProgress = vi.fn();
      const onFinish = vi.fn();
      const chunks = [];
      for await (const chunk of trackStream(source.stream, 2, onProgress, onFinish)) {
        chunks.push([...chunk]);
      }

      expect(chunks).toEqual([[1, 2], [3]]);
      expect(onProgress.mock.calls).toEqual([[2], [3]]);
      expect(onFinish).toHaveBeenCalledExactlyOnceWith(undefined);
      expect(cancel).not.toHaveBeenCalled();
      expect(source.release).toHaveBeenCalledTimes(1);
      expect(source.stream.locked).toBe(false);
    });

    it(`preserves cancellation failures (async iterator: ${useAsyncIterator})`, async () => {
      const error = new Error('source cancellation failed');
      const cancel = vi.fn(() => {
        throw error;
      });
      const source = stalledStream(useAsyncIterator, cancel);
      const onFinish = vi.fn();
      const reader = trackStream(source.stream, 2, undefined, onFinish).getReader();
      const read = reader.read();
      await source.pulled;
      const cancellation = reader.cancel('stop');

      try {
        expect(cancel).toHaveBeenCalledExactlyOnceWith('stop');
        await expect(cancellation).rejects.toBe(error);
        await expect(read).resolves.toEqual({ done: true, value: undefined });

        expect(onFinish).toHaveBeenCalledExactlyOnceWith('stop');
        expect(source.release).toHaveBeenCalledTimes(1);
        expect(source.stream.locked).toBe(false);
      } finally {
        if (!cancel.mock.calls.length) source.controller.close();
        await cancellation.catch(() => {});
        reader.releaseLock();
      }
    });

    for (const pendingRead of [true, false]) {
      it(`releases the lock before cancellation settles (async iterator: ${useAsyncIterator}, pending read: ${pendingRead})`, async () => {
        let finishCancel;
        const cancel = vi.fn(
          () =>
            new Promise((resolve) => {
              finishCancel = resolve;
            })
        );
        const source = stalledStream(useAsyncIterator, cancel);
        const onFinish = vi.fn();
        const reader = trackStream(source.stream, 2, undefined, onFinish).getReader();
        const read = pendingRead && reader.read();
        if (pendingRead) await source.pulled;
        const settled = vi.fn();
        const cancellation = reader.cancel('stop').then(settled);

        try {
          expect(cancel).toHaveBeenCalledExactlyOnceWith('stop');
          expect(source.release).toHaveBeenCalledTimes(1);
          expect(source.stream.locked).toBe(false);
          if (pendingRead) {
            await expect(read).resolves.toEqual({ done: true, value: undefined });
          } else {
            await Promise.resolve();
          }
          expect(settled).not.toHaveBeenCalled();
          expect(onFinish).toHaveBeenCalledExactlyOnceWith('stop');
        } finally {
          if (!cancel.mock.calls.length) source.controller.close();
          finishCancel && finishCancel();
          await cancellation;
          reader.releaseLock();
        }
        expect(source.release).toHaveBeenCalledTimes(1);
        expect(source.stream.locked).toBe(false);
      });
    }

    it(`releases the reader after source errors (async iterator: ${useAsyncIterator})`, async () => {
      const cancel = vi.fn();
      const source = stalledStream(useAsyncIterator, cancel);
      const onFinish = vi.fn();
      const reader = trackStream(source.stream, 2, undefined, onFinish).getReader();
      const read = reader.read();
      await source.pulled;
      const error = new Error('source read failed');
      source.controller.error(error);

      await expect(read).rejects.toBe(error);
      expect(onFinish).toHaveBeenCalledExactlyOnceWith(error);
      expect(cancel).not.toHaveBeenCalled();
      expect(source.release).toHaveBeenCalledTimes(1);
      expect(source.stream.locked).toBe(false);
      reader.releaseLock();
    });
  }

  it('preserves Node async iterable chunks and progress', async () => {
    const source = Readable.from([Buffer.from([1, 2, 3]), Buffer.from([4])]);
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

  it('supports async iterables whose iterator is not itself iterable', async () => {
    const source = {
      [Symbol.asyncIterator]() {
        let done = false;
        return {
          async next() {
            if (done) return { done: true };
            done = true;
            return { done: false, value: new Uint8Array([1, 2, 3]) };
          },
        };
      },
    };
    const chunks = [];
    for await (const chunk of trackStream(source, 2)) {
      chunks.push([...chunk]);
    }
    expect(chunks).toEqual([[1, 2], [3]]);
  });

  it('closes Node async iterables on cancellation', async () => {
    const onReturn = vi.fn();
    const source = Readable.from(
      (async function* () {
        try {
          for (;;) yield Buffer.from([1, 2, 3]);
        } finally {
          onReturn();
        }
      })()
    );
    const onFinish = vi.fn();
    const reader = trackStream(source, 2, undefined, onFinish).getReader();
    await reader.read();
    await reader.cancel('stop');

    expect(source.destroyed).toBe(true);
    expect(onReturn).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledExactlyOnceWith('stop');
    reader.releaseLock();
  });
});
