import { describe, it } from 'vitest';
import assert from 'assert';
import InterceptorManager from '../../../lib/core/InterceptorManager.js';

describe('InterceptorManager', () => {
  it('does not retain ejected interceptors as null slots', () => {
    const manager = new InterceptorManager();

    for (let i = 0; i < 10000; i++) {
      const id = manager.use((config) => config);
      manager.eject(id);
    }

    assert.strictEqual(manager.handlers.length, 0);
  });

  it('does not let stale ejected ids remove later interceptors', () => {
    const manager = new InterceptorManager();
    const first = () => 'first';
    const second = () => 'second';
    const firstId = manager.use(first);

    manager.eject(firstId);
    manager.use(second);
    manager.eject(firstId);

    const handlers = [];
    manager.forEach((handler) => handlers.push(handler.fulfilled));

    assert.deepStrictEqual(handlers, [second]);
  });

  it('preserves insertion order when ejecting from the middle', () => {
    const manager = new InterceptorManager();
    const first = () => 'first';
    const second = () => 'second';
    const third = () => 'third';

    manager.use(first);
    const secondId = manager.use(second);
    manager.use(third);
    manager.eject(secondId);

    const handlers = [];
    manager.forEach((handler) => handlers.push(handler.fulfilled));

    assert.deepStrictEqual(handlers, [first, third]);
  });
});
