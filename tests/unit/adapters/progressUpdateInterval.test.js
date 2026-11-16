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

describe.each([0, 5])('HTTP upload cancellation (maxRedirects: %i)', (maxRedirects) => {
  it.each(['signal', 'cancelToken'])('clears pending progress on %s cancellation', async (mode) => {
    let received = deferred();
    const server = await startHTTPServer((req) => {
      req.on('data', () => received.resolve());
    });
    const input = new Readable({ read() {} });
    const controller = new AbortController();
    const source = axios.CancelToken.source();
    let request;
    try {
      vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
      const progress = vi.fn();
      request = axios.post(`http://127.0.0.1:${server.address().port}/`, input, {
        adapter: 'http',
        proxy: false,
        maxRedirects,
        ...(mode === 'signal' ? { signal: controller.signal } : { cancelToken: source.token }),
        progressUpdateIntervalMs: 2147483647,
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
      const transportTimers = vi.getTimerCount();
      await push('b');
      expect(progress).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(transportTimers + 1);
      if (mode === 'signal') controller.abort();
      else source.cancel();
      await expect(request).rejects.toMatchObject({ code: 'ERR_CANCELED' });
      await nextTurn();
      expect(vi.getTimerCount()).toBe(0);
      input.push('c');
      await nextTurn();
      expect(vi.getTimerCount()).toBe(0);
      await vi.advanceTimersByTimeAsync(2147483647);
      expect(progress).toHaveBeenCalledOnce();
    } finally {
      controller.abort();
      source.cancel();
      input.destroy();
      if (request) await request.catch(() => {});
      vi.clearAllTimers();
      vi.useRealTimers();
      await stopHTTPServer(server);
    }
  });
});

describe.each([
  { maxRedirects: 0, redirect: false },
  { maxRedirects: 5, redirect: false },
  { maxRedirects: 5, redirect: true },
])('HTTP early response ($maxRedirects, redirect: $redirect)', ({ maxRedirects, redirect }) => {
  it.each(['text', 'stream'])(
    'clears upload timers when the %s request closes',
    async (responseType) => {
      let received = deferred();
      const responseReady = deferred();
      const server = await startHTTPServer((req, res) => {
        if (req.url === '/redirect') {
          req.once('data', () => {
            res.writeHead(307, { Location: '/' });
            res.end();
          });
          return;
        }
        req.on('data', () => received.resolve());
        responseReady.resolve(res);
      });
      const input = new Readable({ read() {} });
      const controller = new AbortController();
      let request;
      try {
        vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
        const progress = vi.fn();
        request = axios.post(
          `http://127.0.0.1:${server.address().port}/${redirect ? 'redirect' : ''}`,
          input,
          {
            adapter: 'http',
            proxy: false,
            maxRedirects,
            responseType,
            signal: controller.signal,
            headers: { 'Content-Length': 3 },
            progressUpdateIntervalMs: 2147483647,
            onUploadProgress: progress,
          }
        );
        request.catch(() => {});
        const push = async (chunk) => {
          received = deferred();
          input.push(chunk);
          await received.promise;
          await nextTurn();
        };
        await push('a');
        expect(progress).toHaveBeenCalledOnce();
        const transportTimers = vi.getTimerCount();
        await push('b');
        expect(vi.getTimerCount()).toBe(transportTimers + 1);
        const res = await responseReady.promise;
        res.setHeader('Connection', 'close');
        res.end('ok');
        const response = await request;
        const closed = response.request.closed
          ? Promise.resolve()
          : new Promise((resolve) => response.request.once('close', resolve));
        if (responseType === 'stream') {
          let body = '';
          for await (const chunk of response.data) body += chunk;
          expect(body).toBe('ok');
        } else {
          expect(response.data).toBe('ok');
        }
        await closed;
        await nextTurn();
        expect(vi.getTimerCount()).toBe(0);
        expect(progress).toHaveBeenCalledTimes(2);
        expect(progress.mock.calls[1][0]).toMatchObject({ loaded: 2, upload: true });
        input.push('c');
        await nextTurn();
        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(2147483647);
        expect(progress).toHaveBeenCalledTimes(2);
      } finally {
        controller.abort();
        input.destroy();
        if (request) await request.catch(() => {});
        vi.clearAllTimers();
        vi.useRealTimers();
        await stopHTTPServer(server);
      }
    }
  );
});

describe('HTTP/2 upload progress', () => {
  it.each(['text', 'stream'])('continues after an early %s response ends', async (responseType) => {
    let received = deferred();
    const uploadEnded = deferred();
    const server = await startHTTPServer(
      (req, res) => {
        req.on('data', () => received.resolve());
        req.on('end', () => uploadEnded.resolve());
        res.end('ok');
      },
      { useHTTP2: true }
    );
    const input = new Readable({ read() {} });
    const controller = new AbortController();
    let request;
    try {
      vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
      const progress = vi.fn();
      request = axios.post(`https://localhost:${server.address().port}/`, input, {
        adapter: 'http',
        proxy: false,
        httpVersion: 2,
        http2Options: { rejectUnauthorized: false },
        signal: controller.signal,
        responseType,
        headers: { 'Content-Length': 3 },
        progressUpdateIntervalMs: 1000,
        onUploadProgress: progress,
      });
      request.catch(() => {});
      input.push('a');
      await received.promise;
      const response = await request;
      if (responseType === 'stream') {
        let body = '';
        for await (const chunk of response.data) {
          body += chunk;
        }
        expect(body).toBe('ok');
      } else {
        expect(response.data).toBe('ok');
      }
      await nextTurn();
      expect(progress).toHaveBeenCalledOnce();
      received = deferred();
      input.push('b');
      await received.promise;
      await vi.advanceTimersByTimeAsync(1000);
      expect(progress).toHaveBeenCalledTimes(2);
      expect(progress.mock.calls[1][0]).toMatchObject({ loaded: 2, upload: true });
      input.push('c');
      input.push(null);
      await uploadEnded.promise;
      await nextTurn();
      expect(progress).toHaveBeenCalledTimes(3);
      expect(progress.mock.calls[2][0]).toMatchObject({ loaded: 3, upload: true, progress: 1 });
    } finally {
      controller.abort();
      input.destroy();
      if (request) await request.catch(() => {});
      server.closeAllSessions();
      vi.clearAllTimers();
      vi.useRealTimers();
      await stopHTTPServer(server);
    }
  });
});

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
