const { asyncIterator, iterator } = Symbol;

const readBlob = async function* (blob) {
  if (blob.stream) {
    yield* blob.stream();
  } else if (blob.arrayBuffer) {
    yield await blob.arrayBuffer();
  } else if (blob[asyncIterator] || blob[iterator]) {
    yield* blob;
  } else {
    yield blob;
  }
};

export default readBlob;
