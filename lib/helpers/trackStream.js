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

const readStream = async function* (stream) {
  if (stream[Symbol.asyncIterator]) {
    yield* stream;
    return;
  }

  const reader = stream.getReader();
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
};

export const trackStream = (stream, chunkSize, onProgress, onFinish) => {
  // An async generator's return() waits behind a pending next(). Own the Web
  // Stream reader so cancellation can interrupt that read directly.
  const reader = typeof stream.getReader === 'function' ? stream.getReader() : null;
  const iterable = reader
    ? {
        [Symbol.asyncIterator]: () => ({ next: () => reader.read() }),
      }
    : stream;
  const iterator = readBytes(iterable, chunkSize);

  let bytes = 0;
  let done;
  let canceled;
  let released;
  const releaseReader = () => {
    if (reader && !released) {
      released = true;
      reader.releaseLock();
    }
  };
  const cancelSource = async (reason) => {
    if (reader) {
      try {
        return reader.cancel(reason);
      } finally {
        releaseReader();
        iterator.return().catch(() => {});
      }
    }
    return iterator.return();
  };
  let _onFinish = (e) => {
    if (!done) {
      done = true;
      releaseReader();
      onFinish && onFinish(e);
    }
  };

  return new ReadableStream(
    {
      async pull(controller) {
        try {
          const { done, value } = await iterator.next();

          if (canceled) {
            return;
          }

          if (done) {
            _onFinish();
            controller.close();
            return;
          }

          let len = value.byteLength;
          if (onProgress) {
            let loadedBytes = (bytes += len);
            onProgress(loadedBytes);
          }
          controller.enqueue(new Uint8Array(value));
        } catch (err) {
          if (canceled) {
            return;
          }

          // Cleanup must not delay or replace a source/progress error.
          cancelSource().catch(() => {});
          _onFinish(err);
          throw err;
        }
      },
      cancel(reason) {
        canceled = true;
        const cancellation = cancelSource(reason);
        _onFinish(reason);
        return cancellation;
      },
    },
    {
      highWaterMark: 2,
    }
  );
};
