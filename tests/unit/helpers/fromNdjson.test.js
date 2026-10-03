import {describe, it, expect} from 'vitest';
import fromNdjson from '../../../lib/helpers/fromNdjson.js';

describe('fromNdjson', () => {
  it('parses records across chunks and supports UTF-8', async () => {
    async function* chunks() {
      yield new TextEncoder().encode('{"message":"caf');
      yield new TextEncoder().encode('é"}\n{"value":2}\n');
    }

    await expect(Array.fromAsync(fromNdjson(chunks()))).resolves.toEqual([
      {message: 'café'},
      {value: 2}
    ]);
  });

  it('ignores blank lines and parses the final record without a newline', async () => {
    async function* chunks() {
      yield '{"first":true}\n\n';
      yield '{"last":true}';
    }

    await expect(Array.fromAsync(fromNdjson(chunks()))).resolves.toEqual([
      {first: true},
      {last: true}
    ]);
  });

  it('treats a null body as an empty response', async () => {
    await expect(Array.fromAsync(fromNdjson(null))).resolves.toEqual([]);
  });

  it('cancels and releases streams read through getReader', async () => {
    const chunks = [new TextEncoder().encode('{"value":1}\n')];
    let canceled = false;
    let released = false;
    const stream = {
      getReader() {
        return {
          read: async () => chunks.length
            ? {done: false, value: chunks.shift()}
            : {done: true},
          cancel: async () => {
            canceled = true;
          },
          releaseLock() {
            released = true;
          }
        };
      }
    };

    await expect(Array.fromAsync(fromNdjson(stream))).resolves.toEqual([{value: 1}]);
    expect(canceled).toBe(true);
    expect(released).toBe(true);
  });
});
