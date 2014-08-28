var utils = require('../../../lib/utils');

module.exports = {
  testIsArray: function (test) {
    test.equals(utils.isArray([]), true);
    test.equals(utils.isArray({length: 5}), false);
    test.done();
  },

  testIsObject: function (test) {
    test.equals(utils.isObject({}), true);
    test.equals(utils.isObject(null), false);
    test.done();
  },

  testIsDate: function (test) {
    test.equals(utils.isDate(new Date()), true);
    test.equals(utils.isDate(Date.now()), false);
    test.done();
  }
};