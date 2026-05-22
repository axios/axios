import utils from '../utils.js';
import readBlob from "./readBlob.js";
import textEncoder from "./textEncoder.js";
import CanceledError from "../cancel/CanceledError.js";
import listenToSignal from "./listenToSignal.js";
import AxiosError from "../core/AxiosError.js";
import {readBytes, streamChunk} from "./trackStream.js";

const [kInternal] = utils.symbols();

let counter = 0;

export default class BufferedStream {
  constructor(source, {
    timeout,
    threshold = 0,
    limit = 0,
    signal
  } = {}) {
    if (!utils.isAsyncIterable(source)) {
      throw new Error('source must be async iterable');
    }

    this[kInternal] = {
      source,
      signal,
      chunks: [],
      listeners: [],
      bytes: 0,
      min: utils.toFinite(threshold),
      max: utils.toFinite(limit),
      timeout: utils.toFinite(timeout),
      // [ implicitly defined ]
      // reached: false,
      // mutex: undefined
      // iterator: undefined,
      // unsub: null
      // abort
    }
  }

  async* [Symbol.asyncIterator]() {
    let internal = this[kInternal],
      {signal, min, max, mutex, listeners} = internal;

    this.keep();

    if (min > max) {
      min = max;
    }

    internal.abort && internal.abort(new CanceledError());

    internal.mutex = new Promise((resolve, reject) => {
      internal.resolve = resolve;
      internal.reject = reject;
    });

    internal.mutex.catch(() => {
      // swallow the error to prevent unhandled promise rejection, the error will be re-thrown in the iterator loop
    });

    await mutex;

    if (internal.chunks) {
      yield* internal.chunks;
    } else {
      throw new AxiosError(`stream is flushed`, AxiosError.ERR_STREAM_FLUSHED);
    }

    const {resolve, reject} = internal;

    let abortedWith;
    let onAbort;

    internal.abort = (err) =>{
      internal.abort = null;
      abortedWith = err;
      onAbort && onAbort(err);
    };

    let unsubscribe = listenToSignal(signal, internal.abort);

    let iterator, ret, chunk;

    internal.reached && this.flush(internal.timeout);

    const maxChunkSize = Math.min(min, 16 * 1024);

    try {
      iterator = internal.iterator || (internal.iterator = readBlob(internal.source));

      for(;;) {
        if (abortedWith) {
          throw abortedWith;
        }

        if (max && internal.chunks && internal.bytes >= max) {
          await new Promise((resolve, reject) => {
            onAbort = (err) => {
              let index = listeners.indexOf(resolve);
              if (index !== -1) {
                listeners.splice(index, 1);
              }
              reject(err);
            }

            listeners.push(resolve);
          });
        }

        ret = await iterator.next();

        if (ret.done) {
          break;
        }

        chunk = utils.isArrayBufferView(ret.value) ? ret.value : textEncoder.encode(ret.value);

        if (internal.chunks) {
          internal.chunks.push(chunk);
          internal.bytes += chunk.byteLength;
        }

        if (maxChunkSize && internal.reached) {
          yield chunk;
        } else {
          yield* streamChunk(chunk, maxChunkSize);
        }

        if (internal.chunks && !internal.timer && internal.bytes >= min) {
          internal.reached = true;
          this.flush(internal.timeout);
        }
      }

      iterator.return && iterator.return();
      resolve();
    } catch(err) {
      if (err instanceof CanceledError && !(signal && signal.aborted)) {
        if (!internal.chunks) {
          await iterator.return();
        }

        resolve();
      } else {
        internal.chunks = null;
        reject(err);
        iterator.return && iterator.return();
      }

      throw err;
    } finally {
      unsubscribe && unsubscribe();
    }
  }

  flush(delay) {
    let internal = this[kInternal];
    this.keep();

    const doFlush = () => {
      internal.chunks = null;
      internal.listeners.forEach(resolve => resolve());
      internal.listeners = [];
    }

    if (delay) {
      internal.timer = setTimeout(doFlush, delay);

      internal.unsub = listenToSignal(internal.signal, () => {
        this.keep(); // clear the timer
      });
    } else {
      doFlush();
    }
  }

  keep() {
    let internal = this[kInternal];
    internal.unsub && internal.unsub();
    internal.timer && clearTimeout(internal.timer);
    internal.timer = null;
  }

  get isFlushed() {
    return !this[kInternal].chunks;
  }

  get [Symbol.toStringTag]() {
    return 'BufferedStream'
  }
}

