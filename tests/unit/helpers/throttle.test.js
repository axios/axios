import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import throttle from '../../../lib/helpers/throttle.js';

describe('helpers::throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return an array with throttled function and flush', () => {
    const [throttled, flush] = throttle(() => {}, 10);
    expect(typeof throttled).toBe('function');
    expect(typeof flush).toBe('function');
  });

  it('should invoke function immediately on first call', () => {
    const fn = vi.fn();
    const [throttled] = throttle(fn, 10);

    throttled('a');

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('should throttle subsequent calls within threshold', () => {
    const fn = vi.fn();
    const [throttled] = throttle(fn, 10); // 100ms threshold

    throttled('first');
    throttled('second');
    throttled('third');

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('first');
  });

  it('should invoke with latest args after threshold', () => {
    const fn = vi.fn();
    const [throttled] = throttle(fn, 10); // 100ms threshold

    throttled('first');
    throttled('second');
    throttled('latest');

    // Advance past threshold
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('latest');
  });

  it('should allow calls after threshold expires', () => {
    const fn = vi.fn();
    const [throttled] = throttle(fn, 10); // 100ms threshold

    throttled('first');
    vi.advanceTimersByTime(100);
    throttled('second');

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('second');
  });

  it('should flush pending calls', () => {
    const fn = vi.fn();
    const [throttled, flush] = throttle(fn, 10);

    throttled('first');
    throttled('pending');

    flush();

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('pending');
  });

  it('should not flush if no pending calls', () => {
    const fn = vi.fn();
    const [throttled, flush] = throttle(fn, 10);

    throttled('first');
    flush();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass multiple arguments', () => {
    const fn = vi.fn();
    const [throttled] = throttle(fn, 10);

    throttled('a', 'b', 'c');

    expect(fn).toHaveBeenCalledWith('a', 'b', 'c');
  });
});
