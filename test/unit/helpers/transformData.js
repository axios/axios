var transformData = require('../../../lib/helpers/transformData');

module.exports = {
  testSingleFunction: function (test) {
    var data;
    data = transformData(data, null, function (data) {
      data = 'foo';
      return data;
    });

    test.equals(data, 'foo');
    test.done();
  },

  testFunctionArray: function (test) {
    var data = '';
    data = transformData(data, null, [function (data) {
      data += 'f';
      return data;
    }, function (data) {
      data += 'o';
      return data;
    }, function (data) {
      data += 'o';
      return data;
    }]);

    test.equals(data, 'foo');
    test.done();
  }
};