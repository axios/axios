'use strict';

import AxiosError from '../core/AxiosError.js';

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

  // Only binary chunks need a decoder; string chunks parse in runtimes without
  // a global TextDecoder.
  let decoder;
  const decode = (chunk) => {
    if (!decoder) {
      if (typeof TextDecoder !== 'function') {
        throw new AxiosError(
          'NDJSON responses with binary chunks require TextDecoder',
          AxiosError.ERR_NOT_SUPPORT
        );
      }
      decoder = new TextDecoder();
    }
    return decoder.decode(chunk, {stream: true});
  };
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
        try {
          await reader.cancel();
        } catch (_err) {
          // The underlying stream may already be closed when cancellation runs.
        }
        reader.releaseLock && reader.releaseLock();
      }
    })();
  }

  for await (const chunk of iterable) {
    buffer += typeof chunk === 'string' ? chunk : decode(chunk);

    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.trim()) {
        yield JSON.parse(line);
      }
    }
  }

  if (decoder) {
    buffer += decoder.decode();
  }
  if (buffer.trim()) {
    yield JSON.parse(buffer);
  }
}
