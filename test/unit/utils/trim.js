var trim = require('../../../lib/utils').trim;

module.exports = {
  testTrim: function (test) {
    test.equals(trim('  foo  '), 'foo');
    test.done();
  },

  testTrimTab: function (test) {
    test.equals(trim('\tfoo'), 'foo');
    test.done();
  }
};