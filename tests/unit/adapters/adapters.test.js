import { beforeEach, describe, it } from 'vitest';
import assert from 'assert';
import adapters from '../../../lib/adapters/adapters.js';
import AxiosError from '../../../lib/core/AxiosError.js';
import platform from '../../../lib/platform/index.js';
import undiciAdapter from '../../../lib/adapters/undici.js';

describe('adapters', () => {
  const store = { ...adapters.adapters };

  beforeEach(() => {
    Object.keys(adapters.adapters).forEach((name) => {
      delete adapters.adapters[name];
    });

    Object.assign(adapters.adapters, store);
  });

  it('should support loading by fn handle', () => {
    const adapter = () => {};
    assert.strictEqual(adapters.getAdapter(adapter), adapter);
  });

  it('should support loading by name', () => {
    const adapter = () => {};
    adapters.adapters.testadapter = adapter;
    assert.strictEqual(adapters.getAdapter('testAdapter'), adapter);
  });

  it('should detect adapter unavailable status', () => {
    adapters.adapters.testadapter = null;
    assert.throws(() => adapters.getAdapter('testAdapter'), /is not available in the build/);
  });

  it('should detect adapter unsupported status', () => {
    adapters.adapters.testadapter = false;
    assert.throws(
      () => adapters.getAdapter('testAdapter'),
      (err) => {
        assert.ok(err instanceof AxiosError);
        assert.strictEqual(err.code, AxiosError.ERR_NOT_SUPPORT);
        assert.match(err.message, /is not supported by the environment/);
        return true;
      }
    );
  });

  it('should pick suitable adapter from the list', () => {
    const adapter = () => {};

    Object.assign(adapters.adapters, {
      foo: false,
      bar: null,
      baz: adapter,
    });

    assert.strictEqual(adapters.getAdapter(['foo', 'bar', 'baz']), adapter);
  });

  describe('undici', () => {
    it('should resolve the undici adapter lazily when the platform supports it', () => {
      assert.strictEqual(typeof adapters.adapters.undici.get, 'function');
      assert.strictEqual(platform.hasUndici(), true);
      assert.strictEqual(adapters.getAdapter('undici'), undiciAdapter);
    });

    it('should fall back to the next adapter when the platform does not support undici', () => {
      const adapter = () => {};
      const { hasUndici } = platform;
      adapters.adapters.testadapter = adapter;

      delete platform.hasUndici;

      try {
        assert.strictEqual(adapters.getAdapter(['undici', 'testAdapter']), adapter);
        assert.throws(
          () => adapters.getAdapter('undici'),
          /adapter undici is not supported by the environment/
        );
      } finally {
        platform.hasUndici = hasUndici;
      }
    });

    it('should fall back to the next adapter when the undici package is not installed', () => {
      const adapter = () => {};
      const { hasUndici } = platform;
      adapters.adapters.testadapter = adapter;

      platform.hasUndici = () => false;

      try {
        assert.strictEqual(adapters.getAdapter(['undici', 'testAdapter']), adapter);
        assert.throws(
          () => adapters.getAdapter('undici'),
          /adapter undici is not supported by the environment/
        );
      } finally {
        platform.hasUndici = hasUndici;
      }
    });
  });
});
