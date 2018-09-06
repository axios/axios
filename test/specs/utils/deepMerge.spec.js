var deepMerge = require('../../../lib/utils').deepMerge;

describe('utils::deepMerge', function () {
  it('should be immutable', function () {
    var a = {};
    var b = {foo: 123};
    var c = {bar: 456};

    deepMerge(a, b, c);

    expect(typeof a.foo).toEqual('undefined');
    expect(typeof a.bar).toEqual('undefined');
    expect(typeof b.bar).toEqual('undefined');
    expect(typeof c.foo).toEqual('undefined');
  });

  it('should deepMerge properties', function () {
    var a = {foo: 123};
    var b = {bar: 456};
    var c = {foo: 789};
    var d = deepMerge(a, b, c);

    expect(d.foo).toEqual(789);
    expect(d.bar).toEqual(456);
  });

  it('should deepMerge arrays correctly', function () {
    var a = [1,2,3];
    var b = [4,5,6,7];
    var c = [8,9];
    var d = deepMerge(a, b, c);

    expect(d).toEqual([8,9,6,7]);
  });

  it('should deepMerge other types than object and arrays', function () {
    var foo = function() {};

    expect(deepMerge(1, 2)).toEqual(2);
    expect(deepMerge(1, 'foo')).toEqual('foo');
    expect(deepMerge(1, foo)).toEqual(foo);
    expect(deepMerge(1, undefined)).toEqual(1);
    expect(deepMerge(undefined, 2)).toEqual(2);
  });

  it('should deepMerge recursively', function () {
    var a = {foo: {bar: 123}};
    var b = {foo: {baz: 456}, bar: {qux: 789}};

    expect(deepMerge(a, b)).toEqual({
      foo: {
        bar: 123,
        baz: 456
      },
      bar: {
        qux: 789
      }
    });
  });

  it('should deepMerge recursively with arrays', function () {
    var a = {foo: {bar: [{baz: [1, 2]}, 3, 4, 5]}};
    var b = {foo: {bar: [{baz: [6, 7, 8]}, 9, 10]}};

    expect(deepMerge(a, b)).toEqual({foo: {bar: [{baz: [6, 7, 8]}, 9, 10, 5]}});
  });

  it('should remove all references from nested objects', function () {
    var a = {foo: {bar: 123}};
    var b = {};
    var d = deepMerge(a, b);

    expect(d).toEqual({
      foo: {
        bar: 123
      }
    });

    expect(d.foo).not.toBe(a.foo);
  });

  it('handles null and undefined arguments', function () {
    expect(deepMerge(undefined, undefined)).toEqual({});
    expect(deepMerge(undefined, {foo: 123})).toEqual({foo: 123});
    expect(deepMerge({foo: 123}, undefined)).toEqual({foo: 123});

    expect(deepMerge(null, null)).toEqual({});
    expect(deepMerge(null, {foo: 123})).toEqual({foo: 123});
    expect(deepMerge({foo: 123}, null)).toEqual({foo: 123});
  });
});

