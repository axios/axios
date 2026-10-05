import { describe, it, vi } from 'vitest';
import assert from 'assert';
import axios from '../../../index.js';

describe('HTTP data URL protocol handling', function () {
  describe.each(['base64', 'BASE64', 'bAsE64'])('base64 marker %s', (marker) => {
    it.each(['text', 'arraybuffer', 'stream', 'blob'])(
      'decodes a %s response at maxContentLength',
      async (responseType) => {
        const response = await axios.get('data:text/plain;' + marker + ',SGVsbG8=', {
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
        axios.get('data:text/plain;' + marker + ',SGVsbG8=', {
          adapter: 'http',
          maxContentLength,
        }),
        { code: 'ERR_BAD_RESPONSE' }
      );
    });

    it.each([
      ['percent-containing body', '%41'.repeat(4096), 4096],
      ['ignored input after padding', 'TQ==' + '%41'.repeat(4096), 4100],
    ])('rejects an oversized allocation for %s before decoding', async (_name, body, limit) => {
      const from = vi.spyOn(Buffer, 'from');

      try {
        await assert.rejects(
          axios.get('data:text/plain;' + marker + ',' + body, {
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

  ['DATA:', 'DaTa:'].forEach(function (scheme) {
    [0, 4, 16].forEach(function (maxContentLength) {
      it(
        'retains the unsupported ' + scheme + ' error with limit ' + maxContentLength,
        async function () {
          await assert.rejects(
            axios.get(scheme + 'text/plain,payload', {
              adapter: 'http',
              maxContentLength,
              responseType: 'text',
            }),
            function (error) {
              return (
                error.code === 'ERR_BAD_REQUEST' &&
                error.message === 'Unsupported protocol ' + scheme.slice(0, -1)
              );
            }
          );
        }
      );
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
