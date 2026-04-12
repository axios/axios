import utils from "../utils.js";

const { asyncIterator, iterator } = Symbol;

const readBlob = async function* (blob) {
  if (blob.stream) {
    yield* blob.stream();
  } else if (blob.arrayBuffer) {
    yield await blob.arrayBuffer();
  } else if (blob[asyncIterator] || blob[iterator]) {
    yield* blob;
  } else if(utils.isReadableStream(blob) && utils.isFunction(blob.getReader)) {
    const reader = blob.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        yield value;
      }
    } finally {
      await reader.cancel();
    }
  } else {
    yield blob;
  }
};

export default readBlob;
