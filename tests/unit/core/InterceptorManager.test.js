import { describe, it, expect } from 'vitest';
import InterceptorManager from '../../../lib/core/InterceptorManager.js';

describe('core::InterceptorManager', () => {
  it('does not accumulate trailing tombstones during repeated use and eject', () => {
    const manager = new InterceptorManager();
    const persistent = manager.use(() => {});
    const transient = () => {};

    for (let i = 0; i < 10000; i++) {
      const id = manager.use(transient);
      manager.eject(id);
    }

    expect(Array.isArray(manager.handlers)).toBe(true);
    expect(manager.handlers).toHaveLength(1);

    manager.eject(persistent);

    expect(manager.handlers).toHaveLength(0);
  });

  it('preserves interior tombstones until trailing handlers are removed', () => {
    const manager = new InterceptorManager();
    const first = manager.use(() => {});
    const second = manager.use(() => {});
    const third = manager.use(() => {});

    manager.eject(second);

    expect(manager.handlers).toHaveLength(3);
    expect(manager.handlers[second]).toBeNull();

    manager.eject(third);

    expect(manager.handlers).toHaveLength(1);
    expect(manager.handlers[first]).not.toBeNull();
  });

  it('does not reuse an ejected interceptor ID after trimming its handler', () => {
    const manager = new InterceptorManager();
    const active = () => {};
    const staleId = manager.use(() => {});

    manager.eject(staleId);

    const activeId = manager.use(active);

    expect(activeId).not.toBe(staleId);

    manager.eject(staleId);

    expect(manager.handlers).toHaveLength(1);
    expect(manager.handlers[0].fulfilled).toBe(active);

    manager.eject(activeId);

    expect(manager.handlers).toHaveLength(0);
  });

  it('defers compaction while iterating so newly registered handlers are not visited', () => {
    const manager = new InterceptorManager();
    const first = () => {};
    const removed = () => {};
    const added = () => {};
    const visited = [];
    let mutated = false;

    manager.use(first);
    const removedId = manager.use(removed);

    manager.forEach((handler) => {
      visited.push(handler.fulfilled);

      if (!mutated && handler.fulfilled === first) {
        mutated = true;
        manager.eject(removedId);
        manager.use(added);
      }
    });

    expect(visited).toEqual([first]);

    const nextVisited = [];
    manager.forEach((handler) => nextVisited.push(handler.fulfilled));

    expect(nextVisited).toEqual([first, added]);
  });

  it('compacts handlers ejected during iteration after iteration completes', () => {
    const manager = new InterceptorManager();
    const first = () => {};
    const second = () => {};
    const visited = [];

    manager.use(first);
    const secondId = manager.use(second);

    manager.forEach((handler) => {
      visited.push(handler.fulfilled);

      if (handler.fulfilled === first) {
        manager.eject(secondId);
      }
    });

    expect(visited).toEqual([first]);
    expect(manager.handlers).toHaveLength(1);
  });

  it('preserves iteration over the current handlers when cleared during iteration', () => {
    const manager = new InterceptorManager();
    const first = () => {};
    const second = () => {};
    const visited = [];

    manager.use(first);
    manager.use(second);

    manager.forEach((handler) => {
      visited.push(handler.fulfilled);

      if (handler.fulfilled === first) {
        manager.clear();
      }
    });

    expect(visited).toEqual([first, second]);
    expect(manager.handlers).toHaveLength(0);
  });
});
