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
});

