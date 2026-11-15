import { describe, it, vi } from 'vitest';
import assert from 'assert';
import composeSignals from '../../lib/helpers/composeSignals.js';

describe('helpers::composeSignals', () => {
  const runIfAbortController = typeof AbortController === 'function' ? it : it.skip;

  runIfAbortController('should abort when any of the signals abort', () => {
    let called;

    const controllerA = new AbortController();
    const controllerB = new AbortController();

    const signal = composeSignals([controllerA.signal, controllerB.signal]);

    signal.addEventListener('abort', () => {
      called = true;
    });

    controllerA.abort(new Error('test'));

    assert.ok(called);
  });

  runIfAbortController('should abort immediately when a signal is already aborted', () => {
    const controller = new AbortController();
    const reason = new Error('already aborted');

    controller.abort(reason);

    const signal = composeSignals([controller.signal]);

    try {
      assert.strictEqual(signal.aborted, true);
      assert.strictEqual(signal.reason.message, reason.message);
    } finally {
      signal.unsubscribe();
    }
  });

  runIfAbortController('should abort on timeout', async () => {
    const signal = composeSignals([], 100);

    await new Promise((resolve) => {
      signal.addEventListener('abort', resolve);
    });

    assert.match(String(signal.reason), /timeout of 100ms exceeded/);
  });

  it('should return undefined if signals and timeout are not provided', () => {
    const signal = composeSignals([]);

    assert.strictEqual(signal, undefined);
  });

  describe('timeout and manual cancellation precedence', () => {
    it('keeps the first cancellation reason and clears the pending timeout', async () => {
      vi.useFakeTimers();
      const first = new AbortController();
      const second = new AbortController();
      const removeFirst = vi.spyOn(first.signal, 'removeEventListener');
      const removeSecond = vi.spyOn(second.signal, 'removeEventListener');

      try {
        const signal = composeSignals([first.signal, second.signal], 100);
        first.abort(new Error('manual cancellation'));
        const reason = signal.reason;

        assert.strictEqual(reason.code, 'ERR_CANCELED');
        assert.strictEqual(reason.message, 'manual cancellation');
        assert.strictEqual(vi.getTimerCount(), 0);
        assert.strictEqual(removeFirst.mock.calls.length, 1);
        assert.strictEqual(removeSecond.mock.calls.length, 1);

        second.abort(new Error('later cancellation'));
        await vi.advanceTimersByTimeAsync(200);
        assert.strictEqual(signal.reason, reason);
      } finally {
        vi.useRealTimers();
        vi.restoreAllMocks();
      }
    });

    it('keeps the timeout reason when manual cancellation follows', async () => {
      vi.useFakeTimers();
      const controller = new AbortController();
      const remove = vi.spyOn(controller.signal, 'removeEventListener');

      try {
        const signal = composeSignals([controller.signal], 100);
        await vi.advanceTimersByTimeAsync(100);
        const reason = signal.reason;

        assert.strictEqual(reason.code, 'ETIMEDOUT');
        assert.strictEqual(remove.mock.calls.length, 1);
        controller.abort(new Error('late cancellation'));
        assert.strictEqual(signal.reason, reason);
        assert.strictEqual(vi.getTimerCount(), 0);
      } finally {
        vi.useRealTimers();
        vi.restoreAllMocks();
      }
    });
  });
});
