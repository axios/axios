import { describe, it, expect } from 'vitest';
import defaults from '../../../lib/defaults/index.js';
import mergeConfig from '../../../lib/core/mergeConfig.js';
import { AxiosHeaders } from '../../../index.js';

describe('core::mergeConfig', () => {
  it('accepts undefined for second argument', () => {
    expect(mergeConfig(defaults, undefined)).toEqual(defaults);
  });

  it('accepts an object for second argument', () => {
    expect(mergeConfig(defaults, {})).toEqual(defaults);
  });

  it('does not leave references', () => {
    const merged = mergeConfig(defaults, {});

    expect(merged).not.toBe(defaults);
    expect(merged.headers).not.toBe(defaults.headers);
  });

  it('allows setting request options', () => {
    const config = {
      url: '__sample url__',
      method: '__sample method__',
      params: '__sample params__',
      data: { foo: true },
    };
    const merged = mergeConfig(defaults, config);

    expect(merged.url).toBe(config.url);
    expect(merged.method).toBe(config.method);
    expect(merged.params).toBe(config.params);
    expect(merged.data).toEqual(config.data);
  });

  it('does not inherit request options', () => {
    const localDefaults = {
      method: '__sample method__',
      data: { foo: true },
    };
    const merged = mergeConfig(localDefaults, {});

    expect(merged.method).toBeUndefined();
    expect(merged.data).toBeUndefined();
  });

  for (const key of ['auth', 'headers', 'params', 'proxy']) {
    it(`sets new config for ${key} without default`, () => {
      const config1 = { [key]: undefined };
      const config2 = { [key]: { user: 'foo', pass: 'test' } };
      const expected = { [key]: { user: 'foo', pass: 'test' } };

      expect(mergeConfig(config1, config2)).toEqual(expected);
    });

    it(`merges ${key} with defaults`, () => {
      const config1 = { [key]: { user: 'foo', pass: 'bar' } };
      const config2 = { [key]: { pass: 'test' } };
      const expected = { [key]: { user: 'foo', pass: 'test' } };

      expect(mergeConfig(config1, config2)).toEqual(expected);
    });

    it.each([false, null, 123])(`overwrites default ${key} with %p`, (value) => {
      const config1 = { [key]: { user: 'foo', pass: 'test' } };
      const config2 = { [key]: value };
      const expected = { [key]: value };

      expect(mergeConfig(config1, config2)).toEqual(expected);
    });
  }

  it('allows setting other options', () => {
    const merged = mergeConfig(defaults, { timeout: 123 });

    expect(merged.timeout).toBe(123);
  });

  it('allows setting custom options', () => {
    const merged = mergeConfig(defaults, { foo: 'bar' });

    expect(merged.foo).toBe('bar');
  });

  it('allows setting custom default options', () => {
    const merged = mergeConfig({ foo: 'bar' }, {});

    expect(merged.foo).toBe('bar');
  });

  it('allows merging custom objects in config', () => {
    const merged = mergeConfig(
      {
        nestedConfig: {
          propertyOnDefaultConfig: true,
        },
      },
      {
        nestedConfig: {
          propertyOnRequestConfig: true,
        },
      }
    );

    expect(merged.nestedConfig.propertyOnDefaultConfig).toBe(true);
    expect(merged.nestedConfig.propertyOnRequestConfig).toBe(true);
  });

  describe('headers', () => {
    it('allows merging with AxiosHeaders instances', () => {
      const merged = mergeConfig(
        {
          headers: new AxiosHeaders({
            x: 1,
            y: 2,
          }),
        },
        {
          headers: new AxiosHeaders({
            X: 1,
            Y: 2,
          }),
        }
      );

      expect(merged.headers).toEqual({
        x: '1',
        y: '2',
      });
    });
  });

  describe('valueFromConfig2Keys', () => {
    const config1 = { url: '/foo', method: 'post', data: { a: 3 } };

    it('skips if config2 does not define the key', () => {
      expect(mergeConfig(config1, {})).toEqual({});
    });

    it('clones config2 when it is a plain object', () => {
      const data = { a: 1, b: 2 };
      const merged = mergeConfig(config1, { data });

      expect(merged.data).toEqual(data);
      expect(merged.data).not.toBe(data);
    });

    it('clones config2 when it is an array', () => {
      const data = [1, 2, 3];
      const merged = mergeConfig(config1, { data });

      expect(merged.data).toEqual(data);
      expect(merged.data).not.toBe(data);
    });

    it('sets config2 value directly for non-mergeable values', () => {
      const obj = Object.create({});

      expect(mergeConfig(config1, { data: 1 }).data).toBe(1);
      expect(mergeConfig(config1, { data: 'str' }).data).toBe('str');
      expect(mergeConfig(config1, { data: obj }).data).toBe(obj);
      expect(mergeConfig(config1, { data: null }).data).toBe(null);
    });
  });

  describe('mergeDeepPropertiesKeys', () => {
    it('skips when both config1 and config2 values are undefined', () => {
      expect(mergeConfig({ headers: undefined }, { headers: undefined })).toEqual({});
    });

    it('merges when both values are plain objects', () => {
      expect(mergeConfig({ headers: { a: 1, b: 1 } }, { headers: { b: 2, c: 2 } })).toEqual({
        headers: { a: 1, b: 2, c: 2 },
      });
    });

    it('clones config2 when it is a plain object', () => {
      const config1 = { headers: [1, 2, 3] };
      const config2 = { headers: { a: 1, b: 2 } };
      const merged = mergeConfig(config1, config2);

      expect(merged.headers).toEqual(config2.headers);
      expect(merged.headers).not.toBe(config2.headers);
    });

    it('clones config2 when it is an array', () => {
      const config1 = { headers: { a: 1, b: 1 } };
      const config2 = { headers: [1, 2, 3] };
      const merged = mergeConfig(config1, config2);

      expect(merged.headers).toEqual(config2.headers);
      expect(merged.headers).not.toBe(config2.headers);
    });

    it('sets config2 value directly for non-mergeable values', () => {
      const config1 = { headers: { a: 1, b: 1 } };
      const obj = Object.create({});

      expect(mergeConfig(config1, { headers: 1 }).headers).toBe(1);
      expect(mergeConfig(config1, { headers: 'str' }).headers).toBe('str');
      expect(mergeConfig(config1, { headers: obj }).headers).toBe(obj);
      expect(mergeConfig(config1, { headers: null }).headers).toBe(null);
    });

    it('clones config1 when it is a plain object', () => {
      const config1 = { headers: { a: 1, b: 2 } };
      const merged = mergeConfig(config1, {});

      expect(merged.headers).toEqual(config1.headers);
      expect(merged.headers).not.toBe(config1.headers);
    });

    it('clones config1 when it is an array', () => {
      const config1 = { headers: [1, 2, 3] };
      const merged = mergeConfig(config1, {});

      expect(merged.headers).toEqual(config1.headers);
      expect(merged.headers).not.toBe(config1.headers);
    });

    it('sets config1 value directly for non-mergeable values', () => {
      const obj = Object.create({});

      expect(mergeConfig({ headers: 1 }, {}).headers).toBe(1);
      expect(mergeConfig({ headers: 'str' }, {}).headers).toBe('str');
      expect(mergeConfig({ headers: obj }, {}).headers).toBe(obj);
      expect(mergeConfig({ headers: null }, {}).headers).toBe(null);
    });
  });

  describe('defaultToConfig2Keys', () => {
    it('skips when both config1 and config2 values are undefined', () => {
      expect(mergeConfig({ transformRequest: undefined }, { transformRequest: undefined })).toEqual(
        {}
      );
    });

    it('clones config2 when both values are plain objects', () => {
      const config1 = { transformRequest: { a: 1, b: 1 } };
      const config2 = { transformRequest: { b: 2, c: 2 } };
      const merged = mergeConfig(config1, config2);

      expect(merged.transformRequest).toEqual(config2.transformRequest);
      expect(merged.transformRequest).not.toBe(config2.transformRequest);
    });

    it('clones config2 when it is an array', () => {
      const config1 = { transformRequest: { a: 1, b: 1 } };
      const config2 = { transformRequest: [1, 2, 3] };
      const merged = mergeConfig(config1, config2);

      expect(merged.transformRequest).toEqual(config2.transformRequest);
      expect(merged.transformRequest).not.toBe(config2.transformRequest);
    });

    it('sets config2 value directly for non-mergeable values', () => {
      const config1 = { transformRequest: { a: 1, b: 1 } };
      const obj = Object.create({});

      expect(mergeConfig(config1, { transformRequest: 1 }).transformRequest).toBe(1);
      expect(mergeConfig(config1, { transformRequest: 'str' }).transformRequest).toBe('str');
      expect(mergeConfig(config1, { transformRequest: obj }).transformRequest).toBe(obj);
      expect(mergeConfig(config1, { transformRequest: null }).transformRequest).toBe(null);
    });

    it('clones config1 when it is a plain object', () => {
      const config1 = { transformRequest: { a: 1, b: 2 } };
      const merged = mergeConfig(config1, {});

      expect(merged.transformRequest).toEqual(config1.transformRequest);
      expect(merged.transformRequest).not.toBe(config1.transformRequest);
    });

    it('clones config1 when it is an array', () => {
      const config1 = { transformRequest: [1, 2, 3] };
      const merged = mergeConfig(config1, {});

      expect(merged.transformRequest).toEqual(config1.transformRequest);
      expect(merged.transformRequest).not.toBe(config1.transformRequest);
    });

    it('sets config1 value directly for non-mergeable values', () => {
      const obj = Object.create({});

      expect(mergeConfig({ transformRequest: 1 }, {}).transformRequest).toBe(1);
      expect(mergeConfig({ transformRequest: 'str' }, {}).transformRequest).toBe('str');
      expect(mergeConfig({ transformRequest: obj }, {}).transformRequest).toBe(obj);
      expect(mergeConfig({ transformRequest: null }, {}).transformRequest).toBe(null);
    });
  });

  describe('directMergeKeys', () => {
    it('merges when config2 defines the key', () => {
      expect(mergeConfig({}, { validateStatus: undefined })).toEqual({ validateStatus: undefined });
    });

    it('merges when both values are plain objects', () => {
      expect(
        mergeConfig({ validateStatus: { a: 1, b: 1 } }, { validateStatus: { b: 2, c: 2 } })
      ).toEqual({ validateStatus: { a: 1, b: 2, c: 2 } });
    });

    it('clones config2 when it is a plain object', () => {
      const config1 = { validateStatus: [1, 2, 3] };
      const config2 = { validateStatus: { a: 1, b: 2 } };
      const merged = mergeConfig(config1, config2);

      expect(merged.validateStatus).toEqual(config2.validateStatus);
      expect(merged.validateStatus).not.toBe(config2.validateStatus);
    });

    it('clones config2 when it is an array', () => {
      const config1 = { validateStatus: { a: 1, b: 2 } };
      const config2 = { validateStatus: [1, 2, 3] };
      const merged = mergeConfig(config1, config2);

      expect(merged.validateStatus).toEqual(config2.validateStatus);
      expect(merged.validateStatus).not.toBe(config2.validateStatus);
    });

    it('sets config2 value directly for non-mergeable values', () => {
      const config1 = { validateStatus: { a: 1, b: 2 } };
      const obj = Object.create({});

      expect(mergeConfig(config1, { validateStatus: 1 }).validateStatus).toBe(1);
      expect(mergeConfig(config1, { validateStatus: 'str' }).validateStatus).toBe('str');
      expect(mergeConfig(config1, { validateStatus: obj }).validateStatus).toBe(obj);
      expect(mergeConfig(config1, { validateStatus: null }).validateStatus).toBe(null);
    });

    it('clones config1 when it is a plain object', () => {
      const config1 = { validateStatus: { a: 1, b: 2 } };
      const merged = mergeConfig(config1, {});

      expect(merged.validateStatus).toEqual(config1.validateStatus);
      expect(merged.validateStatus).not.toBe(config1.validateStatus);
    });

    it('clones config1 when it is an array', () => {
      const config1 = { validateStatus: [1, 2, 3] };
      const merged = mergeConfig(config1, {});

      expect(merged.validateStatus).toEqual(config1.validateStatus);
      expect(merged.validateStatus).not.toBe(config1.validateStatus);
    });

    it('sets config1 value directly for non-mergeable values', () => {
      const obj = Object.create({});

      expect(mergeConfig({ validateStatus: 1 }, {}).validateStatus).toBe(1);
      expect(mergeConfig({ validateStatus: 'str' }, {}).validateStatus).toBe('str');
      expect(mergeConfig({ validateStatus: obj }, {}).validateStatus).toBe(obj);
      expect(mergeConfig({ validateStatus: null }, {}).validateStatus).toBe(null);
    });
  });
});
