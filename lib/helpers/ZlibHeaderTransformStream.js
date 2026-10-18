'use strict';

import stream from 'stream';

const kHead = Symbol('head');

// RFC 1950: CM is 8 (deflate), CINFO is at most 7 and CMF * 256 + FLG is a multiple of 31
const hasZlibHeader = (chunk) =>
  (chunk[0] & 0x0f) === 8 && chunk[0] >> 4 <= 7 && ((chunk[0] << 8) | chunk[1]) % 31 === 0;

// 0x78 (32K window) is always zlib, as before
const isZlib = (chunk) => chunk[0] === 0x78 || hasZlibHeader(chunk);

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

    // Wait for the FLG byte before deciding
    if (chunk.length === 1 && chunk[0] !== 0x78) {
      this[kHead] = chunk;
      callback();
      return;
    }

    if (chunk.length !== 0) {
      this._transform = this.__transform;

      // Add Default Compression headers if no zlib headers are present
      if (!isZlib(chunk)) {
        prependHeader(this, encoding);
      }
    }

    this.__transform(chunk, encoding, callback);
  }

  _flush(callback) {
    if (this[kHead]) {
      prependHeader(this);
      this.push(this[kHead]);
    }

    callback();
  }
}

export default ZlibHeaderTransformStream;
