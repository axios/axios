'use strict';

import stream from 'stream';
import zlib from 'zlib';

const $pendingByte = Symbol('pendingByte');

const PROBE_BOUND = 65536;

function sniffFormat(chunk) {
  // returns 'zlib', 'raw' or null when the available bytes cannot decide.
  // maxOutputLength keeps the probe bounded: without it a highly compressed
  // first chunk would fully inflate here and bypass maxContentLength.
  try {
    zlib.inflateSync(chunk, {maxOutputLength: PROBE_BOUND});
    return 'zlib';
  } catch (e) {
    if (e.code === 'Z_DATA_ERROR') {
      // decoding under the fake header's small window throws Z_DATA_ERROR
      // as soon as a back-reference does not fit it, while a raw decode of
      // the same bytes succeeds
      try {
        zlib.inflateRawSync(chunk, {maxOutputLength: PROBE_BOUND});
        return 'raw';
      } catch (e2) {
        // Z_DATA_ERROR means the bytes are not raw deflate either, so the
        // corrupt stream keeps the zlib decision and lets unzip report the
        // error; Z_BUF_ERROR and ERR_BUFFER_TOO_LARGE mean the raw decode
        // ran out of input or hit the bound mid-stream, which is still
        // consistent with raw deflate
        return e2.code === 'Z_DATA_ERROR' ? 'zlib' : 'raw';
      }
    }
    if (e.code === 'ERR_BUFFER_TOO_LARGE') {
      // the probe produced a full bound of output without a structural
      // error, which only a genuine zlib stream can do
      return 'zlib';
    }
    if (e.code === 'Z_BUF_ERROR') {
      // truncated input: the stream may still be zlib-wrapped, so only a
      // raw parse can decide; a dynamic raw block fails fast while stored
      // raw blocks simply run out of input
      try {
        zlib.inflateRawSync(chunk, {maxOutputLength: PROBE_BOUND});
        return 'raw';
      } catch (e2) {
        // not raw deflate either: what remains is a truncated zlib stream
        return e2.code === 'Z_DATA_ERROR' ? 'zlib' : null;
      }
    }
    throw e;
  }
}

class ZlibHeaderTransformStream extends stream.Transform {
  __transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  }

  _transform(chunk, encoding, callback) {
    if (this[$pendingByte]) {
      chunk = Buffer.concat([this[$pendingByte], chunk]);
      this[$pendingByte] = null;
    }

    if (chunk.length === 0) {
      return this.__transform(chunk, encoding, callback);
    }

    // the zlib header check needs two bytes, so a one-byte first chunk has
    // to wait for the next one
    if (chunk.length === 1) {
      this[$pendingByte] = chunk;
      return callback();
    }

    // Add Default Compression headers if no zlib headers are present.
    // RFC 1950: the CMF byte carries compression method 8 (deflate) in its
    // low nibble and a 0-7 window size (CINFO) in the high nibble, so valid
    // values are 0x08-0x78, and the FLG byte satisfies the FCHECK constraint.
    // Checking only for 0x78 misses streams written with windowBits < 15,
    // which zlib emits as 0x18-0x68.
    let isZlibWrapped =
      (chunk[0] & 0x0f) === 8 && chunk[0] <= 0x78 &&
      (chunk[0] * 256 + chunk[1]) % 31 === 0;

    if (isZlibWrapped) {
      // a raw deflate stream can open with bytes that satisfy the header
      // check (e.g. a stored block starting 0x08 0x1d), so the probe needs
      // real payload; when the available bytes cannot decide either way,
      // wait for more input instead of committing to the wrong decoder
      const format = chunk.length > 2 ? sniffFormat(chunk) : null;
      if (format === null) {
        if (chunk.length < PROBE_BOUND) {
          this[$pendingByte] = chunk;
          return callback();
        }
        // a stream that still cannot be classified after a full bound of
        // input keeps the legacy zlib decision
      } else {
        isZlibWrapped = format === 'zlib';
      }
    }

    this._transform = this.__transform;

    if (!isZlibWrapped) {
      const header = Buffer.alloc(2);
      header[0] = 120; // Hex: 78
      header[1] = 156; // Hex: 9C
      this.push(header, encoding);
    }

    this.__transform(chunk, encoding, callback);
  }

  _flush(callback) {
    if (this[$pendingByte]) {
      const pending = this[$pendingByte];
      this[$pendingByte] = null;
      let isZlibWrapped = pending.length > 1 &&
        (pending[0] & 0x0f) === 8 && pending[0] <= 0x78 &&
        (pending[0] * 256 + pending[1]) % 31 === 0;
      if (isZlibWrapped && pending.length > 2) {
        // a stream that ended while the format was still undecided gets one
        // last probe; inconclusive stays with the legacy zlib decision
        const format = sniffFormat(pending);
        if (format !== null) {
          isZlibWrapped = format === 'zlib';
        }
      }
      // a one-byte stream can never be zlib-wrapped, so it gets the header
      // too; a two-byte prefix that passed the header check stays as-is
      if (!isZlibWrapped) {
        const header = Buffer.alloc(2);
        header[0] = 120; // Hex: 78
        header[1] = 156; // Hex: 9C
        this.push(header);
      }
      this.push(pending);
    }
    callback();
  }
}

export default ZlibHeaderTransformStream;
