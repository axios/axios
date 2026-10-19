'use strict';

import stream from 'stream';

class ZlibHeaderTransformStream extends stream.Transform {
  __transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  }

  _transform(chunk, encoding, callback) {
    if (chunk.length !== 0) {
      this._transform = this.__transform;

      // Add Default Compression headers if no zlib headers are present.
      // RFC 1950: the CMF byte is (CINFO << 4) | CM, where CM = 8 means
      // deflate and CINFO 0 to 7 encodes the window size, so a zlib stream
      // can start with any CMF byte from 0x08 to 0x78, not only 0x78 (which
      // zlib emits for windowBits 15, the default). Streams written with a
      // smaller window start with 0x18 to 0x68 (see gh-11333). When the FLG
      // byte is available, the FCHECK constraint must hold as well.
      const cmf = chunk[0];
      const isZlibStream =
        (cmf & 0x0f) === 8 &&
        cmf <= 0x78 &&
        (chunk.length < 2 || ((cmf << 8) | chunk[1]) % 31 === 0);

      if (!isZlibStream) {
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
