'use strict';

import stream from 'stream';
import zlib from 'zlib';

// Prepended to raw deflate bodies so the downstream zlib decoder accepts them.
const DEFAULT_ZLIB_HEADER = Buffer.from([0x78, 0x9c]);

// Bound on how long an ambiguous stream may stay buffered while the probe
// cannot decide yet; past this, fall back to the header heuristic.
const MAX_PROBE_BUFFER_BYTES = 64 * 1024;

// Bound on how much the probe may decompress. The classification only needs
// to know whether the prefix yields any valid output, so the probe stops far
// before response-size limits or memory become a concern.
const MAX_PROBE_OUTPUT_BYTES = 1024;

const kPending = Symbol('pending');
const kProbeAt = Symbol('probeAt');

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
  // the buffered prefix with a real wrapped decoder, capped at
  // MAX_PROBE_OUTPUT_BYTES of output so a highly compressed response cannot
  // expand unchecked before response-size limits run. A wrapped stream
  // decodes without a data error, while a raw stream misread as wrapped
  // fails as soon as its first block is complete.
  _probe(prefix) {
    if (!this._passesHeaderCheck(prefix)) {
      return 'raw';
    }
    try {
      const out = zlib.inflateSync(prefix, {
        flush: zlib.constants.Z_SYNC_FLUSH,
        finishFlush: zlib.constants.Z_SYNC_FLUSH,
        maxOutputLength: MAX_PROBE_OUTPUT_BYTES
      });
      return out.length > 0 ? 'wrapped' : 'more';
    } catch (err) {
      // More than MAX_PROBE_OUTPUT_BYTES of clean output can only come from
      // a genuinely wrapped stream.
      if (err && err.code === 'ERR_BUFFER_TOO_LARGE') {
        return 'wrapped';
      }
      return 'raw';
    }
  }

  // No more bytes are coming (stream end or the probe buffer cap): probe
  // whatever the doubling schedule has not checked yet, so a raw stream
  // whose tail missed the last interval is still classified on evidence.
  // Only a probe that still cannot decide falls back to the header
  // heuristic.
  _finalVerdict(pending) {
    const verdict = this._probe(pending);
    return verdict === 'more' ? this._passesHeaderCheck(pending) : verdict === 'wrapped';
  }

  _settle(wrapped) {
    const pending = this[kPending];
    this[kPending] = null;
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

    this[kPending] = this[kPending] ? Buffer.concat([this[kPending], chunk]) : chunk;

    const pending = this[kPending];
    // Probe at doubling intervals, not on every chunk: a stream that stays
    // ambiguous (no output, no data error) then costs O(n) total probe work
    // instead of re-inflating the whole prefix per chunk, which an
    // adversarial response could use to stall the event loop.
    if (pending.length >= (this[kProbeAt] || 1)) {
      this[kProbeAt] = pending.length * 2;
      const verdict = this._probe(pending);
      if (verdict === 'wrapped' || verdict === 'raw') {
        this._settle(verdict === 'wrapped');
      }
    }
    if (this[kPending] && this[kPending].length >= MAX_PROBE_BUFFER_BYTES) {
      this._settle(this._finalVerdict(this[kPending]));
    }

    callback();
  }

  _flush(callback) {
    // The stream ended while the format was still undecided (for example a
    // very small body): check the unprobed tail before falling back to the
    // header heuristic.
    if (this[kPending]) {
      this._settle(this._finalVerdict(this[kPending]));
    }
    callback();
  }
}

export default ZlibHeaderTransformStream;
