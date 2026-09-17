'use strict';

/**
 * Parse a newline-delimited JSON response without buffering the full body.
 *
 * @param {AsyncIterable<Uint8Array|string>|ReadableStream<Uint8Array>|null} source
 * @returns {AsyncGenerator}
 */
export default async function* fromNdjson(source) {
  if (source == null) {
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let iterable = source;

  if (typeof source[Symbol.asyncIterator] !== 'function' && typeof source.getReader === 'function') {
    iterable = (async function*() {
      const reader = source.getReader();
      try {
        while (true) {
          const result = await reader.read();
          if (result.done) {
            break;
          }
          yield result.value;
        }
      } finally {
        reader.releaseLock && reader.releaseLock();
      }
    })();
  }

  for await (const chunk of iterable) {
    buffer += typeof chunk === 'string' ? chunk : decoder.decode(chunk, {stream: true});

    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.trim()) {
        yield JSON.parse(line);
      }
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    yield JSON.parse(buffer);
  }
}
