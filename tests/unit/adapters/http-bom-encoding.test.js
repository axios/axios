import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../../index.js';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';

const body = Buffer.from('\uFEFF{"ok":true}');
const encodings = [undefined, 'utf8', 'utf-8', 'UTF8', 'UTF-8', 'uTf-8'];

describe('HTTP response UTF-8 BOM encoding aliases', () => {
  for (const responseEncoding of encodings) {
    it(`parses strict JSON with ${responseEncoding || 'default'} encoding`, async () => {
      const server = await startHTTPServer((_req, res) => res.end(body), { port: 0 });
      try {
        const response = await axios.get(`http://localhost:${server.address().port}`, {
          adapter: 'http',
          proxy: false,
          responseEncoding,
          responseType: 'json',
          transitional: { silentJSONParsing: false },
        });
        assert.deepStrictEqual(response.data, { ok: true });
      } finally {
        await stopHTTPServer(server);
      }
    });

    it(`strips the BOM from data URL text with ${responseEncoding || 'default'} encoding`, async () => {
      const response = await axios.get(`data:text/plain;base64,${body.toString('base64')}`, {
        adapter: 'http',
        responseType: 'text',
        responseEncoding,
        transformResponse: [],
      });
      assert.strictEqual(response.data, '{"ok":true}');
    });
  }

  for (const responseEncoding of ['latin1', 'hex', 'base64', 'utf16le']) {
    it(`preserves data URL text decoded with ${responseEncoding}`, async () => {
      const response = await axios.get(`data:text/plain;base64,${body.toString('base64')}`, {
        adapter: 'http',
        responseType: 'text',
        responseEncoding,
        transformResponse: [],
      });
      assert.strictEqual(response.data, body.toString(responseEncoding));
    });
  }

  for (const responseType of ['arraybuffer', 'stream']) {
    it(`preserves the original BOM bytes in ${responseType} responses`, async () => {
      const server = await startHTTPServer((_req, res) => res.end(body), { port: 0 });
      try {
        const response = await axios.get(`http://localhost:${server.address().port}`, {
          adapter: 'http',
          proxy: false,
          responseEncoding: 'UTF-8',
          responseType,
        });
        const chunks = [];
        if (responseType === 'stream') {
          for await (const chunk of response.data) chunks.push(chunk);
        }
        assert.deepStrictEqual(
          responseType === 'stream' ? Buffer.concat(chunks) : response.data,
          body
        );
      } finally {
        await stopHTTPServer(server);
      }
    });
  }
});
