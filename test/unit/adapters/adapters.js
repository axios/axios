import adapters from '../../../lib/adapters/adapters.js';
import assert from 'assert';


describe('adapters', function () {
  const store = {...adapters.adapters};

  beforeEach(() => {
    Object.keys(adapters.adapters).forEach((name) => {
      delete adapters.adapters[name];
    });

    Object.assign(adapters.adapters, store);
  });

  it('should support loading by fn handle', function () {
    const adapter = () => {};
    assert.strictEqual(adapters.getAdapter(adapter), adapter);
  });

  it('should support loading by name', function () {
    const adapter = () => {};
    adapters.adapters['testadapter'] = adapter;
    assert.strictEqual(adapters.getAdapter('testAdapter'), adapter);
  });

  it('should detect adapter unavailable status', function () {
    adapters.adapters['testadapter'] = null;
    assert.throws(()=> adapters.getAdapter('testAdapter'), /is not available in the build/)
  });

  it('should detect adapter unsupported status', function () {
    adapters.adapters['testadapter'] = false;
    assert.throws(()=> adapters.getAdapter('testAdapter'), /is not supported by the environment/)
  });

  it('should pick suitable adapter from the list', function () {
    const adapter = () => {};

    Object.assign(adapters.adapters, {
      foo: false,
      bar: null,
      baz: adapter
    });

    assert.strictEqual(adapters.getAdapter(['foo', 'bar', 'baz']), adapter);
  });
});
