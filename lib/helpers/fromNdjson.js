'use strict';

/**
 * Parse a newline-delimited JSON response without buffering the full body.
 *
 * @param {AsyncIterable<Uint8Array|string>} source
 * @returns {AsyncGenerator}
 */
export default async function* fromNdjson(source) {
  const decoder = new TextDecoder();
  let buffer = '';

  for await (const chunk of source) {
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
