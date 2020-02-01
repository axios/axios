var defaults = require('../../../lib/defaults');
var mergeConfig = require('../../../lib/core/mergeConfig');

describe('core::mergeConfig', function() {
  it('should accept undefined for second argument', function() {
    expect(mergeConfig(defaults, undefined)).toEqual(defaults);
  });

  it('should accept an object for second argument', function() {
    expect(mergeConfig(defaults, {})).toEqual(defaults);
  });

  it('should not leave references', function() {
    var merged = mergeConfig(defaults, {});
    expect(merged).not.toBe(defaults);
    expect(merged.headers).not.toBe(defaults.headers);
  });

  it('should allow setting request options', function() {
    var config = {
      url: '__sample url__',
      method: '__sample method__',
      params: '__sample params__',
      data: { foo: true }
    };
    var merged = mergeConfig(defaults, config);
    expect(merged.url).toEqual(config.url);
    expect(merged.method).toEqual(config.method);
    expect(merged.params).toEqual(config.params);
    expect(merged.data).toEqual(config.data);
  });

  it('should not inherit request options', function() {
    var localDefaults = {
      method: '__sample method__',
      data: { foo: true }
    };
    var merged = mergeConfig(localDefaults, {});
    expect(merged.method).toEqual(undefined);
    expect(merged.data).toEqual(undefined);
  });

  ['auth', 'headers', 'params', 'proxy'].forEach(key => {
    it(`should set new config for ${key} without default`, function() {
      expect(mergeConfig({ [key]: undefined }, { [key]: { user: 'foo', pass: 'test' } })).toEqual({
        [key]: { user: 'foo', pass: 'test' }
      });
    });

    it(`should merge ${key} with defaults`, function() {
      expect(mergeConfig({ [key]: { user: 'foo', pass: 'bar' } }, { [key]: { pass: 'test' } })).toEqual({
        [key]: { user: 'foo', pass: 'test' }
      });
    });

    it(`should overwrite default ${key} with a non-object value`, function() {
      [false, null, 123].forEach(value => {
        expect(mergeConfig({ [key]: { user: 'foo', pass: 'test' } }, { [key]: value })).toEqual({
          [key]: value
        });
      });
    });
  });

  it('should allow setting other options', function() {
    var merged = mergeConfig(defaults, { timeout: 123 });
    expect(merged.timeout).toEqual(123);
  });

  it('should allow setting custom options', function() {
    var merged = mergeConfig(defaults, { foo: 'bar' });
    expect(merged.foo).toEqual('bar');
  });
});
