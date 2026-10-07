import { describe, it, vi } from 'vitest';
import assert from 'assert';
import axios from '../../../index.js';

describe('HTTP data URL protocol handling', function () {
  describe.each(['data:', 'DATA:', 'DaTa:'])('%s URLs', (scheme) => {
    describe.each(['base64', 'BASE64', 'bAsE64'])('base64 marker %s', (marker) => {
      it.each(['text', 'arraybuffer', 'stream', 'blob'])(
        'decodes URL-encoded base64 through the HTTP adapter as %s',
        async (responseType) => {
          const response = await axios.get(scheme + 'text/plain;' + marker + ',TQ%3D%3D', {
            adapter: 'http',
            responseType,
            maxContentLength: 1,
          });

          let data = response.data;
          if (responseType === 'stream') {
            const chunks = [];
            for await (const chunk of data) chunks.push(chunk);
            data = Buffer.concat(chunks);
          } else if (responseType === 'blob') {
            assert.strictEqual(data.type, 'text/plain');
            data = Buffer.from(await data.arrayBuffer());
          } else if (responseType === 'text') {
            data = Buffer.from(data);
          }
          assert.deepStrictEqual(data, Buffer.from('M'));
        }
      );

      it.each([0, 1])(
        'rejects encoded data larger than a %s-byte limit',
        async (maxContentLength) => {
          await assert.rejects(
            axios.get(scheme + 'text/plain;' + marker + ',TWE%3D', {
              adapter: 'http',
              maxContentLength,
            }),
            { code: 'ERR_BAD_RESPONSE' }
          );
        }
      );

      it.each(['text', 'arraybuffer', 'stream', 'blob'])(
        'decodes a %s response at maxContentLength',
        async (responseType) => {
          const response = await axios.get(scheme + 'text/plain;' + marker + ',SGVsbG8=', {
            adapter: 'http',
            responseType,
            maxContentLength: 5,
          });

          let data = response.data;
          if (responseType === 'stream') {
            const chunks = [];
            for await (const chunk of data) chunks.push(chunk);
            data = Buffer.concat(chunks);
          } else if (responseType === 'blob') {
            assert.strictEqual(data.type, 'text/plain');
            data = Buffer.from(await data.arrayBuffer());
          } else if (responseType === 'text') {
            data = Buffer.from(data);
          }

          assert.deepStrictEqual(data, Buffer.from('Hello'));
        }
      );

      it.each([0, 4])('rejects a response above a %s-byte limit', async (maxContentLength) => {
        await assert.rejects(
          axios.get(scheme + 'text/plain;' + marker + ',SGVsbG8=', {
            adapter: 'http',
            maxContentLength,
          }),
          { code: 'ERR_BAD_RESPONSE' }
        );
      });

      it.each([
        ['percent-containing body', '%41'.repeat(4096), 3071],
        ['ignored input after padding', 'TQ==' + '%41'.repeat(4096), 3074],
        ['one-byte result with an ignored tail', 'TQ==' + 'A'.repeat(4096), 1],
        ['encoded padding and ignored tail', 'TQ%3D%3D' + '%25'.repeat(4096), 1],
      ])('rejects an oversized allocation for %s before decoding', async (_name, body, limit) => {
        const from = vi.spyOn(Buffer, 'from');

        try {
          await assert.rejects(
            axios.get(scheme + 'text/plain;' + marker + ',' + body, {
              adapter: 'http',
              maxContentLength: limit,
            }),
            { code: 'ERR_BAD_RESPONSE' }
          );
          assert.strictEqual(
            from.mock.calls.some((args) => args[1] === 'base64'),
            false
          );
        } finally {
          from.mockRestore();
        }
      });
    });

    it.each([
      ['Hello', 'Hello', 5],
      ['%E2%82%AC', '\u20ac', 3],
    ])('decodes non-base64 %s at maxContentLength', async (body, expected, limit) => {
      const response = await axios.get(scheme + 'text/plain,' + body, {
        adapter: 'http',
        responseType: 'text',
        maxContentLength: limit,
      });
      assert.strictEqual(response.data, expected);
    });

    it.each([0, 4])(
      'rejects non-base64 input above a %s-byte limit before decoding',
      async (limit) => {
        const from = vi.spyOn(Buffer, 'from');
        try {
          await assert.rejects(
            axios.get(scheme + 'text/plain,Hello', {
              adapter: 'http',
              responseType: 'text',
              maxContentLength: limit,
            }),
            { code: 'ERR_BAD_RESPONSE' }
          );
          assert.strictEqual(
            from.mock.calls.some((args) => args[0] === 'Hello' && args[1] === 'utf8'),
            false
          );
        } finally {
          from.mockRestore();
        }
      }
    );

    it('rejects malformed data URLs', async () => {
      await assert.rejects(axios.get(scheme + 'text/plain', { adapter: 'http' }), {
        code: 'ERR_BAD_REQUEST',
        message: 'Invalid URL',
      });
    });
  });

  it.each(['datax:', 'DATAX:', 'DaTaX:'])('rejects an unsupported prefix %s', async (scheme) => {
    await assert.rejects(axios.get(scheme + 'text/plain,Hello', { adapter: 'http' }), {
      code: 'ERR_BAD_REQUEST',
      message: 'Unsupported protocol datax:',
    });
  });

  it('continues to enforce the byte limit for a supported lowercase protocol', async function () {
    await assert.rejects(
      axios.get('data:text/plain,payload', {
        adapter: 'http',
        maxContentLength: 4,
        responseType: 'text',
      }),
      function (error) {
        return error.code === 'ERR_BAD_RESPONSE';
      }
    );
    const response = await axios.get('data:text/plain,payload', {
      adapter: 'http',
      maxContentLength: 7,
      responseType: 'text',
    });
    assert.strictEqual(response.data, 'payload');
  });
});
