'use strict';

import stream from 'stream';
import zlib from 'zlib';

const kHead = Symbol('head');

// RFC 1950: CM is 8 (deflate), CINFO is at most 7 and CMF * 256 + FLG is a multiple of 31
const hasZlibHeader = (chunk) =>
  (chunk[0] & 0x0f) === 8 && chunk[0] >> 4 <= 7 && ((chunk[0] << 8) | chunk[1]) % 31 === 0;

// Read as raw deflate, a first byte with CM 8 opens a non-final stored block (RFC 1951):
// LEN, then its complement NLEN. Returns LEN, or -1 when the pair does not match.
const storedBlockLength = (chunk) => {
  const len = chunk[1] | (chunk[2] << 8);
  return (~(chunk[3] | (chunk[4] << 8)) & 0xffff) === len ? len : -1;
};

const inflatesAsZlib = (chunk) => {
  try {
    zlib.inflateSync(chunk, {
      finishFlush: zlib.constants.Z_SYNC_FLUSH,
      maxOutputLength: 64 * 1024,
    });
    return true;
  } catch (err) {
    return !['Z_DATA_ERROR', 'Z_NEED_DICT'].includes(err.code);
  }
};

// true for zlib, false for raw deflate, undefined while more bytes are needed
const isZlib = (chunk, ended) => {
  // 0x78 (32K window) is always zlib, as before
  if (chunk[0] === 0x78) return true;
  if (chunk.length < 2) return ended ? false : undefined;
  if (!hasZlibHeader(chunk)) return false;
  if (chunk.length < 5) return ended ? true : undefined;

  const len = storedBlockLength(chunk);
  if (len === -1) return true;

  // Both readings are valid so far: wait for the raw stored block and the next block header
  // (at most 64K + 10 bytes), then keep zlib unless inflating them as zlib fails
  if (chunk.length < len + 10 && !ended) return undefined;
  return inflatesAsZlib(chunk.subarray(0, len + 10));
};

const prependHeader = (stream, encoding) => {
  const header = Buffer.alloc(2);
  header[0] = 120; // Hex: 78
  header[1] = 156; // Hex: 9C
  stream.push(header, encoding);
};

class ZlibHeaderTransformStream extends stream.Transform {
  __transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  }

  _transform(chunk, encoding, callback) {
    if (this[kHead]) {
      chunk = Buffer.concat([this[kHead], chunk]);
      this[kHead] = null;
    }

    if (chunk.length !== 0) {
      const zlibHeader = isZlib(chunk, false);

      if (zlibHeader === undefined) {
        this[kHead] = chunk;
        callback();
        return;
      }

      this._transform = this.__transform;

      // Add Default Compression headers if no zlib headers are present
      if (!zlibHeader) {
        prependHeader(this, encoding);
      }
    }

    this.__transform(chunk, encoding, callback);
  }

  _flush(callback) {
    if (this[kHead]) {
      if (!isZlib(this[kHead], true)) {
        prependHeader(this);
      }
      this.push(this[kHead]);
    }

    callback();
  }
}

export default ZlibHeaderTransformStream;
