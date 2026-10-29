import { describe, it, expect } from 'vitest';
import { trackStream } from '../../../lib/helpers/trackStream.js';

const makeStream = (chunks) =>
  new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk));
      controller.close();
    },
  });

const drain = async (stream) => {
  const parts = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
  }
  return Buffer.concat(parts);
};

describe('helpers::trackStream', () => {
  it('should encode string chunks as UTF-8 and count their bytes', async () => {
    const progress = [];
    const tracked = trackStream(makeStream(['hé', 'llo🙂']), 64 * 1024, (loaded) =>
      progress.push(loaded)
    );

    const body = await drain(tracked);

    expect(body.toString('utf8')).toBe('héllo🙂');
    expect(progress).toEqual([3, 10]);
  });

  it('should pass byte chunks through unchanged', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const body = await drain(trackStream(makeStream([bytes]), 64 * 1024));

    expect([...body]).toEqual([1, 2, 3, 4]);
  });
});
