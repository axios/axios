import { describe, it, expect } from 'vitest';
import zlib from 'zlib';
import ZlibHeaderTransformStream from '../../../lib/helpers/ZlibHeaderTransformStream.js';

const collect = (stream, chunks) => new Promise((resolve, reject) => {
  const out = [];
  stream.on('data', (chunk) => out.push(chunk));
  stream.on('end', () => resolve(Buffer.concat(out)));
  stream.on('error', reject);
  for (const chunk of chunks) {
    stream.write(chunk);
  }
  stream.end();
});

const ZLIB_HEADER = Buffer.from([0x78, 0x9c]);

// the adapter decodes with finishFlush: Z_SYNC_FLUSH, which tolerates the
// missing adler trailer on streams the helper prepends a header to
const unzip = (buf) => new Promise((resolve, reject) => {
  const u = zlib.createUnzip({ flush: zlib.constants.Z_SYNC_FLUSH, finishFlush: zlib.constants.Z_SYNC_FLUSH });
  const out = [];
  u.on('data', (c) => out.push(c));
  u.on('end', () => resolve(Buffer.concat(out)));
  u.on('error', reject);
  u.end(buf);
});

// raw deflate body whose first two bytes (0x08 0x1d) satisfy the RFC 1950
// header constraints: stored block, LEN=29 'A' bytes, then a final empty
// stored block
const rawDeflateBody = Buffer.concat([
  Buffer.from([0x08, 0x1d, 0x00, 0xe2, 0xff]),
  Buffer.alloc(29, 0x41),
  Buffer.from([0x01, 0x00, 0x00, 0xff, 0xff])
]);

describe('ZlibHeaderTransformStream', () => {
  it('passes a zlib stream through unchanged', async () => {
    const body = zlib.deflateSync('hello world', { windowBits: 9 });
    const out = await collect(new ZlibHeaderTransformStream(), [body]);
    expect(out).toEqual(body);
    expect((await unzip(out)).toString()).toBe('hello world');
  });

  it('prepends a zlib header to a raw deflate stream', async () => {
    const out = await collect(new ZlibHeaderTransformStream(), [rawDeflateBody]);
    expect(out.subarray(0, 2)).toEqual(ZLIB_HEADER);
    expect((await unzip(out)).toString()).toBe('A'.repeat(29));
  });

  it('detects a zlib stream whose header arrives split after one byte', async () => {
    const body = zlib.deflateSync('hello world', { windowBits: 9 });
    const out = await collect(new ZlibHeaderTransformStream(), [
      body.subarray(0, 1),
      body.subarray(1)
    ]);
    expect(out).toEqual(body);
    expect((await unzip(out)).toString()).toBe('hello world');
  });

  it('detects raw deflate when a zlib-shaped prefix arrives as its own chunk', async () => {
    const out = await collect(new ZlibHeaderTransformStream(), [
      rawDeflateBody.subarray(0, 2),
      rawDeflateBody.subarray(2)
    ]);
    expect(out.subarray(0, 2)).toEqual(ZLIB_HEADER);
    expect((await unzip(out)).toString()).toBe('A'.repeat(29));
  });

  it('detects raw deflate under every first-chunk layout', async () => {
    // the first chunk must not commit the format before enough payload is
    // available to probe it
    for (const n of [2, 3, 4, 5, 10, 20, 34]) {
      const out = await collect(new ZlibHeaderTransformStream(), [
        rawDeflateBody.subarray(0, n),
        rawDeflateBody.subarray(n)
      ]);
      expect(out.subarray(0, 2)).toEqual(ZLIB_HEADER);
      expect((await unzip(out)).toString()).toBe('A'.repeat(29));
    }
  });

  it('ignores empty chunks between header bytes', async () => {
    const body = zlib.deflateSync('hello world', { windowBits: 9 });
    const out = await collect(new ZlibHeaderTransformStream(), [
      body.subarray(0, 1),
      Buffer.alloc(0),
      body.subarray(1, 2),
      Buffer.alloc(0),
      body.subarray(2)
    ]);
    expect(out).toEqual(body);
    expect((await unzip(out)).toString()).toBe('hello world');
  });

  it('prepends a zlib header to a lone raw byte at end of stream', async () => {
    const out = await collect(new ZlibHeaderTransformStream(), [Buffer.from([0x03])]);
    expect(out).toEqual(Buffer.concat([ZLIB_HEADER, Buffer.from([0x03])]));
  });
});
