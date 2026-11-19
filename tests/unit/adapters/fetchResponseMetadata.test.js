import { describe, it, expect } from 'vitest';
import axios from '../../../index.js';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';

describe('fetch response length metadata', () => {
  for (const adapter of ['http', 'fetch']) {
    for (const [method, status] of [
      ['head', 200],
      ['head', 404],
      ['get', 304],
    ]) {
      for (const responseType of ['text', 'arraybuffer', 'stream']) {
        it(`${adapter}: accepts ${method} ${status} metadata with ${responseType}`, async () => {
          const server = await startHTTPServer((_req, res) => {
            res.writeHead(status, { 'Content-Length': '5000' });
            res.end();
          });
          try {
            const response = await axios({
              url: `http://localhost:${server.address().port}/`,
              method,
              adapter,
              responseType,
              maxContentLength: 0,
              validateStatus: () => true,
              proxy: false,
            });
            expect(response.status).toBe(status);
            expect(response.headers.getContentLength()).toBe('5000');
            if (responseType === 'stream') {
              if (response.data) {
                for await (const chunk of response.data) expect(chunk.length).toBe(0);
              }
            } else if (responseType === 'arraybuffer') {
              expect(response.data.byteLength).toBe(0);
            } else {
              expect(response.data).toBe('');
            }
          } finally {
            await stopHTTPServer(server);
          }
        });
      }
    }
  }

  it('still rejects a 304 using validateStatus rather than the metadata length', async () => {
    const server = await startHTTPServer((_req, res) => {
      res.writeHead(304, { 'Content-Length': '5000' });
      res.end();
    });
    try {
      await expect(
        axios.get(`http://localhost:${server.address().port}/`, {
          adapter: 'fetch',
          maxContentLength: 0,
        })
      ).rejects.toMatchObject({
        message: 'Request failed with status code 304',
        response: { status: 304, data: '' },
      });
    } finally {
      await stopHTTPServer(server);
    }
  });

  for (const body of ['small', null]) {
    it(`still checks a normal GET's declared length with ${body === null ? 'no exposed' : 'an exposed'} body`, async () => {
      await expect(
        axios.get('http://localhost/metadata-limit', {
          adapter: 'fetch',
          maxContentLength: 1,
          env: {
            async fetch() {
              return new Response(body, { headers: { 'Content-Length': '5000' } });
            },
          },
        })
      ).rejects.toMatchObject({
        code: 'ERR_BAD_RESPONSE',
        message: 'maxContentLength size of 1 exceeded',
      });
    });
  }

  it('keeps length checks in custom environments without Response support', async () => {
    await expect(
      axios.get('http://localhost/metadata-limit', {
        adapter: 'fetch',
        maxContentLength: 1,
        env: {
          Response: null,
          async fetch() {
            return {
              status: 200,
              headers: { 'content-length': '5000' },
              text: async () => 'small',
            };
          },
        },
      })
    ).rejects.toMatchObject({
      code: 'ERR_BAD_RESPONSE',
      message: 'maxContentLength size of 1 exceeded',
    });
  });
});
