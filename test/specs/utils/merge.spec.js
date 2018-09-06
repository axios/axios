var merge = require('../../../lib/utils').merge;

describe('utils::merge', function () {
  it('should be immutable', function () {
    var a = {};
    var b = {foo: 123};
    var c = {bar: 456};

    merge(a, b, c);

    expect(typeof a.foo).toEqual('undefined');
    expect(typeof a.bar).toEqual('undefined');
    expect(typeof b.bar).toEqual('undefined');
    expect(typeof c.foo).toEqual('undefined');
  });

  it('should merge properties', function () {
    var a = {foo: 123};
    var b = {bar: 456};
    var c = {foo: 789};
    var d = merge(a, b, c);

    expect(d.foo).toEqual(789);
    expect(d.bar).toEqual(456);
  });

  it('should merge arrays correctly', function () {
    var a = [1,2,3];
    var b = [4,5,6,7];
    var c = [8,9];
    var d = merge(a, b, c);

    expect(d).toEqual([8,9,6,7]);
  });

  it('should merge other types than object and arrays', function () {
    var foo = function() {};

    expect(merge(1, 2)).toEqual(2);
    expect(merge(1, 'foo')).toEqual('foo');
    expect(merge(1, foo)).toEqual(foo);
    expect(merge(1, undefined)).toEqual(1);
    expect(merge(undefined, 2)).toEqual(2);
  });

  it('should merge recursively', function () {
    var a = {foo: {bar: 123}};
    var b = {foo: {baz: 456}, bar: {qux: 789}};

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

  it('should merge recursively with arrays', function () {
    var a = {foo: {bar: [{baz: [1, 2]}, 3, 4, 5]}};
    var b = {foo: {bar: [{baz: [6, 7, 8]}, 9, 10]}};

    expect(merge(a, b)).toEqual({foo: {bar: [{baz: [6, 7, 8]}, 9, 10, 5]}});
  });

  it('handles null and undefined arguments', function () {
    expect(merge(undefined, undefined)).toEqual({});
    expect(merge(undefined, {foo: 123})).toEqual({foo: 123});
    expect(merge({foo: 123}, undefined)).toEqual({foo: 123});

    expect(merge(null, null)).toEqual({});
    expect(merge(null, {foo: 123})).toEqual({foo: 123});
    expect(merge({foo: 123}, null)).toEqual({foo: 123});
  });
});

