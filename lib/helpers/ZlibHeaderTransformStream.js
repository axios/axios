'use strict';

import stream from 'stream';

// RFC 1950: CM is 8 (deflate), CINFO is at most 7 and CMF * 256 + FLG is a multiple of 31
const hasZlibHeader = (chunk) =>
  (chunk[0] & 0x0f) === 8 && chunk[0] >> 4 <= 7 && ((chunk[0] << 8) | chunk[1]) % 31 === 0;

// RFC 1951: a raw stream can start with a stored block, where LEN is followed by its complement NLEN
const hasStoredBlockHeader = (chunk) =>
  (chunk[1] | (chunk[2] << 8)) === (~(chunk[3] | (chunk[4] << 8)) & 0xffff);

// 0x78 (32K window) is always zlib, as before; other CMF bytes only when not a stored block
const isZlib = (chunk) =>
  chunk[0] === 0x78 || (chunk.length >= 5 && hasZlibHeader(chunk) && !hasStoredBlockHeader(chunk));

class ZlibHeaderTransformStream extends stream.Transform {
  __transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  }

  _transform(chunk, encoding, callback) {
    if (chunk.length !== 0) {
      this._transform = this.__transform;

      // Add Default Compression headers if no zlib headers are present
      if (!isZlib(chunk)) {
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
