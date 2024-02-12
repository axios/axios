import utils from '../../../lib/utils';

const {merge} = utils;

describe('utils::merge', function () {
  it('should be immutable', function () {
    const a = {};
    const b = {foo: 123};
    const c = {bar: 456};

    merge(a, b, c);

    expect(typeof a.foo).toEqual('undefined');
    expect(typeof a.bar).toEqual('undefined');
    expect(typeof b.bar).toEqual('undefined');
    expect(typeof c.foo).toEqual('undefined');
  });

  it('should merge properties', function () {
    const a = {foo: 123};
    const b = {bar: 456};
    const c = {foo: 789};
    const d = merge(a, b, c);

    expect(d.foo).toEqual(789);
    expect(d.bar).toEqual(456);
  });

  it('should merge recursively', function () {
    const a = {foo: {bar: 123}};
    const b = {foo: {baz: 456}, bar: {qux: 789}};

    expect(merge(a, b)).toEqual({
      foo: {
        bar: 123,
        baz: 456
      },
      bar: {
        qux: 789
      }
    });
  });

  it('should remove all references from nested objects', function () {
    const a = {foo: {bar: 123}};
    const b = {};
    const d = merge(a, b);

    expect(d).toEqual({
      foo: {
        bar: 123
      }
    });

    expect(d.foo).not.toBe(a.foo);
  });

  it('handles null and undefined arguments', function () {
    expect(merge(undefined, undefined)).toEqual({});
    expect(merge(undefined, {foo: 123})).toEqual({foo: 123});
    expect(merge({foo: 123}, undefined)).toEqual({foo: 123});

    expect(merge(null, null)).toEqual({});
    expect(merge(null, {foo: 123})).toEqual({foo: 123});
    expect(merge({foo: 123}, null)).toEqual({foo: 123});
  });

  it('should replace properties with null', function () {
    expect(merge({}, {a: null})).toEqual({a: null});
    expect(merge({a: null}, {})).toEqual({a: null});
  });

  it('should replace properties with arrays', function () {
    expect(merge({}, {a: [1, 2, 3]})).toEqual({a: [1, 2, 3]});
    expect(merge({a: 2}, {a: [1, 2, 3]})).toEqual({a: [1, 2, 3]});
    expect(merge({a: {b: 2}}, {a: [1, 2, 3]})).toEqual({a: [1, 2, 3]});
  });

  it('should replace properties with cloned arrays', function () {
    const a = [1, 2, 3];
    const d = merge({}, {a: a});

    expect(d).toEqual({a: [1, 2, 3]});
    expect(d.a).not.toBe(a);
  });

  it('should support caseless option', ()=> {
    const a = {x: 1};
    const b = {X: 2};
    const merged = merge.call({caseless: true}, a, b);

    expect(merged).toEqual({
      x: 2
    });
  });
});
