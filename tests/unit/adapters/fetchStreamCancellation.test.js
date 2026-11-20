import { describe, expect, it, vi } from 'vitest';
import axios from '../../../index.js';
import { startHTTPServer, stopHTTPServer, setTimeoutAsync } from '../../setup/server.js';

describe('fetch response stream cancellation', () => {
  it('closes an unfinished HTTP response when a tracked download is canceled', async () => {
    let response;
    let closed = false;
    const server = await startHTTPServer((req, res) => {
      response = res;
      res.on('close', () => {
        closed = true;
      });
      res.write('first chunk');
    });
    let reader;
    let cancellation;

    try {
      const { data } = await axios.get(`http://localhost:${server.address().port}/`, {
        adapter: 'fetch',
        responseType: 'stream',
        onDownloadProgress() {},
      });
      reader = data.getReader();
      const first = await reader.read();
      expect(new TextDecoder().decode(first.value)).toBe('first chunk');
      const pendingRead = reader.read();
      await setTimeoutAsync(0);
      cancellation = reader.cancel('finished');

      await vi.waitFor(() => expect(closed).toBe(true));
      await cancellation;
      expect(await pendingRead).toEqual({ done: true, value: undefined });
    } finally {
      response && response.end();
      await cancellation?.catch(() => {});
      reader && reader.releaseLock();
      await stopHTTPServer(server);
    }
  });
});
