const readBlob = async function *(blob) {
  if (blob.stream) {
    yield* blob.stream()
  } else {
    yield await blob.arrayBuffer()
  }
}

export default readBlob;
