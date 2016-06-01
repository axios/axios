var extend = require('../../../lib/utils').extend;

describe('utils::extend', function () {
  it('should be mutable', function () {
    var a = {};
    var b = {foo: 123};

    extend(a, b);

    expect(a.foo).toEqual(b.foo);
  });
  
  it('should extend properties', function () {
    var a = {foo: 123, bar: 456};
    var b = {bar: 789};

    a = extend(a, b);

    expect(a.foo).toEqual(123);
    expect(a.bar).toEqual(789);
  });

  it('should bind to thisArg', function () {
    var a = {};
    var b = {getFoo: function getFoo() { return this.foo; }};
    var thisArg = { foo: 'barbaz' };

    extend(a, b, thisArg);

    expect(typeof a.getFoo).toEqual('function');
    expect(a.getFoo()).toEqual(thisArg.foo);
  });
});

