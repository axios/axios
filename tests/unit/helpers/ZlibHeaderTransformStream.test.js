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

const adler32 = (buf) => {
  let a = 1;
  let b = 0;
  for (const byte of buf) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
};

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

  it('keeps a zlib stream when the raw probe rejects it at any split', async () => {
    // a valid zlib CMF always reads as a non-final stored block to a raw
    // inflate, whose LEN/NLEN check then fails outright - a raw decode can
    // never finish cleanly on zlib bytes, so the probes must not settle on
    // raw merely surviving; the zlib verdict has to hold at every split
    const body = zlib.deflateSync(Buffer.alloc(65379, 0x61), { level: 0 });
    for (const n of [2, 5, 50, 166, 1024]) {
      const out = await collect(new ZlibHeaderTransformStream(), [
        body.subarray(0, n),
        body.subarray(n)
      ]);
      expect(out).toEqual(body);
      expect((await unzip(out)).equals(Buffer.alloc(65379, 0x61))).toBe(true);
    }
  });

  it('keeps the zlib decision when the stream needs a preset dictionary', async () => {
    // 0x78 0xbb satisfies FCHECK with FDICT set; the probe reports Z_NEED_DICT
    // and the bytes must still reach unzip so it can surface the same error
    const body = Buffer.concat([Buffer.from([0x78, 0xbb]), Buffer.alloc(64, 0x01)]);
    const out = await collect(new ZlibHeaderTransformStream(), [body]);
    expect(out).toEqual(body);
  });

  it('finishes when a probe ends before the input does', async () => {
    // a valid zlib stream whose bytes also decode as a short raw stream:
    // read as zlib it is a 65506-byte stored block plus a final empty one;
    // read as raw the same bytes end after a 29-byte stored block, so the
    // raw probe emits 'end' while input is still flowing and _flush must
    // count that recorded result instead of awaiting 'end' it missed
    const payload = Buffer.alloc(65506, 0x62);
    payload.set([0x01, 0x00, 0x00, 0xff, 0xff], 27);
    const tail = Buffer.alloc(4);
    tail.writeUInt32BE(adler32(payload));
    const body = Buffer.concat([
      Buffer.from([0x08, 0x1d, 0x00, 0xe2, 0xff, 0x1d, 0x00]),
      payload,
      Buffer.from([0x01, 0x00, 0x00, 0xff, 0xff]),
      tail
    ]);
    const transform = new ZlibHeaderTransformStream();
    const out = [];
    const ended = new Promise((resolve, reject) => {
      transform.on('data', (c) => out.push(c));
      transform.on('end', resolve);
      transform.on('error', reject);
    });
    transform.write(body);
    await new Promise((resolve) => setTimeout(resolve, 400));
    transform.end();
    await ended;
    expect(Buffer.concat(out)).toEqual(body);
    expect((await unzip(Buffer.concat(out))).equals(payload)).toBe(true);
  });

  it('closes cleanly when destroyed while the prefix is undecided', async () => {
    const transform = new ZlibHeaderTransformStream();
    const closed = new Promise((resolve) => transform.once('close', resolve));
    const errors = [];
    transform.on('error', (e) => errors.push(e));
    transform.write(zlib.deflateSync('hello world').subarray(0, 5));
    transform.destroy();
    await closed;
    expect(transform.destroyed).toBe(true);
    expect(errors).toEqual([]);
  });
});
