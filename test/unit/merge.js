var merge = require('../../lib/merge');

module.exports = {
  testImmutability: function (test) {
    var a = {};
    var b = {foo: 123};
    var c = {bar: 456};

    merge(a, b, c);

    test.equals(typeof a.foo, 'undefined');
    test.equals(typeof a.bar, 'undefined');
    test.equals(typeof b.bar, 'undefined');
    test.equals(typeof c.foo, 'undefined');
    test.done();
  },

  testMerge: function (test) {
    var a = {foo: 123};
    var b = {bar: 456};
    var c = {foo: 789};
    var d = merge(a, b, c);

    test.equals(d.foo, 789);
    test.equals(d.bar, 456);
    test.done();
  }
};