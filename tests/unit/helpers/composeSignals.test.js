import { describe, it, expect } from 'vitest';
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
});
