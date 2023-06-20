"use strict";

import stream from "stream";

/**
 * A Transform stream that adds default compression headers if no zlib headers are present in the input chunk.
 * @extends stream.Transform
 * @class
 * @remarks
 * This class overrides the _transform method of the Transform stream to check for the presence of zlib headers in the input chunk. If no headers are present, it adds default compression headers before passing the chunk to the next stream in the pipeline.
 * @param {Buffer|string} chunk - The chunk of data to be transformed.
 * @param {string} encoding - The encoding of the chunk.
 * @param {Function} callback - The callback function to be called when the transformation is complete.
 * @returns {void}
 */
class ZlibHeaderTransformStream extends stream.Transform {
  __transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  }

  /**
   * Transforms a chunk of data and pushes it to the readable stream.
   * @param {Buffer} chunk - The chunk of data to transform.
   * @param {string} encoding - The encoding of the chunk.
   * @param {Function} callback - The callback function to call when the transformation is complete.
   * @remarks This method adds default compression headers if no zlib headers are present in the chunk.
   */
  _transform(chunk, encoding, callback) {
    if (chunk.length !== 0) {
      this._transform = this.__transform;

      // Add Default Compression headers if no zlib headers are present
      if (chunk[0] !== 120) { // Hex: 78
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
