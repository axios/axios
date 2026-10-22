import { afterEach, describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';
import axios from '../../../index.js';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';

describe.each(['http', 'fetch'])('%s response duration', (adapter) => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([200, 500])('times a buffered response with status %s', async (status) => {
    let now = 1000;
    const server = await startHTTPServer((_req, res) => {
      now += 25;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });

    try {
      vi.spyOn(Date, 'now').mockImplementation(() => now);
      const result = await axios
        .get(`http://localhost:${server.address().port}`, {
          adapter,
          proxy: false,
        })
        .catch((error) => error);

      assert.equal(axios.isAxiosError(result), status === 500);
      const response = status === 500 ? result.response : result;
      assert.equal(response.duration, 25);
      assert.deepEqual(response.data, { ok: true });
    } finally {
      await stopHTTPServer(server);
    }
  });

  it('stops timing when the response stream is available', async () => {
    let now = 1000;
    let serverResponse;
    const server = await startHTTPServer((_req, res) => {
      serverResponse = res;
      now += 25;
      res.writeHead(200);
      res.write('first');
    });

    try {
      vi.spyOn(Date, 'now').mockImplementation(() => now);
      const response = await axios.get(`http://localhost:${server.address().port}`, {
        adapter,
        proxy: false,
        responseType: 'stream',
      });

      assert.equal(serverResponse.writableEnded, false);
      assert.equal(response.duration, 25);
      now += 75;
      serverResponse.end('second');
      const chunks = [];
      for await (const chunk of response.data) chunks.push(Buffer.from(chunk));
      assert.equal(Buffer.concat(chunks).toString(), 'firstsecond');
      assert.equal(response.duration, 25);
    } finally {
      serverResponse?.end();
      await stopHTTPServer(server);
    }
  });
});
