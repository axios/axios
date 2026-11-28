import { describe, it, expect, vi } from 'vitest';
import composeSignals from '../../../lib/helpers/composeSignals.js';

describe('helpers::composeSignals', () => {
  it('registers abort listeners as once-only listeners', () => {
    const controller = new AbortController();
    const calls = [];
    const nativeAdd = controller.signal.addEventListener.bind(controller.signal);

    controller.signal.addEventListener = (type, fn, options) => {
      calls.push({ type, options });
      return nativeAdd(type, fn, options);
    };

    const signal = composeSignals([controller.signal]);

    try {
      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual({ type: 'abort', options: { once: true } });
    } finally {
      signal.unsubscribe();
    }
  });

  it('caps timers that exceed the 32-bit signed integer limit', () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    const signal = composeSignals([], 2147483648);

    try {
      expect(setTimeoutSpy.mock.lastCall[1]).toBe(2147483647);
    } finally {
      signal.unsubscribe();
      setTimeoutSpy.mockRestore();
    }
  });
});
