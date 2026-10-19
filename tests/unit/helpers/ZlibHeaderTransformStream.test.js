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
