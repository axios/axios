import { describe, it, vi } from 'vitest';
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

  const decodeThrough = (pieces, createHeader = () => new ZlibHeaderTransformStream()) =>
    new Promise((resolve, reject) => {
      const header = createHeader();
      const unzip = zlib.createUnzip({
        flush: zlib.constants.Z_SYNC_FLUSH,
        finishFlush: zlib.constants.Z_SYNC_FLUSH
      });
      const chunks = [];
      unzip.on('data', (chunk) => chunks.push(chunk));
      unzip.on('error', reject);
      header.on('error', reject);
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

  it('decodes an ambiguous raw stream whose tail misses the doubling probe schedule', async () => {
    // Greptile on gh-11339: 78 01 opens a valid raw stored block that also
    // satisfies FCHECK. Delivered as 6 + 5 bytes, the first probe returns
    // 'more' and the doubled threshold of 12 is never reached, so the tail
    // must be probed when the stream ends instead of trusting the header.
    const tailMissed = Buffer.from([0x78, 0x01, 0x00, 0xfe, 0xff, 0x41, 0x01, 0x00, 0x00, 0xff, 0xff]);
    const decoded = await decodeThrough(splits(tailMissed, [6]));
    assert.ok(decoded.equals(Buffer.from('A')), `expected one stored byte, got ${decoded.length}`);
  });

  it('rejects when the header transform errors instead of hanging', async () => {
    class ExplodingHeader extends ZlibHeaderTransformStream {
      _settle() {
        this.destroy(new Error('settle failed'));
      }
    }
    await assert.rejects(
      decodeThrough([Buffer.from([0x78, 0x9c, 0x03, 0x00])], () => new ExplodingHeader()),
      /settle failed/
    );
  });
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

describe('probe scheduling', () => {
  it('probes at doubling intervals while the stream stays ambiguous', async () => {
    let probes = 0;
    class CountingHeader extends ZlibHeaderTransformStream {
      _probe(prefix) {
        probes++;
        return super._probe(prefix);
      }
    }
    // Empty deflate sync-flush blocks: inflate yields no output and no
    // error, so the stream stays unclassified until the buffer cap.
    const body = Buffer.concat([Buffer.from([0x78, 0x9c]), ...Array.from(
      { length: 60 },
      () => Buffer.from([0x00, 0x00, 0x00, 0xff, 0xff])
    )]);
    const stream = new CountingHeader();
    for (const byte of body) stream.write(Buffer.from([byte]));
    stream.end();
    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
      stream.resume();
    });
    // Byte-at-a-time delivery of 302 bytes would be 302 probes if every
    // chunk re-inflated the prefix; doubling keeps it near log2(302).
    assert.ok(probes <= 16, `expected sparse probing, got ${probes} probes`);
  });
});

describe('probe cap enforcement', () => {
  it('passes an output cap to the probe decoder', async () => {
    const inflateSpy = vi.spyOn(zlib, 'inflateSync');
    try {
      const body = zlib.deflateSync('capped probe body', { windowBits: 9 });
      const out = await transform(body);
      assert.ok(out.equals(body));
      const probeCalls = inflateSpy.mock.calls.filter(
        ([, options]) => options && options.flush === zlib.constants.Z_SYNC_FLUSH
      );
      assert.ok(probeCalls.length > 0, 'probe never ran');
      for (const [, options] of probeCalls) {
        assert.strictEqual(
          options.maxOutputLength,
          1024,
          'probe must bound decoded output so a highly compressed response cannot expand unchecked'
        );
      }
    } finally {
      inflateSpy.mockRestore();
    }
  });

  it('settles a still-ambiguous stream at the probe buffer cap, mid-stream', async () => {
    // 78 9c + a long run of empty sync-flush stored blocks: a valid wrapped
    // stream that produces no output, so only the buffer cap can settle it.
    const emptyBlock = Buffer.from([0x00, 0x00, 0x00, 0xff, 0xff]);
    const body = Buffer.concat([
      Buffer.from([0x78, 0x9c]),
      ...Array.from({ length: Math.ceil((64 * 1024 + 2048) / 5) }, () => emptyBlock)
    ]);
    let probes = 0;
    class CountingHeader extends ZlibHeaderTransformStream {
      _probe(prefix) {
        probes++;
        return super._probe(prefix);
      }
    }
    const stream = new CountingHeader();
    let earlyBytes = 0;
    let totalBytes = 0;
    let writesDone = false;
    stream.on('data', (chunk) => {
      totalBytes += chunk.length;
      if (!writesDone) earlyBytes += chunk.length;
    });
    for (let off = 0; off < body.length; off += 997) {
      stream.write(body.subarray(off, off + 997));
    }
    writesDone = true;
    assert.ok(
      earlyBytes > 0,
      'nothing was emitted before stream end: the probe buffer cap never settled the stream'
    );
    stream.end();
    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    assert.strictEqual(totalBytes, body.length, 'cap settlement must pass bytes through unchanged');
    // Doubling probes over ~68 KB of ambiguity: ~18, not one per write.
    assert.ok(probes <= 40, `expected bounded probing across the cap, got ${probes}`);
  });
});
