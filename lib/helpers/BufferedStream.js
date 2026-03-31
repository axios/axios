import utils from '../utils.js';
import readBlob from "./readBlob.js";
import AxiosError from "../core/AxiosError.js";
import CanceledError from "../cancel/CanceledError.js";
import asyncTimeout from "./asyncTimeout.js";
import textEncoder from "./textEncoder.js";

const [kInternal] = utils.symbols('internal');



export default class BufferedStream {
  constructor(source, {
    bytesThreshold,
    timeWindow = 5000,
    signal
  } = {}) {
    if(!utils.isIterable(source) && !utils.isAsyncIterable(source)) {
      throw new Error('source must be an iterable');
    }

    this[kInternal] = {
      source,
      signal,
      used: false,
      blob: null,
      chunks: [],
      locked: false,
      flushListeners: [],
      bytesBuffered: 0,
      bytesThreshold: utils.toFiniteNumber(bytesThreshold),
      timeWindow: utils.toFiniteNumber(timeWindow)
    }
  }

  async *[Symbol.asyncIterator]() {
    const internal = this[kInternal];
    const {signal} = internal;

    if (internal.locked) {
      throw Error('stream is locked');
    }

    internal.locked = true;

    if (internal.chunks) {
      for (const chunk of internal.chunks) {
        yield chunk;
      }
    } else if (internal.used) {
      throw Error('Unable to reread unbuffered data stream.');
    }

    const blob = internal.blob || (internal.blob = readBlob(internal.source));

    let ret;

    const resetTimer = () => {
      internal.timer && clearTimeout(internal.timer);
      internal.timer = null;
    }

    resetTimer();


    let unsubscribe;

    internal.timer = setTimeout(() => {
      this[kInternal].chunks = null;
      unsubscribe && unsubscribe();
      internal.timer = null;
      internal.flushListeners.forEach(listener => listener());
      internal.flushListeners = [];
    }, internal.timeWindow);

    if(signal) {
      let onAbort;

      unsubscribe = () => {
        signal.addEventListener('abort', onAbort);
      }

      signal.addEventListener('abort', onAbort = (() => {
        unsubscribe && unsubscribe();
        resetTimer();
      }));
    }

    try {

      while (1) {
        if (internal.chunks && internal.bytesBuffered >= internal.bytesThreshold) {
          await this.waitForFlush()
        }

        ret = await blob.next();

        if (ret.done) {
          break;
        }

        const chunk = textEncoder.encode(ret.value);

        if (internal.chunks) {
          internal.chunks.push(chunk);
          internal.bytesBuffered += chunk.byteLength;
        }

        yield chunk;

      }


    } finally {
      internal.locked = false;
      console.log('finally');
    }
  }

  waitForFlush() {
    return new Promise((resolve) => {
      this[kInternal].flushListeners.push(resolve);
    });
  }

  get isBuffered() {
    return !!this[kInternal].chunks;
  }
}


const generateNumbers = function* (count) {
  for (let i = 0; i < count; i++) {
    yield i;
  }
};

/*
(async() => {
  const controller = new AbortController();

  const buffered = new BufferedStream(generateNumbers(10), {
    bytesThreshold: 15,
    signal: controller.signal
  });

  setTimeout(() => {
    //controller.abort();
  }, 700);

  let n = 0;

  for await(const chunk of buffered) {
    console.log('chunk:', chunk, Buffer.from(chunk).toString());
    if( n++ === 5) {
      //break;
    }
  }

  console.log('===== SECOND READING =====')

  for await(const chunk of buffered) {
    console.log('chunk:', chunk, Buffer.from(chunk).toString());
    if( n++ === 5) {
      //break;
    }
  }




})();
*/
