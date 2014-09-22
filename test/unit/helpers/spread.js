var spread = require('../../../lib/helpers/spread');

module.exports = {
  testSpread: function (test) {
    var value = 0;
    spread(function (a, b) {
      value = a * b;
    })([5, 10]);

    test.equals(value, 50);
    test.done();
  }
};