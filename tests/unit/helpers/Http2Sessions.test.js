import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'events';
import http2 from 'http2';
import Http2Sessions from '../../../lib/helpers/Http2Sessions.js';

function createFakeSession() {
  const session = new EventEmitter();
  session.destroyed = false;
  session.closed = false;
  session.close = vi.fn(() => {
    session.closed = true;
    session.emit('close');
  });
  const originalRequest = vi.fn(() => {
    const stream = new EventEmitter();
    stream.endStream = vi.fn();
    return stream;
  });
  session.request = originalRequest;
  session._originalRequest = originalRequest;
  return session;
}

describe('helpers::Http2Sessions', () => {
  let connectSpy;
  let pool;

  beforeEach(() => {
    connectSpy = vi.spyOn(http2, 'connect').mockImplementation(() => createFakeSession());
    pool = new Http2Sessions();
  });

  afterEach(() => {
    connectSpy.mockRestore();
    vi.useRealTimers();
  });

  it('reuses a cached session for the same authority and options', () => {
    const a = pool.getSession('https://example.test', { sessionTimeout: 1000 });
    const b = pool.getSession('https://example.test', { sessionTimeout: 1000 });

    expect(a).toBe(b);
    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it('creates a separate session for a different authority', () => {
    pool.getSession('https://example.test');
    pool.getSession('https://other.test');

    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  it('creates a new session when options differ for the same authority', () => {
    pool.getSession('https://example.test', { sessionTimeout: 1000 });
    pool.getSession('https://example.test', { sessionTimeout: 5000 });

    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  it('does not reuse a destroyed session', () => {
    const first = pool.getSession('https://example.test');
    first.destroyed = true;

    const second = pool.getSession('https://example.test');

    expect(second).not.toBe(first);
    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  it('does not reuse a closed session', () => {
    const first = pool.getSession('https://example.test');
    first.closed = true;

    const second = pool.getSession('https://example.test');

    expect(second).not.toBe(first);
    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  it('drops a session from the pool when its close event fires', () => {
    const first = pool.getSession('https://example.test');
    first.emit('close');

    const second = pool.getSession('https://example.test');

    expect(second).not.toBe(first);
    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  it('drops a session from the pool when it receives a GOAWAY event', () => {
    const first = pool.getSession('https://example.test');
    first.emit('goaway');

    const second = pool.getSession('https://example.test');

    expect(second).not.toBe(first);
    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  it('does not start an idle timer when streams finish after GOAWAY', () => {
    vi.useFakeTimers();
    const session = pool.getSession('https://example.test');
    const firstStream = session.request();
    const secondStream = session.request();

    // Real HTTP/2 sessions remain open until their existing streams drain.
    session.close.mockImplementation(() => {
      session.closed = true;
    });
    session.emit('goaway');

    const replacement = pool.getSession('https://example.test');
    expect(replacement).not.toBe(session);

    firstStream.emit('close');
    expect(vi.getTimerCount()).toBe(0);

    secondStream.emit('close');
    expect(vi.getTimerCount()).toBe(0);

    session.emit('close');
    expect(vi.getTimerCount()).toBe(0);
    expect(session.close).toHaveBeenCalledTimes(1);
    expect(pool.getSession('https://example.test')).toBe(replacement);
  });

  it('cancels an existing idle timer when GOAWAY arrives', () => {
    vi.useFakeTimers();
    const session = pool.getSession('https://example.test');
    session.request().emit('close');
    expect(vi.getTimerCount()).toBe(1);

    session.emit('goaway');

    expect(vi.getTimerCount()).toBe(0);
    expect(pool.getSession('https://example.test')).not.toBe(session);
  });

  it('removes a session after GOAWAY when idle expiry is disabled', () => {
    const options = { sessionTimeout: null };
    const session = pool.getSession('https://example.test', options);

    session.emit('goaway');

    expect(pool.getSession('https://example.test', options)).not.toBe(session);
    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  it('handles a session error and removes the failed session', () => {
    const first = pool.getSession('https://example.test');

    expect(() => first.emit('error', new Error('connection failed'))).not.toThrow();

    const second = pool.getSession('https://example.test');

    expect(second).not.toBe(first);
    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  it('keeps unrelated authorities cached when one session closes', () => {
    const first = pool.getSession('https://example.test');
    const other = pool.getSession('https://other.test');
    first.emit('close');

    const otherAgain = pool.getSession('https://other.test');

    expect(otherAgain).toBe(other);
    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  it('closes and removes the session after sessionTimeout once the last stream ends', () => {
    vi.useFakeTimers();
    const session = pool.getSession('https://example.test', { sessionTimeout: 1000 });

    const stream = session.request();
    stream.emit('close');

    expect(session.closed).toBe(false);

    vi.advanceTimersByTime(1000);

    expect(session.close).toHaveBeenCalledTimes(1);

    const next = pool.getSession('https://example.test', { sessionTimeout: 1000 });
    expect(next).not.toBe(session);
    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  it('cancels the pending sessionTimeout when a new stream opens', () => {
    vi.useFakeTimers();
    const session = pool.getSession('https://example.test', { sessionTimeout: 1000 });

    const first = session.request();
    first.emit('close');

    session.request();
    vi.advanceTimersByTime(5000);

    expect(session.close).not.toHaveBeenCalled();
  });

  it('keeps the session alive while streams are still open', () => {
    vi.useFakeTimers();
    const session = pool.getSession('https://example.test', { sessionTimeout: 1000 });

    const a = session.request();
    const b = session.request();
    a.emit('close');

    vi.advanceTimersByTime(5000);

    expect(session.close).not.toHaveBeenCalled();

    b.emit('close');
    vi.advanceTimersByTime(1000);

    expect(session.close).toHaveBeenCalledTimes(1);
  });

  it('defaults sessionTimeout to 1000ms when no options are passed', () => {
    vi.useFakeTimers();
    const session = pool.getSession('https://example.test');

    const stream = session.request();
    stream.emit('close');

    vi.advanceTimersByTime(999);
    expect(session.close).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(session.close).toHaveBeenCalledTimes(1);
  });

  it('installs a request wrapper when sessionTimeout is set', () => {
    const session = pool.getSession('https://example.test', { sessionTimeout: 1000 });

    expect(session.request).not.toBe(session._originalRequest);
  });

  it('does not install the request wrapper when sessionTimeout is null', () => {
    const session = pool.getSession('https://example.test', { sessionTimeout: null });

    expect(session.request).toBe(session._originalRequest);
  });

  it('cancels the pending idle timer when the session itself closes', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const session = pool.getSession('https://example.test', { sessionTimeout: 1000 });

    const stream = session.request();
    stream.emit('close');
    // An idle-removal timer is now pending.

    clearTimeoutSpy.mockClear();
    session.emit('close');

    // Closing the session must cancel the pending idle timer; otherwise it
    // keeps Node's event loop refed for up to sessionTimeout ms past close.
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  describe('closeAll', () => {
    it('closes all pooled sessions across authorities and empties the pool', async () => {
      const first = pool.getSession('https://example.test');
      const second = pool.getSession('https://other.test');

      await pool.closeAll();

      expect(first.close).toHaveBeenCalledTimes(1);
      expect(second.close).toHaveBeenCalledTimes(1);
      expect(pool.sessions['https://example.test']).toBeUndefined();
      expect(pool.sessions['https://other.test']).toBeUndefined();
    });

    it('closes every pooled session when an authority holds several', async () => {
      const first = pool.getSession('https://example.test', { sessionTimeout: 500 });
      const second = pool.getSession('https://example.test', { sessionTimeout: 2000 });

      expect(first).not.toBe(second);

      await pool.closeAll();

      expect(first.close).toHaveBeenCalledTimes(1);
      expect(second.close).toHaveBeenCalledTimes(1);
      expect(pool.sessions['https://example.test']).toBeUndefined();
    });

    it('awaits sessions that are already closing without closing them again', async () => {
      const session = pool.getSession('https://example.test');
      // Node marks closed as soon as close() is requested, even while
      // in-flight streams are still draining.
      session.closed = true;
      setImmediate(() => session.emit('close'));

      let resolved = false;
      const shutdown = pool.closeAll().then(() => {
        resolved = true;
      });

      expect(session.close).not.toHaveBeenCalled();

      await Promise.resolve();
      expect(resolved).toBe(false);

      await shutdown;
      expect(resolved).toBe(true);
      expect(pool.sessions['https://example.test']).toBeUndefined();
    });

    it('skips destroyed sessions', async () => {
      const session = pool.getSession('https://example.test');
      session.destroyed = true;

      await pool.closeAll();

      expect(session.close).not.toHaveBeenCalled();
      expect(pool.sessions['https://example.test']).toBeUndefined();
    });

    it('resolves only after every session emits close', async () => {
      const first = pool.getSession('https://example.test');
      const second = pool.getSession('https://other.test');

      for (const session of [first, second]) {
        session.close = vi.fn(() => {
          session.closed = true;
          setImmediate(() => session.emit('close'));
        });
      }

      let resolved = false;
      const shutdown = pool.closeAll().then(() => {
        resolved = true;
      });

      expect(first.close).toHaveBeenCalledTimes(1);
      expect(second.close).toHaveBeenCalledTimes(1);

      await Promise.resolve();
      expect(resolved).toBe(false);

      await shutdown;
      expect(resolved).toBe(true);
      expect(pool.sessions['https://example.test']).toBeUndefined();
      expect(pool.sessions['https://other.test']).toBeUndefined();
    });

    it('allows new sessions after a shutdown', async () => {
      const first = pool.getSession('https://example.test');

      await pool.closeAll();

      const second = pool.getSession('https://example.test');

      expect(second).not.toBe(first);
      expect(connectSpy).toHaveBeenCalledTimes(2);
    });

    it('resolves with an empty pool and returns a promise', async () => {
      const result = pool.closeAll();

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });

    it('is safe to call twice', async () => {
      const session = pool.getSession('https://example.test');

      await pool.closeAll();
      await pool.closeAll();

      expect(session.close).toHaveBeenCalledTimes(1);
      expect(pool.sessions['https://example.test']).toBeUndefined();
    });

    it('does not schedule an idle timer for a session removed by a shutdown', () => {
      vi.useFakeTimers();
      const session = pool.getSession('https://example.test', { sessionTimeout: 1000 });
      const stream = session.request();

      pool.closeAll();

      expect(session.close).toHaveBeenCalledTimes(1);

      stream.emit('close');
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
