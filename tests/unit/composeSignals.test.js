import { describe, it } from 'vitest';
import assert from 'assert';
import composeSignals from '../../lib/helpers/composeSignals.js';

describe('helpers::composeSignals', () => {
  const runIfAbortController = typeof AbortController === 'function' ? it : it.skip;
  const waitForAbort = (signal) =>
    new Promise((resolve) => {
      if (signal.aborted) {
        resolve();
        return;
      }
      signal.addEventListener('abort', resolve, { once: true });
    });

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

  runIfAbortController('should abort on timeout', async () => {
    const signal = composeSignals([], 100);

    await waitForAbort(signal);

    assert.match(String(signal.reason), /timeout of 100ms exceeded/);
    assert.strictEqual(signal.reason.code, 'ECONNABORTED');
  });

  runIfAbortController('should use a custom timeout message', async () => {
    const signal = composeSignals([], 100, { timeoutErrorMessage: 'custom timeout' });

    await waitForAbort(signal);

    assert.strictEqual(signal.reason.message, 'custom timeout');
    assert.strictEqual(signal.reason.code, 'ECONNABORTED');
  });

  runIfAbortController('should clarify timeout errors when requested', async () => {
    const signal = composeSignals([], 100, {
      transitional: {
        clarifyTimeoutError: true,
      },
    });

    await waitForAbort(signal);

    assert.match(String(signal.reason), /timeout of 100ms exceeded/);
    assert.strictEqual(signal.reason.code, 'ETIMEDOUT');
  });

  it('should return undefined if signals and timeout are not provided', () => {
    const signal = composeSignals([]);

    assert.strictEqual(signal, undefined);
  });
});
