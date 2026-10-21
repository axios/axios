'use strict';

import stream from 'stream';
import zlib from 'zlib';

const $pendingByte = Symbol('pendingByte');

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

    this._transform = this.__transform;

    // Add Default Compression headers if no zlib headers are present.
    // RFC 1950: the CMF byte carries compression method 8 (deflate) in its
    // low nibble and a 0-7 window size (CINFO) in the high nibble, so valid
    // values are 0x08-0x78, and the FLG byte satisfies the FCHECK constraint.
    // Checking only for 0x78 misses streams written with windowBits < 15,
    // which zlib emits as 0x18-0x68.
    let isZlibWrapped =
      (chunk[0] & 0x0f) === 8 && chunk[0] <= 0x78 &&
      (chunk[0] * 256 + chunk[1]) % 31 === 0;

    if (isZlibWrapped && chunk.length > 2) {
      // a raw deflate stream can open with bytes that satisfy the header
      // check (e.g. a stored block starting 0x08 0x1d). Probe the payload:
      // decoding under the fake header's small window throws Z_DATA_ERROR
      // as soon as a back-reference does not fit it, while a raw decode of
      // the same bytes succeeds. A genuinely zlib-wrapped stream only
      // reports Z_BUF_ERROR on the truncated input, and a corrupt stream
      // fails both probes, keeping the zlib decision so the unzip reports
      // the error.
      try {
        zlib.inflateSync(chunk);
      } catch (e) {
        if (e.code === 'Z_DATA_ERROR') {
          try {
            zlib.inflateRawSync(chunk);
            isZlibWrapped = false;
          } catch (e2) {
            // Z_BUF_ERROR means the raw decode ran out of input mid-stream,
            // which is still consistent with raw deflate
            isZlibWrapped = e2.code === 'Z_DATA_ERROR';
          }
        }
      }
    }

    if (!isZlibWrapped) {
      const header = Buffer.alloc(2);
      header[0] = 120; // Hex: 78
      header[1] = 156; // Hex: 9C
      this.push(header, encoding);
    }

    this.__transform(chunk, encoding, callback);
  }

  _flush(callback) {
    // a stream this short can never be zlib-wrapped, so it gets the header too
    if (this[$pendingByte]) {
      const header = Buffer.alloc(2);
      header[0] = 120; // Hex: 78
      header[1] = 156; // Hex: 9C
      this.push(header);
      this.push(this[$pendingByte]);
      this[$pendingByte] = null;
    }
    callback();
  }
}

export default ZlibHeaderTransformStream;
