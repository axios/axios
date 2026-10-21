'use strict';

import stream from 'stream';
import zlib from 'zlib';

// Prepended to raw deflate bodies so the downstream zlib decoder accepts them.
const DEFAULT_ZLIB_HEADER = Buffer.from([0x78, 0x9c]);

// Bound on how long an ambiguous stream may stay buffered while the probe
// cannot decide yet; past this, fall back to the header heuristic.
const MAX_PROBE_BUFFER_BYTES = 64 * 1024;

class ZlibHeaderTransformStream extends stream.Transform {
  __transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  }

  // RFC 1950: the CMF byte is (CINFO << 4) | CM, where CM = 8 means deflate
  // and CINFO 0 to 7 encodes the window size, so a zlib stream can start with
  // any CMF byte from 0x08 to 0x78, not only 0x78 (which zlib emits for
  // windowBits 15, the default). Streams written with a smaller window start
  // with 0x18 to 0x68 (see gh-11333). When the FLG byte is available, the
  // FCHECK constraint must hold as well.
  _passesHeaderCheck(buffer) {
    const cmf = buffer[0];
    return (
      (cmf & 0x0f) === 8 &&
      cmf <= 0x78 &&
      (buffer.length < 2 || ((cmf << 8) | buffer[1]) % 31 === 0)
    );
  }

  // The header check cannot prove a stream is wrapped: a valid raw stored
  // block can begin with bytes that satisfy it (see gh-11339 review). Probe
  // the buffered prefix with a real wrapped decoder. A wrapped stream always
  // decodes without a data error, while a raw stream misread as wrapped
  // fails as soon as its first block is complete.
  _probe(prefix) {
    if (!this._passesHeaderCheck(prefix)) {
      return 'raw';
    }
    try {
      const out = zlib.inflateSync(prefix, {
        flush: zlib.constants.Z_SYNC_FLUSH,
        finishFlush: zlib.constants.Z_SYNC_FLUSH
      });
      return out.length > 0 ? 'wrapped' : 'more';
    } catch (err) {
      return 'raw';
    }
  }

  _settle(wrapped) {
    const pending = this._pending;
    this._pending = null;
    this._transform = this.__transform;
    if (!wrapped) {
      this.push(DEFAULT_ZLIB_HEADER);
    }
    if (pending && pending.length) {
      this.push(pending);
    }
  }

  _transform(chunk, encoding, callback) {
    if (chunk.length === 0) {
      this.__transform(chunk, encoding, callback);
      return;
    }

    this._pending = this._pending ? Buffer.concat([this._pending, chunk]) : chunk;

    const verdict = this._probe(this._pending);
    if (verdict === 'wrapped' || verdict === 'raw') {
      this._settle(verdict === 'wrapped');
    } else if (this._pending.length >= MAX_PROBE_BUFFER_BYTES) {
      this._settle(true);
    }

    callback();
  }

  _flush(callback) {
    // The stream ended while the format was still undecided (for example a
    // very small body): fall back to the header heuristic.
    if (this._pending) {
      this._settle(this._passesHeaderCheck(this._pending));
    }
    callback();
  }
}

export default ZlibHeaderTransformStream;
