'use strict';

import stream from 'stream';

// RFC 1950: CM is 8 (deflate), CINFO is at most 7 and CMF * 256 + FLG is a multiple of 31
const hasZlibHeader = (chunk) =>
  (chunk[0] & 0x0f) === 8 &&
  chunk[0] >> 4 <= 7 &&
  (chunk.length < 2 || ((chunk[0] << 8) | chunk[1]) % 31 === 0);

class ZlibHeaderTransformStream extends stream.Transform {
  __transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  }

  _transform(chunk, encoding, callback) {
    if (chunk.length !== 0) {
      this._transform = this.__transform;

      // Add Default Compression headers if no zlib headers are present
      if (!hasZlibHeader(chunk)) {
        const header = Buffer.alloc(2);
        header[0] = 120; // Hex: 78
        header[1] = 156; // Hex: 9C
        this.push(header, encoding);
      }
    }

    this.__transform(chunk, encoding, callback);
  }
}

export default ZlibHeaderTransformStream;
