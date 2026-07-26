import { describe, expect, it, vi } from 'vitest';
import InterceptorManager from '../../../lib/core/InterceptorManager.js';

describe('InterceptorManager', () => {
  it('should add interceptor and return id', () => {
    const manager = new InterceptorManager();
    const id = manager.use((config) => config);
    expect(typeof id).toBe('number');
    expect(manager.handlers.size).toBe(1);
  });

  it('should remove interceptor on eject', () => {
    const manager = new InterceptorManager();
    const id = manager.use((config) => config);
    manager.eject(id);
    expect(manager.handlers.size).toBe(0);
  });

  it('should clear all interceptors', () => {
    const manager = new InterceptorManager();
    manager.use((config) => config);
    manager.use((config) => config);
    expect(manager.handlers.size).toBe(2);

    manager.clear();
    expect(manager.handlers.size).toBe(0);
  });

  it('should iterate active interceptors with forEach', () => {
    const manager = new InterceptorManager();
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    const id1 = manager.use(fn1);
    manager.use(fn2);
    manager.eject(id1);

    const calledFns = [];
    manager.forEach((h) => {
      calledFns.push(h.fulfilled);
    });

    expect(calledFns).toEqual([fn2]);
  });

  it('should prevent unbounded sparse growth when frequently adding and ejecting interceptors (Issue #11070)', () => {
    const manager = new InterceptorManager();

    for (let i = 0; i < 10000; i++) {
      const id = manager.use((cfg) => cfg);
      manager.eject(id);
    }

    expect(manager.handlers.size).toBe(0);
    expect(manager.handlers.length).toBe(0);
  });

  it('should not reuse interceptor IDs after clear to prevent stale eject calls from deleting new handlers', () => {
    const manager = new InterceptorManager();
    const oldId = manager.use((cfg) => cfg);

    manager.clear();

    const newFn = (cfg) => cfg;
    const newId = manager.use(newFn);

    expect(newId).not.toBe(oldId);

    // Ejecting old stale ID should not delete new handler
    manager.eject(oldId);
    expect(manager.handlers.size).toBe(1);
    expect(manager.handlers.length).toBe(1);

    const called = [];
    manager.forEach((h) => called.push(h.fulfilled));
    expect(called).toEqual([newFn]);
  });
});
