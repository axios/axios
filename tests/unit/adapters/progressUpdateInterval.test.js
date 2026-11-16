import { afterEach, describe, expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';
import { setImmediate as nextTurn } from 'node:timers/promises';
import axios from '../../../index.js';
import { startHTTPServer, stopHTTPServer } from '../../setup/server.js';

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

describe.each(['http', 'fetch'])('%s progressUpdateIntervalMs', (adapter) => {
  afterEach(() => vi.useRealTimers());

  it.each([50, 1000])('throttles uploads at %i ms and flushes on completion', async (interval) => {
    let received = deferred();
    const server = await startHTTPServer((req, res) => {
      req.on('data', () => received.resolve());
      req.on('end', () => res.end('ok'));
    });
    const input = new Readable({ read() {} });
    const controller = new AbortController();
    let request;
    try {
      vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
      const progress = vi.fn();
      request = axios.post(`http://127.0.0.1:${server.address().port}/`, input, {
        adapter,
        proxy: false,
        maxRedirects: 0,
        signal: controller.signal,
        headers: { 'Content-Length': 3 },
        progressUpdateIntervalMs: interval,
        onUploadProgress: progress,
      });
      request.catch(() => {});
      const push = async (chunk) => {
        received = deferred();
        input.push(chunk);
        await received.promise;
        await nextTurn();
      };

      await push('a');
      expect(progress).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(interval - 1);
      await push('b');
      expect(progress).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(1);
      expect(progress).toHaveBeenCalledTimes(2);
      expect(progress.mock.calls[1][0]).toMatchObject({ loaded: 2, upload: true });
      await push('c');
      input.push(null);
      await request;
      await nextTurn();
      expect(progress).toHaveBeenCalledTimes(3);
      expect(progress.mock.calls[2][0]).toMatchObject({ loaded: 3, upload: true });
      await vi.advanceTimersByTimeAsync(interval);
      expect(progress).toHaveBeenCalledTimes(3);
    } finally {
      controller.abort();
      input.destroy();
      if (request) await request.catch(() => {});
      vi.useRealTimers();
      await stopHTTPServer(server);
    }
  });

  it.each([50, 1000])(
    'throttles downloads at %i ms and flushes on completion',
    async (interval) => {
      const responseReady = deferred();
      const server = await startHTTPServer((req, res) => {
        res.writeHead(200);
        res.flushHeaders();
        responseReady.resolve(res);
      });
      const controller = new AbortController();
      let body;
      try {
        vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
        const progress = vi.fn();
        const { data } = await axios.get(`http://127.0.0.1:${server.address().port}/`, {
          adapter,
          proxy: false,
          maxRedirects: 0,
          signal: controller.signal,
          responseType: 'stream',
          progressUpdateIntervalMs: interval,
          onDownloadProgress: progress,
        });
        body = data;
        const response = await responseReady.promise;
        const reader = adapter === 'fetch' ? data.getReader() : data[Symbol.asyncIterator]();
        const read = () => (adapter === 'fetch' ? reader.read() : reader.next());
        const push = async (chunk) => {
          response.write(chunk);
          expect((await read()).done).toBe(false);
          await nextTurn();
        };

        await push('a');
        expect(progress).toHaveBeenCalledOnce();
        await vi.advanceTimersByTimeAsync(interval - 1);
        await push('b');
        expect(progress).toHaveBeenCalledOnce();
        await vi.advanceTimersByTimeAsync(1);
        expect(progress).toHaveBeenCalledTimes(2);
        expect(progress.mock.calls[1][0]).toMatchObject({ loaded: 2, download: true });
        await push('c');
        response.end();
        expect((await read()).done).toBe(true);
        await nextTurn();
        expect(progress).toHaveBeenCalledTimes(3);
        expect(progress.mock.calls[2][0]).toMatchObject({ loaded: 3, download: true });
        await vi.advanceTimersByTimeAsync(interval);
        expect(progress).toHaveBeenCalledTimes(3);
      } finally {
        controller.abort();
        if (body && adapter === 'http') body.destroy();
        vi.useRealTimers();
        await stopHTTPServer(server);
      }
    }
  );
});
