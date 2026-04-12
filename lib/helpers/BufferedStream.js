import utils from '../utils.js';
import readBlob from "./readBlob.js";
import textEncoder from "./textEncoder.js";
import CanceledError from "../cancel/CanceledError.js";
import asyncTimeout from "../helpers/asyncTimeout.js";

const [kInternal] = utils.symbols('internal');


export default class BufferedStream {
  constructor(source, {
    maxBytes,
    timeWindow = 5000,
    signal
  } = {}) {
    if (!utils.isAsyncIterable(source)) {
      throw new Error('source must be async iterable');
    }

    const internal = this[kInternal] = {
      source,
      signal,
      chunks: [],
      bytes: 0,
      max: utils.toFiniteNumber(maxBytes),
      timeout: utils.toFiniteNumber(timeWindow),
      // implicitly defined
      // mutex: undefined
      // iterator: undefined,
    }

    internal.fp = new Promise((resolve) => internal.flush = resolve);
  }



  async* [Symbol.asyncIterator]() {
    let internal = this[kInternal],
      {signal, max, mutex} = internal;

    this.keep();

    if (internal.chunks) {
      yield* internal.chunks;
    } else {
      throw Error(`stream is flushed`);
    }

    internal.mutex = new Promise((resolve, reject) => {
      internal.resolve = resolve;
      internal.reject = reject;
    });

    internal.mutex.catch(() => {
      // swallow error to avoid unhandled rejection if iterator is not consumed
    });

    await mutex;

    internal.timer = setTimeout(() => {
      this.flush();
    }, internal.timeout);

    let iterator, ret, chunk, bytes;

    try {
      iterator = internal.iterator || (internal.iterator = readBlob(internal.source));

      for(;;) {
        ret = await iterator.next();

        if (signal && signal.aborted) {
          throw CanceledError.from(signal.reason);
        }

        if (ret.done) {
          break;
        }

        chunk = utils.isArrayBufferView(ret.value) ? ret.value : textEncoder.encode(ret.value);

        bytes = chunk.byteLength;

        if (internal.chunks) {
          internal.chunks.push(chunk);

          if ((internal.bytes += bytes) >= max) {
            await asyncTimeout(internal.timeout, signal);
            this.flush();
          }
        }

        yield chunk;
      }

      internal.resolve();
    } catch(err) {
      internal.reject(err);
      throw err;
    } finally {
      if (!internal.chunks && iterator.return) {
        await iterator.return();
      }
    }
  }

  flush() {
    this.keep();
    let internal = this[kInternal];
    internal.chunks = null;
    internal.flush();
  }

  keep() {
    let internal = this[kInternal];
    internal.timer && clearTimeout(internal.timer);
    internal.timer = null;
  }

  waitForFlush() {
    return this[kInternal].fp;
  }

  get isFlushed() {
    return !this[kInternal].chunks;
  }

  get [Symbol.toStringTag]() {
    return 'BufferedStream'
  }
}

