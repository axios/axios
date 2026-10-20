import { describe, it, expect, vi } from 'vitest';
import { readBytes } from '../../../lib/helpers/trackStream.js';

describe('helpers::readBytes reader fallback', () => {
  function withoutAsyncIterator(source) {
    source[Symbol.asyncIterator] = undefined;
    return source;
  }

  it('releases the reader after consuming the source', async () => {
    const source = withoutAsyncIterator(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      })
    );
    const chunks = [];
    for await (const chunk of readBytes(source, 2)) {
      chunks.push([...chunk]);
    }
    expect(chunks).toEqual([[1, 2], [3]]);
    expect(source.locked).toBe(false);
  });

  for (const rejectCancel of [false, true]) {
    it(`releases the reader after early return (cancel rejects: ${rejectCancel})`, async () => {
      const error = new Error('cancel failed');
      const cancel = vi.fn(() => {
        if (rejectCancel) {
          throw error;
        }
      });
      const source = withoutAsyncIterator(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array([1, 2, 3]));
          },
          cancel,
        })
      );
      const iterator = readBytes(source, 2);
      expect(await iterator.next()).toEqual({ done: false, value: new Uint8Array([1, 2]) });
      expect(source.locked).toBe(true);
      if (rejectCancel) {
        await expect(iterator.return()).rejects.toBe(error);
      } else {
        await iterator.return();
      }
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(source.locked).toBe(false);
    });
  }

  it('releases the reader when reading fails', async () => {
    const error = new Error('read failed');
    const source = withoutAsyncIterator(
      new ReadableStream({
        start(controller) {
          controller.error(error);
        },
      })
    );
    await expect(readBytes(source, 2).next()).rejects.toBe(error);
    expect(source.locked).toBe(false);
  });
});
