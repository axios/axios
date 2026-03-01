import { describe, it } from 'vitest';
import assert from 'assert';
import composeSignals from '../../lib/helpers/composeSignals.js';

describe('helpers::composeSignals', function () {
  const runIfAbortController = typeof AbortController === 'function' ? it : it.skip;

  runIfAbortController('should abort when any of the signals abort', function () {
    let called;

    const controllerA = new AbortController();
    const controllerB = new AbortController();

    const signal = composeSignals([controllerA.signal, controllerB.signal]);

    signal.addEventListener('abort', function () {
      called = true;
    });

    controllerA.abort(new Error('test'));

    assert.ok(called);
  });

  runIfAbortController('should abort on timeout', async function () {
    const signal = composeSignals([], 100);

    await new Promise(function (resolve) {
      signal.addEventListener('abort', resolve);
    });

    assert.match(String(signal.reason), /timeout of 100ms exceeded/);
  });

  it('should return undefined if signals and timeout are not provided', function () {
    const signal = composeSignals([]);

    assert.strictEqual(signal, undefined);
  });
});
