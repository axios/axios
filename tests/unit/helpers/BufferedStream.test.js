import {describe, it, expect} from 'vitest'
import BufferedStream from "../../../lib/helpers/BufferedStream.js";
import {setTimeoutAsync} from "../../setup/helpers.js";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

describe('BufferedStream', () => {

  it('converts all chunks into binary buffers', async () => {
    const source = async function* () {
      yield 'chunk1';
      yield 'chunk2';
    };

    const stream = new BufferedStream(source(), {timeout: 100, limit: 100});

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(stream.isFlushed).toBe(false);

    expect(chunks).toEqual([
      textEncoder.encode('chunk1'),
      textEncoder.encode('chunk2')
    ]);
  });

  it('keeps reading after buffer is flushed', async () => {
    const source = async function* () {
      yield 'chunk1';
      await new Promise(resolve => setTimeout(resolve, 200));
      yield 'chunk2';
    };

    const stream = new BufferedStream(source(), {timeout: 100, limit: 100});

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(stream.isFlushed).toBe(true);

    expect(chunks).toEqual([
      textEncoder.encode('chunk1'),
      textEncoder.encode('chunk2')
    ]);
  });

  it('can be read again until the buffer is flushed', async () => {
    const source = async function* () {
      yield 'chunk1';
      yield 'chunk2';
    };

    const stream = new BufferedStream(source(), {timeout: 100, limit: 100});

    const chunks1 = [];
    for await (const chunk of stream) {
      chunks1.push(chunk);
    }

    const chunks2 = [];
    for await (const chunk of stream) {
      chunks2.push(chunk);
    }

    expect(chunks1).toEqual([
      textEncoder.encode('chunk1'),
      textEncoder.encode('chunk2')
    ]);

    expect(chunks2).toEqual([
      textEncoder.encode('chunk1'),
      textEncoder.encode('chunk2')
    ]);
  });

  it('throws error in case of rereading attempt after buffer is flushed', async () => {
    const source = async function* () {
      yield 'chunk1';
      yield 'chunk2';
    };

    const stream = new BufferedStream(source(), {timeout: 100, limit: 100});

    for await (const chunk of stream) {
      // just read to trigger buffering
    }

    stream.flush();

    let error;
    try {
      for await (const chunk of stream) {
        // just read to trigger error
      }
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('stream is flushed');
  });

  it('flushes on demand', async () => {
    const source = async function* () {
      yield 'chunk1';
      yield 'chunk2';
    };

    const stream = new BufferedStream(source(), {timeout: 100, limit: 100});

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
      if (chunks.length === 1) {
        stream.flush();
      }
    }

    expect(stream.isFlushed).toBe(true);

    expect(chunks).toEqual([
      textEncoder.encode('chunk1'),
      textEncoder.encode('chunk2')
    ]);
  });

  it('flushes automatically after time window', async () => {
    const source = async function* () {
      yield 'chunk1';
      await new Promise(resolve => setTimeout(resolve, 200));
      yield 'chunk2';
    };

    const stream = new BufferedStream(source(), {timeout: 100, limit: 100});

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(stream.isFlushed).toBe(true);

    expect(chunks).toEqual([
      textEncoder.encode('chunk1'),
      textEncoder.encode('chunk2')
    ]);
  });

  it('should pause reading if bytes buffered exceeds limit', async () => {
    const source = async function* () {
      yield 'chunk1';
      yield 'chunk2';
    };

    const ts = Date.now();

    const stream = new BufferedStream(source(), {timeout: 100, limit: 5});

    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(Date.now() - ts).toBeGreaterThanOrEqual(100);

    expect(stream.isFlushed).toBe(true);

    expect(chunks).toEqual([
      textEncoder.encode('chunk1'),
      textEncoder.encode('chunk2')
    ]);
  });

  it('should support abort signal', async () => {
    const source = async function* () {
      yield 'chunk1';
      await new Promise(resolve => setTimeout(resolve, 300));
      yield 'chunk2';
    };

    const controller = new AbortController();

    const stream = new BufferedStream(source(), {
      timeout: 100,
      limit: 100,
      signal: controller.signal
    });

    const chunks = [];
    let error;
    try {
      for await (const chunk of stream) {
        chunks.push(chunk);
        if (chunks.length === 1) {
          controller.abort(new Error('Aborted'));
        }
      }

      expect.fail('Expected error to be thrown');
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Aborted');

    expect(chunks).toEqual([
      textEncoder.encode('chunk1')
    ]);
  });

  it('should handle errors from source stream', async () => {
    const source = async function* () {
      yield 'chunk1';
      throw new Error('Source error');
    };

    const stream = new BufferedStream(source(), {timeout: 100, limit: 100});

    const chunks = [];
    let error;
    try {
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect.fail('Expected error to be thrown');
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Source error');

    expect(chunks).toEqual([
      textEncoder.encode('chunk1')
    ]);
  });

  it('should get the same error on rereading failed stream', async () => {
    const source = async function* () {
      yield 'chunk1';
      throw new Error('Source error');
    };

    const stream = new BufferedStream(source(), {timeout: 100, limit: 100});

    let error1, error2;
    try {
      for await (const chunk of stream) {
        // just read to trigger error
      }
    } catch (err) {
      error1 = err;
    }

    try {
      for await (const chunk of stream) {
        // just read to trigger error
      }
    } catch (err) {
      error2 = err;
    }

    expect(error1).toBeInstanceOf(Error);
    expect(error1.message).toBe('Source error');

    expect(error2).toBeInstanceOf(Error);
    expect(error2.message).toBe('Source error');

    expect(error2).toBe(error1); // should be the same error instance
  });


  it('should abort the first reading when a second concurrent read occurs', async () => {
    const source = async function* () {
      await setTimeoutAsync(200);
      yield 'chunk1';
      await setTimeoutAsync(200);
      yield 'chunk2';
    };

    const stream = new BufferedStream(source(), {timeout: 1000, limit: 100});

    const readChunks = async () => {
      const chunks = [];
      let error;
      try {
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
      } catch (err) {
        error = err;
      }

      return [error, chunks];
    }

    const p1 = readChunks();

    await setTimeoutAsync(100); // wait a bit to ensure the first read is in progress

    const p2 = readChunks();

    const [res1, res2] = await Promise.all([p1, p2]);

    expect(res1[0]).toBeInstanceOf(Error);
    expect(res1[0].message).toMatch(/canceled/i);

    expect(res1[1]).toEqual([
      textEncoder.encode('chunk1')
    ]);

    expect(res2[0]).toBeUndefined();

    expect(res2[1]).toEqual([
      textEncoder.encode('chunk1'),
      textEncoder.encode('chunk2')
    ]);
  });

  it('should not start flush timeout counting until the threshold of bytes read is reached.', async() => {
    const source = async function* () {
      yield 'chunk1';
      await setTimeoutAsync(200);
      yield 'chunk2';
    };

    const stream = new BufferedStream(source(), {timeout: 100, limit: 5});

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(stream.isFlushed).toBe(true);

    expect(chunks).toEqual([
      textEncoder.encode('chunk1'),
      textEncoder.encode('chunk2')
    ]);
  });

  it('should pause reading if bytes buffered exceeds limit with concurrency', async () => {
    const flushTimeout = 100;

    const source = async function* () {
      yield 'chunk1';
      yield 'chunk2';
      yield 'chunk3';
    };

    const ts = Date.now();

    const stream = new BufferedStream(source(), {
      timeout: flushTimeout,
      limit: 5
    });

    const readStream = async () => {
      const chunks = [];
      let err;

      try {
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
      } catch (_err) {
        err = _err;
      }

      return {err, chunks}
    }

    const results = await Promise.all([
      readStream(),
      setTimeoutAsync(100).then(() => readStream())
    ]);

    expect(Date.now() - ts).toBeGreaterThanOrEqual(flushTimeout);

    expect(stream.isFlushed).toBe(true);

    expect(results[0]).toMatchObject({
      chunks: [
        textEncoder.encode('chunk1'),
      ], err: {
        message: expect.stringMatching(/canceled/i)
      }
    });

    expect(results[1]).toEqual({
      chunks: [
        textEncoder.encode('chunk1'),
        textEncoder.encode('chunk2'),
        textEncoder.encode('chunk3')
      ], err: undefined
    });
  });

  it('should use chunk fragmentation to read data until threshold is reached', async () => {
    const source = async function* () {
      yield 'chunk1';
      yield 'chunk2';
    };

    const stream = new BufferedStream(source(), {
      timeout: 100,
      limit: 100,
      threshold: 3
    });

    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(textDecoder.decode(chunk));
    }

    expect(stream.isFlushed).toBe(false);

    expect(chunks).toEqual([
      'chu',
      'nk1',
      'chunk2'
    ]);
  });
});
