import { describe, it, expect, vi, afterEach } from 'vitest';
import composeSignals from '../../../lib/helpers/composeSignals.js';

describe('helpers::composeSignals', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return undefined when no signals and no timeout', () => {
    expect(composeSignals([], 0)).toBeUndefined();
  });

  it('should return undefined for null signals and no timeout', () => {
    expect(composeSignals(null, 0)).toBeUndefined();
  });

  it('should return an AbortSignal when timeout is provided', () => {
    const signal = composeSignals([], 5000);
    expect(signal).toBeDefined();
    expect(signal.aborted).toBe(false);
  });

  it('should abort after timeout', () => {
    vi.useFakeTimers();

    const signal = composeSignals([], 100);
    expect(signal.aborted).toBe(false);

    vi.advanceTimersByTime(100);

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBeDefined();
    expect(signal.reason.code).toBe('ETIMEDOUT');
    expect(signal.reason.message).toBe('timeout of 100ms exceeded');
  });

  it('should compose with an external AbortSignal', () => {
    const controller = new AbortController();
    const signal = composeSignals([controller.signal], 0);

    expect(signal).toBeDefined();
    expect(signal.aborted).toBe(false);

    controller.abort();

    expect(signal.aborted).toBe(true);
  });

  it('should filter out falsy signals', () => {
    const signal = composeSignals([null, undefined, false], 1000);
    expect(signal).toBeDefined();
    expect(signal.aborted).toBe(false);
  });

  it('should return undefined for all-falsy signals and no timeout', () => {
    expect(composeSignals([null, undefined, false], 0)).toBeUndefined();
  });

  it('should have an unsubscribe method on the returned signal', () => {
    const signal = composeSignals([], 5000);
    expect(typeof signal.unsubscribe).toBe('function');
  });

  it('should expose unsubscribe that can be called without error', () => {
    const signal = composeSignals([], 5000);
    expect(() => signal.unsubscribe()).not.toThrow();
  });

  it('should compose multiple abort signals', () => {
    const controller1 = new AbortController();
    const controller2 = new AbortController();
    const signal = composeSignals([controller1.signal, controller2.signal], 0);

    expect(signal.aborted).toBe(false);

    controller2.abort();

    expect(signal.aborted).toBe(true);
  });
});
