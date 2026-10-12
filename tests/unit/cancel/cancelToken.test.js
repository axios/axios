import { describe, expect, it, vi } from 'vitest';

import CancelToken from '../../../lib/cancel/CancelToken.js';

describe('CancelToken listener cleanup', () => {
  it('notifies a listener once when it unsubscribes an earlier listener', async () => {
    const { token, cancel } = CancelToken.source();
    const removed = vi.fn();
    const remaining = vi.fn();
    const cleanup = vi.fn(() => token.unsubscribe(removed));

    token.subscribe(removed);
    token.subscribe(remaining);
    token.subscribe(cleanup);
    cancel('stop');
    await Promise.resolve();

    expect(cleanup).toHaveBeenCalledExactlyOnceWith(token.reason);
    expect(remaining).toHaveBeenCalledExactlyOnceWith(token.reason);
    expect(removed).not.toHaveBeenCalled();
  });

  it('preserves reverse subscription order and self-unsubscription', async () => {
    const { token, cancel } = CancelToken.source();
    const calls = [];
    const first = () => calls.push('first');
    const second = () => {
      calls.push('second');
      token.unsubscribe(second);
    };

    token.subscribe(first);
    token.subscribe(second);
    cancel();
    await Promise.resolve();
    cancel();
    await Promise.resolve();

    expect(calls).toEqual(['second', 'first']);
    expect(token._listeners).toBeNull();
  });

  it('continues canceling signals when an abort handler cleans up multiple subscriptions', async () => {
    const { token, cancel } = CancelToken.source();
    const removed = token.toAbortSignal();
    const remaining = token.toAbortSignal();
    const cleanup = token.toAbortSignal();
    cleanup.addEventListener('abort', () => {
      removed.unsubscribe();
      cleanup.unsubscribe();
    });

    cancel('stop');
    await Promise.resolve();

    expect(cleanup.aborted).toBe(true);
    expect(remaining.aborted).toBe(true);
    expect(remaining.reason).toBe(token.reason);
    expect(removed.aborted).toBe(false);
  });

  it('still notifies listeners subscribed after cancellation immediately', async () => {
    const { token, cancel } = CancelToken.source();
    const late = vi.fn();
    token.subscribe(() => token.subscribe(late));
    cancel('stop');
    await Promise.resolve();

    expect(late).toHaveBeenCalledExactlyOnceWith(token.reason);
  });
});
