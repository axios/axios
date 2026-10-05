import { describe, it, expect } from 'vitest';
import axios from '../../../index.js';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';

describe('fetch Content-Length rejection cleanup', () => {
  for (const cleanup of ['resolve', 'reject', 'pending']) {
    it(`cancels the body without replacing or delaying the size error when cleanup is ${cleanup}`, async () => {
      let canceled = false;
      const response = new Response(
        new ReadableStream({
          cancel() {
            canceled = true;
            if (cleanup === 'reject') return Promise.reject(new Error('cleanup failed'));
            if (cleanup === 'pending') return new Promise(() => {});
          },
        }),
        { headers: { 'Content-Length': '1000' } }
      );

      await expect(
        axios.get('http://localhost/oversized', {
          adapter: 'fetch',
          maxContentLength: 1,
          env: { fetch: async () => response },
        })
      ).rejects.toMatchObject({
        code: axios.AxiosError.ERR_BAD_RESPONSE,
        message: 'maxContentLength size of 1 exceeded',
      });
      expect(canceled).toBe(true);
    });
  }

  for (const body of [null, {}]) {
    it(`preserves size errors for custom responses ${body ? 'without cancel()' : 'without a body'}`, async () => {
      await expect(
        axios.get('http://localhost/oversized', {
          adapter: 'fetch',
          maxContentLength: 1,
          env: {
            fetch: async () => ({ headers: { 'Content-Length': '1000' }, body }),
          },
        })
      ).rejects.toMatchObject({ code: axios.AxiosError.ERR_BAD_RESPONSE });
    });
  }

  it('closes an unfinished HTTP response after rejecting its declared length', async () => {
    let responseClosed;
    const closed = new Promise((resolve) => {
      responseClosed = resolve;
    });
    const server = await startHTTPServer((req, res) => {
      res.once('close', responseClosed);
      res.writeHead(200, { 'Content-Length': '1000' });
      res.write('first');
    });
    let closeTimeout;

    try {
      await expect(
        axios.get(`http://127.0.0.1:${server.address().port}/`, {
          adapter: 'fetch',
          maxContentLength: 1,
        })
      ).rejects.toMatchObject({ code: axios.AxiosError.ERR_BAD_RESPONSE });
      await Promise.race([
        closed,
        new Promise((resolve, reject) => {
          closeTimeout = setTimeout(() => reject(new Error('response remained open')), 1000);
        }),
      ]);
    } finally {
      clearTimeout(closeTimeout);
      server.closeAllConnections();
      await stopHTTPServer(server);
    }
  });
});
