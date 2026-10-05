import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../../index.js';

describe('HTTP data URL protocol handling', function () {
  it.each(['text', 'arraybuffer', 'stream', 'blob'])(
    'decodes URL-encoded base64 through the HTTP adapter as %s',
    async function (responseType) {
      const response = await axios.get('data:text/plain;base64,TQ%3D%3D', {
        adapter: 'http',
        responseType,
      });

      let data = response.data;
      if (responseType === 'stream') {
        const chunks = [];
        for await (const chunk of data) chunks.push(chunk);
        data = Buffer.concat(chunks);
      } else if (responseType === 'blob') {
        data = Buffer.from(await data.arrayBuffer());
      } else if (responseType === 'text') {
        data = Buffer.from(data);
      }
      assert.deepStrictEqual(data, Buffer.from('M'));
    }
  );

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
