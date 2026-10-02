export const streamChunk = function* (chunk, chunkSize) {
  let len = chunk.byteLength;

  if (!chunkSize || len < chunkSize) {
    yield chunk;
    return;
  }

  let pos = 0;
  let end;

  while (pos < len) {
    end = pos + chunkSize;
    yield chunk.slice(pos, end);
    pos = end;
  }
};

export const readBytes = async function* (iterable, chunkSize) {
  for await (const chunk of readStream(iterable)) {
    yield* streamChunk(chunk, chunkSize);
  }
};

const readStream = (stream) => {
  if (typeof stream.getReader !== 'function') {
    return stream;
  }

  const reader = stream.getReader();
  let done;
  let cancellation;
  let released;
  const release = () => {
    if (!released) {
      released = true;
      reader.releaseLock();
    }
  };

  return {
    async next() {
      if (done) return { done: true };
      try {
        const result = await reader.read();
        if (result.done) {
          done = true;
          release();
        }
        return result;
      } catch (error) {
        done = true;
        release();
        throw error;
      }
    },
    return(reason) {
      if (cancellation) return cancellation;
      if (done) return Promise.resolve({ done: true });
      done = true;
      cancellation = reader.cancel(reason).then(() => ({ done: true }));
      // cancel() closes the stream synchronously even if its cleanup is still pending.
      release();
      return cancellation;
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
};

export const trackStream = (stream, chunkSize, onProgress, onFinish) => {
  const source = typeof stream.getReader === 'function' ? readStream(stream) : null;
  const iterator = readBytes(source || stream, chunkSize);

  let bytes = 0;
  let done;
  let _onFinish = (e) => {
    if (!done) {
      done = true;
      onFinish && onFinish(e);
    }
  };

  return new ReadableStream(
    {
      async pull(controller) {
        try {
          const { done: streamDone, value } = await iterator.next();

          if (done) return;

          if (streamDone) {
            _onFinish();
            controller.close();
            return;
          }

          let len = value.byteLength;
          if (onProgress) {
            let loadedBytes = (bytes += len);
            onProgress(loadedBytes);
          }
          if (!done) controller.enqueue(new Uint8Array(value));
        } catch (err) {
          _onFinish(err);
          throw err;
        }
      },
      cancel(reason) {
        _onFinish(reason);
        // Cancel the reader before closing the generator: a pending read otherwise
        // prevents generator.return() from reaching the source's cancellation.
        return source ? source.return(reason).finally(() => iterator.return()) : iterator.return();
      },
    },
    {
      highWaterMark: 2,
    }
  );
};
