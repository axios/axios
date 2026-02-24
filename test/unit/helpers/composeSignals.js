import assert from 'assert';
import composeSignals from '../../../lib/helpers/composeSignals.js';

describe('helpers::composeSignals', () => {
  before(function () {
    if (typeof AbortController !== 'function') {
      this.skip();
    }
  });

  it('should abort when any of the signals abort', () => {
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

  it('should abort on timeout', async () => {
    const signal = composeSignals([], 100);

    await new Promise((resolve) => {
      signal.addEventListener('abort', resolve);
    });

    assert.match(String(signal.reason), /timeout of 100ms exceeded/);
  });

  it('should abort immediately if a signal is already aborted', () => {
    const controller = new AbortController();
    controller.abort(new Error('already aborted'));

    const signal = composeSignals([controller.signal]);

    assert.ok(signal.aborted);
    assert.match(String(signal.reason), /already aborted/);
  });

  it('should return undefined if signals and timeout are not provided', async () => {
    const signal = composeSignals([]);

    assert.strictEqual(signal, undefined);
  });
});
