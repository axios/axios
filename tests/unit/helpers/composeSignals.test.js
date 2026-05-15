import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import composeSignals from '../../../lib/helpers/composeSignals.js';
import AxiosError from '../../../lib/core/AxiosError.js';
import CanceledError from '../../../lib/cancel/CanceledError.js';

describe('helpers::composeSignals', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should use ECONNABORTED as default timeout error code (parity with xhr/http)', () => {
    const signal = composeSignals([], 1000);

    vi.advanceTimersByTime(1000);

    // abort should have fired synchronously
    expect(signal).toBeDefined();
    expect(signal.aborted).toBe(true);
    const reason = signal.reason;
    expect(reason).toBeInstanceOf(AxiosError);
    expect(reason.code).toBe(AxiosError.ECONNABORTED);
    expect(reason.message).toBe('timeout of 1000ms exceeded');
  });

  it('should support custom timeoutErrorMessage', () => {
    const customMessage = 'Request timed out, please try again';
    const signal = composeSignals([], 5000, {
      timeoutErrorMessage: customMessage
    });

    vi.advanceTimersByTime(5000);

    expect(signal.aborted).toBe(true);
    expect(signal.reason.message).toBe(customMessage);
  });

  it('should use ETIMEDOUT when transitional.clarifyTimeoutError is true', () => {
    const signal = composeSignals([], 2000, {
      transitional: { clarifyTimeoutError: true }
    });

    vi.advanceTimersByTime(2000);

    expect(signal.aborted).toBe(true);
    expect(signal.reason.code).toBe(AxiosError.ETIMEDOUT);
  });

  it('should not create a signal when no timeout and no signals are provided', () => {
    const signal = composeSignals([], 0);
    expect(signal).toBeUndefined();
  });

  it('should compose external abort signals', () => {
    const controller = new AbortController();
    const signal = composeSignals([controller.signal], 5000);

    controller.abort(new Error('User aborted'));

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBeInstanceOf(CanceledError);
  });

  it('should handle listener race condition (synchronous abort after signal creation)', () => {
    const controller1 = new AbortController();
    const controller2 = new AbortController();

    const signal1 = composeSignals([controller1.signal], 10000);
    const signal2 = composeSignals([controller2.signal], 10000);

    // Both listeners should be attached synchronously
    controller1.abort();

    expect(signal1.aborted).toBe(true);
    // signal2 should NOT be aborted yet
    expect(signal2.aborted).toBe(false);

    controller2.abort();
    expect(signal2.aborted).toBe(true);
  });

  it('should clear timeout after external abort', () => {
    const controller = new AbortController();
    const signal = composeSignals([controller.signal], 5000);

    controller.abort();

    // Advance past the timeout — should NOT trigger another abort
    vi.advanceTimersByTime(5000);

    // Should still only have the first abort reason
    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBeInstanceOf(CanceledError);
  });
});
