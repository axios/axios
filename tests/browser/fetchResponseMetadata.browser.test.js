import { describe, it, expect } from 'vitest';
import axios from '../../index.js';

describe('fetch response length metadata', () => {
  for (const [method, status] of [
    ['head', 200],
    ['head', 404],
    ['get', 304],
  ]) {
    for (const responseType of ['text', 'arraybuffer', 'stream']) {
      it(`accepts ${method} ${status} metadata with ${responseType}`, async () => {
        const response = await axios({
          url: new URL('/response-metadata', window.location.href).href,
          adapter: 'fetch',
          method,
          responseType,
          maxContentLength: 0,
          validateStatus: () => true,
          env: {
            async fetch() {
              return new Response(null, { status, headers: { 'Content-Length': '5000' } });
            },
          },
        });
        expect(response.status).toBe(status);
        expect(response.headers.getContentLength()).toBe('5000');
        if (responseType === 'stream') expect(response.data).toBeNull();
        else if (responseType === 'arraybuffer') expect(response.data.byteLength).toBe(0);
        else expect(response.data).toBe('');
      });
    }
  }

  it('still rejects normal GET responses with an oversized declared body', async () => {
    await expect(
      axios.get(new URL('/response-metadata', window.location.href).href, {
        adapter: 'fetch',
        maxContentLength: 1,
        env: {
          async fetch() {
            return new Response('small', { headers: { 'Content-Length': '5000' } });
          },
        },
      })
    ).rejects.toMatchObject({
      code: 'ERR_BAD_RESPONSE',
      message: 'maxContentLength size of 1 exceeded',
    });
  });
});
