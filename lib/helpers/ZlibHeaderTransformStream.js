'use strict';

import stream from 'stream';
import zlib from 'zlib';

const $pending = Symbol('pending');
const $probes = Symbol('probes');

// The probe stays inconclusive for at most this many bytes of compressed
// input; past that the stream keeps the legacy zlib decision. The bound caps
// both how long compressed bytes are withheld and how much decode output each
// probe buffer can hold.
const PROBE_BOUND = 65536;

// RFC 1950: the CMF byte carries compression method 8 (deflate) in its low
// nibble and a 0-7 window size (CINFO) in the high nibble, so valid values are
// 0x08-0x78, and the FLG byte satisfies the FCHECK constraint. Checking only
// for 0x78 misses streams written with windowBits < 15, which zlib emits as
// 0x18-0x68.
function hasZlibHeader(chunk) {
  return (chunk[0] & 0x0f) === 8 && chunk[0] <= 0x78 &&
    (chunk[0] * 256 + chunk[1]) % 31 === 0;
}

function zlibHeader() {
  const header = Buffer.alloc(2);
  header[0] = 120; // Hex: 78
  header[1] = 156; // Hex: 9C
  return header;
}

class ZlibHeaderTransformStream extends stream.Transform {
  __transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  }

  _transform(chunk, encoding, callback) {
    const pending = this[$pending];
    if (pending) {
      this[$pending] = null;
      chunk = chunk.length ? Buffer.concat([pending, chunk]) : pending;
    }
    if (!chunk.length) {
      return callback();
    }

    if (!this[$probes]) {
      if (chunk.length < 2) {
        this[$pending] = chunk;
        return callback();
      }
      if (!hasZlibHeader(chunk)) {
        // no zlib header: the body is raw deflate and gets a default
        // compression header added so unzip decodes it
        this._transform = this.__transform;
        this.push(zlibHeader(), encoding);
        return this.__transform(chunk, encoding, callback);
      }
      this._startProbing();
    }

    this._probe(chunk);
    callback();
  }

  // A raw deflate stream can open with bytes that satisfy the zlib header
  // check (a stored block may start 0x08 0x1d), so a header-shaped prefix is
  // fed to two live decoders: a zlib inflate and a raw inflate. Compressed
  // input is accepted and buffered while the probes work; only an outright
  // failure settles the question — a raw decode that merely survives proves
  // nothing, since a real zlib body is also valid input to a raw decoder, and
  // a zlib decode that survives proves nothing either, because its adler
  // check can only fail at the end of the stream.
  _startProbing() {
    const probes = this[$probes] = {
      z: zlib.createInflate(),
      r: zlib.createInflateRaw(),
      chunks: [],
      buffered: 0,
      settled: false,
      // null while undecided, true on 'end', false on 'error'; a probe can
      // end mid-body because inflate pushes EOF at Z_STREAM_END, so the
      // result is recorded as it happens rather than awaited at _flush
      zDone: null,
      rDone: null,
      zNeedsDict: false
    };

    probes.z.on('data', () => {});
    probes.r.on('data', () => {});
    probes.z.once('end', () => { probes.zDone = true; });
    probes.z.once('error', (e) => {
      probes.zNeedsDict = e.code === 'Z_NEED_DICT';
      probes.zDone = false;
      // Z_NEED_DICT comes only from a genuine zlib header with FDICT set;
      // anything else the raw probe may still disprove
      this._decide(e.code === 'Z_NEED_DICT' || probes.r.destroyed || probes.rDone === false);
    });
    probes.r.once('end', () => { probes.rDone = true; });
    probes.r.once('error', () => {
      probes.rDone = false;
      this._decide(true);
    });
  }

  _probe(chunk) {
    const probes = this[$probes];
    probes.chunks.push(chunk);
    probes.buffered += chunk.length;
    if (!probes.z.destroyed) {
      probes.z.write(chunk);
    }
    if (!probes.r.destroyed) {
      probes.r.write(chunk);
    }
    if (probes.buffered >= PROBE_BOUND) {
      this._decide(true);
    }
  }

  _decide(zlibWrapped) {
    const probes = this[$probes];
    if (!probes || probes.settled) {
      return;
    }
    probes.settled = true;
    const chunks = probes.chunks;
    probes.z.destroy();
    probes.r.destroy();
    this[$probes] = null;

    this._transform = this.__transform;
    if (!zlibWrapped) {
      this.push(zlibHeader());
    }
    for (const chunk of chunks) {
      this.push(chunk);
    }
  }

  _flush(callback) {
    const pending = this[$pending];
    if (pending) {
      this[$pending] = null;
      // a stream that ended before two bytes arrived can never be
      // zlib-wrapped, so it gets the header too
      this._transform = this.__transform;
      this.push(zlibHeader());
      this.push(pending);
      return callback();
    }

    const probes = this[$probes];
    if (!probes) {
      return callback();
    }

    // the stream ended while the format was still undecided: a zlib decode
    // that finishes verifies the adler checksum, which settles it for good;
    // a probe may already have finished or failed while input was flowing,
    // so the recorded results count before waiting on .end()
    let finished = false;
    const settle = () => {
      if (finished) {
        return;
      }
      if (probes.settled) {
        // a probe failure already settled the format; the surviving probe
        // was destroyed, so its result can never arrive
        finished = true;
        return callback();
      }
      if (probes.zDone === null || probes.rDone === null) {
        return;
      }
      finished = true;
      this._decide(probes.zDone || probes.zNeedsDict || !probes.rDone);
      callback();
    };
    probes.z.on('end', settle);
    probes.z.on('error', settle);
    probes.r.on('end', settle);
    probes.r.on('error', settle);
    probes.z.end();
    probes.r.end();
    settle();
  }

  _destroy(err, callback) {
    const probes = this[$probes];
    if (probes) {
      probes.z.destroy();
      probes.r.destroy();
      this[$probes] = null;
    }
    this[$pending] = null;
    callback(err);
  }
}

export default ZlibHeaderTransformStream;
