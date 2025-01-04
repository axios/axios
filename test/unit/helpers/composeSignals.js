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

    await new Promise(resolve => {
      signal.addEventListener('abort', resolve);
    });

    assert.match(String(signal.reason), /timeout 100 of ms exceeded/);
  });

  it('should return undefined if signals and timeout are not provided', async () => {
    const signal = composeSignals([]);

    assert.strictEqual(signal, undefined);
  });
});
