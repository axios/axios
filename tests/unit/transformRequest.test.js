import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../index.js';
import defaults from '../../lib/defaults/index.js';
import AxiosHeaders from '../../lib/core/AxiosHeaders.js';
import { startHTTPServer, stopHTTPServer } from '../setup/server.js';

const transform = (data) => defaults.transformRequest[0].call(defaults, data, new AxiosHeaders());

const bytesOf = (buffer) => Array.from(new Uint8Array(buffer));

describe('transformRequest', () => {
  describe('ArrayBuffer views', () => {
    const backing = () => new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

    const sharedBacking = () => {
      const view = new Uint8Array(new SharedArrayBuffer(8));

      view.set([1, 2, 3, 4, 5, 6, 7, 8]);

      return view;
    };

    it('returns the backing buffer when the view covers all of it', () => {
      const view = backing();

      assert.strictEqual(transform(view), view.buffer);
    });

    it('returns only the bytes of a typed array created with subarray()', () => {
      const result = transform(backing().subarray(2, 5));

      assert.ok(result instanceof ArrayBuffer);
      assert.deepStrictEqual(bytesOf(result), [3, 4, 5]);
    });

    it('returns only the bytes of a view that starts at offset 0 but ends early', () => {
      assert.deepStrictEqual(bytesOf(transform(backing().subarray(0, 3))), [1, 2, 3]);
    });

    it('returns only the bytes of a DataView with an offset', () => {
      const result = transform(new DataView(backing().buffer, 2, 3));

      assert.ok(result instanceof ArrayBuffer);
      assert.deepStrictEqual(bytesOf(result), [3, 4, 5]);
    });

    it('returns only the bytes of a multi-byte typed array with an offset', () => {
      assert.deepStrictEqual(
        bytesOf(transform(new Uint16Array(backing().buffer, 2, 2))),
        [3, 4, 5, 6]
      );
    });

    it('does not modify the backing buffer of a partial view', () => {
      const source = backing();

      new Uint8Array(transform(source.subarray(2, 5))).fill(0);

      assert.deepStrictEqual(Array.from(source), [1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('copies a view that covers a whole SharedArrayBuffer into an ArrayBuffer', () => {
      const result = transform(sharedBacking());

      assert.ok(result instanceof ArrayBuffer);
      assert.deepStrictEqual(bytesOf(result), [1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('copies only the bytes of a partial view on a SharedArrayBuffer into an ArrayBuffer', () => {
      const result = transform(sharedBacking().subarray(2, 5));

      assert.ok(result instanceof ArrayBuffer);
      assert.deepStrictEqual(bytesOf(result), [3, 4, 5]);
    });

    const sources = { ArrayBuffer: backing, SharedArrayBuffer: sharedBacking };

    ['http', 'fetch'].forEach((adapter) => {
      Object.entries(sources).forEach(([kind, source]) => {
        it.skipIf(adapter === 'fetch' && typeof fetch !== 'function')(
          `sends only the viewed bytes of a view on ${kind} through the ${adapter} adapter`,
          async () => {
            const server = await startHTTPServer((req, res) => {
              const chunks = [];

              req.on('data', (chunk) => chunks.push(chunk));
              req.on('end', () => {
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    bytes: Array.from(Buffer.concat(chunks)),
                    contentLength: req.headers['content-length'],
                  })
                );
              });
            });

            try {
              const { data } = await axios.post(
                `http://localhost:${server.address().port}/`,
                source().subarray(2, 5),
                { adapter, proxy: false }
              );

              assert.deepStrictEqual(data.bytes, [3, 4, 5]);
              assert.strictEqual(data.contentLength, '3');
            } finally {
              await stopHTTPServer(server);
            }
          }
        );
      });
    });
  });
});
