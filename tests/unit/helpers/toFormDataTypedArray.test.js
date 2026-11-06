import { describe, it } from 'vitest';
import assert from 'assert';
import FormData from 'form-data';
import axios from '../../../index.js';
import toFormData from '../../../lib/helpers/toFormData.js';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';

function multipartBytes(body, boundary) {
  const start = body.indexOf('\r\n\r\n') + 4;
  const end = body.length - Buffer.byteLength(`\r\n--${boundary}--\r\n`);
  return body.subarray(start, end);
}

describe('multipart typed array bytes', () => {
  const fixtures = [
    new Uint8Array([1, 128, 255, 42]),
    new Uint16Array([1, 0x1234, 0xabcd, 42]),
    new Int32Array([1, -123456, 123456, 42]),
    new Float32Array([1, 1.25, -2.5, 42]),
    new Float64Array([1, Math.PI, -2.5, 42]),
    new BigInt64Array([1n, -123456789n, 123456789n, 42n]),
    new BigUint64Array([1n, 123456789n, 987654321n, 42n]),
  ];

  for (const fixture of fixtures) {
    for (const [range, value] of [
      ['full', fixture],
      ['partial', fixture.subarray(1, 3)],
      ['empty', fixture.subarray(1, 1)],
    ]) {
      it(`preserves ${range} ${fixture.constructor.name} bytes in Node FormData`, async () => {
        const expected = Buffer.from(await new Blob([value]).arrayBuffer());
        const form = toFormData({ file: value }, new FormData());

        assert.deepStrictEqual(multipartBytes(form.getBuffer(), form.getBoundary()), expected);
      });
    }
  }

  it('preserves ArrayBuffer payloads', async () => {
    const value = new Uint16Array([0x1234, 0xabcd]).buffer;
    const form = toFormData({ file: value }, new FormData());

    assert.deepStrictEqual(
      multipartBytes(form.getBuffer(), form.getBoundary()),
      Buffer.from(await new Blob([value]).arrayBuffer())
    );
  });

  it('uploads the same view bytes with legacy and native FormData', async () => {
    const value = new Float64Array([0, Math.PI, -2.5, 0]).subarray(1, 3);
    const expected = Buffer.from(await new Blob([value]).arrayBuffer());
    const server = await startHTTPServer((req, res) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        const boundary = /boundary=(.+)$/.exec(req.headers['content-type'])[1];
        res.end(multipartBytes(Buffer.concat(chunks), boundary));
      });
    });

    try {
      for (const FormDataClass of [FormData, globalThis.FormData]) {
        const { data } = await axios.postForm(
          `http://localhost:${server.address().port}`,
          { file: value },
          {
            adapter: 'http',
            proxy: false,
            responseType: 'arraybuffer',
            env: { FormData: FormDataClass },
          }
        );
        assert.deepStrictEqual(data, expected);
      }
    } finally {
      await stopHTTPServer(server);
    }
  });
});
