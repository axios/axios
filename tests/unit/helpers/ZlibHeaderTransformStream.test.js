import { describe, it } from 'vitest';
import assert from 'assert';
import zlib from 'node:zlib';
import ZlibHeaderTransformStream from '../../../lib/helpers/ZlibHeaderTransformStream.js';

const transform = (body) =>
  new Promise((resolve, reject) => {
    const stream = new ZlibHeaderTransformStream();
    const chunks = [];

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.end(body);
  });

describe('helpers::ZlibHeaderTransformStream', () => {
  it('should not add a second header to zlib streams written with a small window (gh-11333)', async () => {
    // RFC 1950 allows CMF bytes 0x08 to 0x78 (CINFO 0 to 7); zlib emits
    // 0x18 to 0x68 for windowBits 9 to 14, which must not be mistaken for
    // raw deflate and given a second header.
    for (const windowBits of [9, 10, 11, 12, 13, 14, 15]) {
      const body = zlib.deflateSync('str', { windowBits });
      const transformed = await transform(body);

      assert.ok(
        transformed.equals(body),
        `windowBits ${windowBits}: zlib stream must pass through unchanged`
      );
    }
  });

  it('should prepend a default zlib header to raw deflate bodies', async () => {
    const body = zlib.deflateRawSync('str');
    const transformed = await transform(body);

    assert.strictEqual(transformed[0], 0x78);
    assert.strictEqual(transformed[1], 0x9c);
    assert.ok(transformed.subarray(2).equals(body));
  });
});

describe('raw streams whose prefix passes the zlib header checks', () => {
  // jasonsaayman's repro on gh-11339: a valid raw stored block can begin
  // with bytes that satisfy the RFC 1950 CMF/FCHECK test. The stream must
  // still be decoded as raw, for any initial chunk layout.
  const rawStored = Buffer.concat([
    Buffer.from([8, 29, 0, 226, 255]),
    Buffer.alloc(29, 120),
    Buffer.from([1, 0, 0, 255, 255])
  ]);
  const expected = Buffer.alloc(29, 120);

  const decodeThrough = (pieces) =>
    new Promise((resolve, reject) => {
      const header = new ZlibHeaderTransformStream();
      const unzip = zlib.createUnzip({
        flush: zlib.constants.Z_SYNC_FLUSH,
        finishFlush: zlib.constants.Z_SYNC_FLUSH
      });
      const chunks = [];
      unzip.on('data', (chunk) => chunks.push(chunk));
      unzip.on('error', reject);
      unzip.on('end', () => resolve(Buffer.concat(chunks)));
      header.pipe(unzip);
      for (const piece of pieces) header.write(piece);
      header.end();
    });

  const splits = (body, sizes) => {
    const pieces = [];
    let offset = 0;
    for (const size of sizes) {
      pieces.push(body.subarray(offset, offset + size));
      offset += size;
    }
    pieces.push(body.subarray(offset));
    return pieces;
  };

  for (const layout of [[], [1], [2], [5]]) {
    it(`decodes the ambiguous raw stream (first chunk ${layout[0] || 'all'} bytes)`, async () => {
      const decoded = await decodeThrough(splits(rawStored, layout));
      assert.ok(
        decoded.equals(expected),
        `layout ${layout}: expected 29 stored bytes, got ${decoded.length}`
      );
    });
  }
});

describe('chunked delivery', () => {
  it('keeps a small-window zlib stream unchanged even in 1-byte chunks', async () => {
    const body = zlib.deflateSync('streamed small window body', { windowBits: 9 });
    const header = new ZlibHeaderTransformStream();
    const chunks = [];
    const done = new Promise((resolve, reject) => {
      header.on('data', (chunk) => chunks.push(chunk));
      header.on('error', reject);
      header.on('end', resolve);
    });
    for (let i = 0; i < body.length; i++) header.write(body.subarray(i, i + 1));
    header.end();
    await done;
    assert.ok(Buffer.concat(chunks).equals(body), 'wrapped stream must pass through unchanged');
  });
});

describe('probe bounds', () => {
  it('classifies a wrapped stream whose output exceeds the probe cap without expanding it', async () => {
    // 100 KB of highly compressible data: the probe must stop at its output
    // cap and still classify the stream as wrapped, passing bytes through
    // untouched for the downstream decoder.
    const body = zlib.deflateSync(Buffer.alloc(100 * 1024, 65), { windowBits: 9 });
    const transformed = await transform(body);
    assert.ok(transformed.equals(body), 'wrapped stream must pass through unchanged');
    assert.strictEqual(zlib.inflateSync(transformed).length, 100 * 1024);
  });
});
