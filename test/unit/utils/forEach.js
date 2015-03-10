var forEach = require('../../../lib/utils').forEach;

module.exports = {
  testArray: function (test) {
    var sum = 0;

    forEach([1, 2, 3, 4, 5], function (val) {
      sum += val;
    });

    test.equal(sum, 15);
    test.done();
  },

  testArguments: function (test) {
    var sum = 0;

    (function () {
      forEach(arguments, function (val) {
        sum += val;
      });
    })(1, 2, 3, 4, 5);

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
  },

  testUndefined: function (test) {
    var count = 0;

    forEach(undefined, function () {
      count++;
    });

    test.equals(count, 0);
    test.done();
  },

  testFunction: function (test) {
    var count = 0;

    forEach(function () {}, function () {
      count++;
    })

    test.equals(count, 1);
    test.done();
  }
};
