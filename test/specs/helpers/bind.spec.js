import bind from '../../../lib/helpers/bind';

describe('bind', function () {
  it('should bind an object to a function', function () {
    const o = { val: 123 };
    const f = bind(function (num) {
      return this.val * num;
    }, o);

    expect(f(2)).toEqual(246);
  });
});
