import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import axios from '../../../index.js';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';

const BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const payload = { firstName: 'Fred', lastName: 'Flintstone' };

// Node decodes all of these as UTF-8, and the README lists them as equivalent.
const UTF8_SPELLINGS = ['utf8', 'utf-8', 'UTF8', 'UTF-8', 'Utf-8'];

const withBomServer = async (body, fn) => {
  const server = await startHTTPServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(Buffer.concat([BOM, body]));
  });

  try {
    return await fn(`http://localhost:${server.address().port}`);
  } finally {
    await stopHTTPServer(server);
  }
};

describe('HTTP adapter UTF-8 BOM handling for responseEncoding', () => {
  it('parses a BOM-prefixed JSON response when responseEncoding is not set', async () => {
    await withBomServer(Buffer.from(JSON.stringify(payload)), async (url) => {
      const { data } = await axios.get(url, { adapter: 'http', proxy: false });

      assert.deepEqual(data, payload);
    });
  });

  describe.each(UTF8_SPELLINGS)('responseEncoding %s', (responseEncoding) => {
    it('parses a BOM-prefixed JSON response', async () => {
      await withBomServer(Buffer.from(JSON.stringify(payload)), async (url) => {
        const { data } = await axios.get(url, { adapter: 'http', proxy: false, responseEncoding });

        assert.deepEqual(data, payload);
      });
    });

    it('parses a BOM-prefixed JSON response with strict JSON parsing', async () => {
      await withBomServer(Buffer.from(JSON.stringify(payload)), async (url) => {
        const { data } = await axios.get(url, {
          adapter: 'http',
          proxy: false,
          responseEncoding,
          responseType: 'json',
          transitional: { silentJSONParsing: false },
        });

        assert.deepEqual(data, payload);
      });
    });

    it('returns text without the leading BOM', async () => {
      await withBomServer(Buffer.from('hello'), async (url) => {
        const { data } = await axios.get(url, {
          adapter: 'http',
          proxy: false,
          responseEncoding,
          responseType: 'text',
        });

        assert.equal(data, 'hello');
      });
    });

    it('returns data URL text without the leading BOM', async () => {
      // EF BB BF 68 69 is a BOM followed by "hi".
      const { data } = await axios.get('data:text/plain;base64,77u/aGk=', {
        adapter: 'http',
        responseEncoding,
        responseType: 'text',
      });

      assert.equal(data, 'hi');
    });
  });

  describe('responses that must keep their leading bytes', () => {
    it('keeps the BOM bytes of an arraybuffer response', async () => {
      await withBomServer(Buffer.from('hello'), async (url) => {
        const { data } = await axios.get(url, {
          adapter: 'http',
          proxy: false,
          responseEncoding: 'utf-8',
          responseType: 'arraybuffer',
        });

        assert.deepEqual(Buffer.from(data), Buffer.concat([BOM, Buffer.from('hello')]));
      });
    });

    it('does not strip anything when the response is decoded as latin1', async () => {
      await withBomServer(Buffer.from('hello'), async (url) => {
        const { data } = await axios.get(url, {
          adapter: 'http',
          proxy: false,
          responseEncoding: 'latin1',
          responseType: 'text',
        });

        assert.equal(data, 'ï»¿hello');
      });
    });
  });
});
