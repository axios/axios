import utils from '../../../lib/utils';

const {extend} = utils;

describe('utils::extend', function () {
  it('should be mutable', function () {
    const a = {};
    const b = {foo: 123};

    extend(a, b);

    expect(a.foo).toEqual(b.foo);
  });

  it('should extend properties', function () {
    let a = {foo: 123, bar: 456};
    const b = {bar: 789};

    a = extend(a, b);

    expect(a.foo).toEqual(123);
    expect(a.bar).toEqual(789);
  });

  it('should bind to thisArg', function () {
    const a = {};
    const b = {getFoo: function getFoo() { return this.foo; }};
    const thisArg = { foo: 'barbaz' };

    extend(a, b, thisArg);

    expect(typeof a.getFoo).toEqual('function');
    expect(a.getFoo()).toEqual(thisArg.foo);
  });
});

