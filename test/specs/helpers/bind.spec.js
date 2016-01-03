var bind = require('../../../lib/helpers/bind');

describe('bind', function () {
  it('should bind an object to a function', function () {
    var o = { val: 123 };
    var f = bind(function (num) {
      return this.val * num;
    }, o);

    expect(f(2)).toEqual(246);
  });
});
