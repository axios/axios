var forEach = require('../../lib/forEach');

module.exports = {
  testArray: function (test) {
    var sum = 0;

    forEach([1, 2, 3, 4, 5], function (val) {
      sum += val;
    });

    test.equal(sum, 15);
    test.done();
  },

  testObject: function (test) {
    var keys = '';
    var vals = 0;
    var obj = {
      b: 1,
      a: 2,
      r: 3
    };

    forEach(obj, function (v, k) {
      keys += k;
      vals += v;
    });

    test.equal(keys, 'bar');
    test.equal(vals, 6);
    test.done();
  }
};