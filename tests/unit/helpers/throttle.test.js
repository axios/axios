import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import throttle from '../../../lib/helpers/throttle.js';

describe('helpers::throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should flush the last pending arguments', () => {
    const listener = vi.fn();
    const [throttled, flush] = throttle(listener, 1);

    throttled('first');
    throttled('pending');
    flush('ignored lifecycle argument');
    vi.runAllTimers();

    expect(listener.mock.calls).toEqual([['first'], ['pending']]);
  });

  it('should replace pending arguments only through the explicit force function', () => {
    const listener = vi.fn();
    const [throttled, flush, force] = throttle(listener, 1);

    throttled('first');
    throttled('pending');
    force('replacement');
    flush();
    vi.runAllTimers();

    expect(listener.mock.calls).toEqual([['first'], ['replacement']]);
  });
});
