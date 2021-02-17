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

  ['auth', 'headers', 'params', 'proxy'].forEach(function(key) {
    it('should set new config for' + key + ' without default', function() {
      var a = {}, b = {}, c = {}
      a[key] = undefined
      b[key] = { user: 'foo', pass: 'test' }
      c[key] = { user: 'foo', pass: 'test' }

      expect(mergeConfig(a, b)).toEqual(c);
    });

    it('should merge ' + key + ' with defaults', function() {
      var a = {}, b = {}, c = {};
      a[key] = { user: 'foo', pass: 'bar' };
      b[key] = { pass: 'test' };
      c[key] = { user: 'foo', pass: 'test' };

      expect(mergeConfig(a, b)).toEqual(c);
    });

    it('should overwrite default ' + key + ' with a non-object value', function() {
      [false, null, 123].forEach(function(value) {
        var a = {}, b = {}, c = {};
        a[key] = { user: 'foo', pass: 'test' };
        b[key] = value;
        c[key] = value;

        expect(mergeConfig(a, b)).toEqual(c);
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

  it('should allow setting custom default options', function() {
    var merged = mergeConfig({ foo: 'bar' }, {});
    expect(merged.foo).toEqual('bar');
  });

  it('should allow merging custom objects in the config', function() {
    var merged = mergeConfig({
      nestedConfig: {
        propertyOnDefaultConfig: true
      }
    }, {
      nestedConfig: {
        propertyOnRequestConfig: true
      }
    });
    expect(merged.nestedConfig.propertyOnDefaultConfig).toEqual(true);
    expect(merged.nestedConfig.propertyOnRequestConfig).toEqual(true);
  });

  describe('valueFromConfig2Keys', function() {
    var config1 = {url: '/foo', method: 'post', data: {a: 3}};

    it('should skip if config2 is undefined', function() {
      expect(mergeConfig(config1, {})).toEqual({});
    });

    it('should clone config2 if is plain object', function() {
      var data = {a: 1, b: 2};
      var merged = mergeConfig(config1, {data: data});
      expect(merged.data).toEqual(data);
      expect(merged.data).not.toBe(data);
    });

    it('should clone config2 if is array', function() {
      var data = [1, 2, 3];
      var merged = mergeConfig(config1, {data: data});
      expect(merged.data).toEqual(data);
      expect(merged.data).not.toBe(data);
    });

    it('should set as config2 in other cases', function() {
      var obj = Object.create({});
      expect(mergeConfig(config1, {data: 1}).data).toBe(1);
      expect(mergeConfig(config1, {data: 'str'}).data).toBe('str');
      expect(mergeConfig(config1, {data: obj}).data).toBe(obj);
      expect(mergeConfig(config1, {data: null}).data).toBe(null);
    });
  });

  describe('mergeDeepPropertiesKeys', function() {
    it('should skip if both config1 and config2 are undefined', function() {
      expect(mergeConfig({headers: undefined}, {headers: undefined})).toEqual({});
    });

    it('should merge if both config1 and config2 are plain object', function() {
      expect(mergeConfig({headers: {a: 1, b: 1}}, {headers: {b: 2, c: 2}}))
        .toEqual({headers: {a: 1, b: 2, c: 2}});
    });

    it('should clone config2 if is plain object', function() {
      var config1 = {headers: [1, 2, 3]};
      var config2 = {headers: {a: 1, b: 2}};
      var merged = mergeConfig(config1, config2);
      expect(merged.headers).toEqual(config2.headers);
      expect(merged.headers).not.toBe(config2.headers);
    });

    it('should clone config2 if is array', function() {
      var config1 = {headers: {a: 1, b: 1}};
      var config2 = {headers: [1, 2, 3]};
      var merged = mergeConfig(config1, config2);
      expect(merged.headers).toEqual(config2.headers);
      expect(merged.headers).not.toBe(config2.headers);
    });

    it('should set as config2 in other cases', function() {
      var config1 = {headers: {a: 1, b: 1}};
      var obj = Object.create({});
      expect(mergeConfig(config1, {headers: 1}).headers).toBe(1);
      expect(mergeConfig(config1, {headers: 'str'}).headers).toBe('str');
      expect(mergeConfig(config1, {headers: obj}).headers).toBe(obj);
      expect(mergeConfig(config1, {headers: null}).headers).toBe(null);
    });

    it('should clone config1 if is plain object', function() {
      var config1 = {headers: {a: 1, b: 2}};
      var config2 = {};
      var merged = mergeConfig(config1, config2);
      expect(merged.headers).toEqual(config1.headers);
      expect(merged.headers).not.toBe(config1.headers);
    });

    it('should clone config1 if is array', function() {
      var config1 = {headers: [1, 2, 3]};
      var config2 = {};
      var merged = mergeConfig(config1, config2);
      expect(merged.headers).toEqual(config1.headers);
      expect(merged.headers).not.toBe(config1.headers);
    });

    it('should set as config1 in other cases', function() {
      var config2 = {};
      var obj = Object.create({});
      expect(mergeConfig({headers: 1}, config2).headers).toBe(1);
      expect(mergeConfig({headers: 'str'}, config2).headers).toBe('str');
      expect(mergeConfig({headers: obj}, config2).headers).toBe(obj);
      expect(mergeConfig({headers: null}, config2).headers).toBe(null);
    });
  });

  describe('defaultToConfig2Keys', function() {
    it('should skip if both config1 and config2 are undefined', function() {
      expect(mergeConfig({transformRequest: undefined}, {transformRequest: undefined})).toEqual({});
    });

    it('should clone config2 if both config1 and config2 are plain object', function() {
      var config1 = {transformRequest: {a: 1, b: 1}};
      var config2 = {transformRequest: {b: 2, c: 2}};
      var merged = mergeConfig(config1, config2);
      expect(merged.transformRequest).toEqual(config2.transformRequest);
      expect(merged.transformRequest).not.toBe(config2.transformRequest);
    });

    it('should clone config2 if is array', function() {
      var config1 = {transformRequest: {a: 1, b: 1}};
      var config2 = {transformRequest: [1, 2, 3]};
      var merged = mergeConfig(config1, config2);
      expect(merged.transformRequest).toEqual(config2.transformRequest);
      expect(merged.transformRequest).not.toBe(config2.transformRequest);
    });

    it('should set as config2 in other cases', function() {
      var config1 = {transformRequest: {a: 1, b: 1}};
      var obj = Object.create({});
      expect(mergeConfig(config1, {transformRequest: 1}).transformRequest).toBe(1);
      expect(mergeConfig(config1, {transformRequest: 'str'}).transformRequest).toBe('str');
      expect(mergeConfig(config1, {transformRequest: obj}).transformRequest).toBe(obj);
      expect(mergeConfig(config1, {transformRequest: null}).transformRequest).toBe(null);
    });

    it('should clone config1 if is plain object', function() {
      var config1 = {transformRequest: {a: 1, b: 2}};
      var config2 = {};
      var merged = mergeConfig(config1, config2);
      expect(merged.transformRequest).toEqual(config1.transformRequest);
      expect(merged.transformRequest).not.toBe(config1.transformRequest);
    });

    it('should clone config1 if is array', function() {
      var config1 = {transformRequest: [1, 2, 3]};
      var config2 = {};
      var merged = mergeConfig(config1, config2);
      expect(merged.transformRequest).toEqual(config1.transformRequest);
      expect(merged.transformRequest).not.toBe(config1.transformRequest);
    });

    it('should set as config1 in other cases', function() {
      var config2 = {};
      var obj = Object.create({});
      expect(mergeConfig({transformRequest: 1}, config2).transformRequest).toBe(1);
      expect(mergeConfig({transformRequest: 'str'}, config2).transformRequest).toBe('str');
      expect(mergeConfig({transformRequest: obj}, config2).transformRequest).toBe(obj);
      expect(mergeConfig({transformRequest: null}, config2).transformRequest).toBe(null);
    });
  });

  describe('directMergeKeys', function() {
    it('should merge if config2 in keys', function() {
      expect(mergeConfig({}, {validateStatus: undefined})).toEqual({validateStatus: undefined});
    });

    it('should merge if both config1 and config2 are plain object', function() {
      expect(mergeConfig({validateStatus: {a: 1, b: 1}}, {validateStatus: {b: 2, c: 2}}))
        .toEqual({validateStatus: {a: 1, b: 2, c: 2}});
    });

    it('should clone config2 if is plain object', function() {
      var config1 = {validateStatus: [1, 2, 3]};
      var config2 = {validateStatus: {a: 1, b: 2}};
      var merged = mergeConfig(config1, config2);
      expect(merged.validateStatus).toEqual(config2.validateStatus);
      expect(merged.validateStatus).not.toBe(config2.validateStatus);
    });

    it('should clone config2 if is array', function() {
      var config1 = {validateStatus: {a: 1, b: 2}};
      var config2 = {validateStatus: [1, 2, 3]};
      var merged = mergeConfig(config1, config2);
      expect(merged.validateStatus).toEqual(config2.validateStatus);
      expect(merged.validateStatus).not.toBe(config2.validateStatus);
    });

    it('should set as config2 in other cases', function() {
      var config1 = {validateStatus: {a: 1, b: 2}};
      var obj = Object.create({});
      expect(mergeConfig(config1, {validateStatus: 1}).validateStatus).toBe(1);
      expect(mergeConfig(config1, {validateStatus: 'str'}).validateStatus).toBe('str');
      expect(mergeConfig(config1, {validateStatus: obj}).validateStatus).toBe(obj);
      expect(mergeConfig(config1, {validateStatus: null}).validateStatus).toBe(null);
    });

    it('should clone config1 if is plain object', function() {
      var config1 = {validateStatus: {a: 1, b: 2}};
      var config2 = {};
      var merged = mergeConfig(config1, config2);
      expect(merged.validateStatus).toEqual(config1.validateStatus);
      expect(merged.validateStatus).not.toBe(config1.validateStatus);
    });

    it('should clone config1 if is array', function() {
      var config1 = {validateStatus: [1, 2, 3]};
      var config2 = {};
      var merged = mergeConfig(config1, config2);
      expect(merged.validateStatus).toEqual(config1.validateStatus);
      expect(merged.validateStatus).not.toBe(config1.validateStatus);
    });

    it('should set as config1 in other cases', function() {
      var config2 = {};
      var obj = Object.create({});
      expect(mergeConfig({validateStatus: 1}, config2).validateStatus).toBe(1);
      expect(mergeConfig({validateStatus: 'str'}, config2).validateStatus).toBe('str');
      expect(mergeConfig({validateStatus: obj}, config2).validateStatus).toBe(obj);
      expect(mergeConfig({validateStatus: null}, config2).validateStatus).toBe(null);
    });
  });
});
