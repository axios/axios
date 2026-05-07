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
});
