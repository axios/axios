var defaults = require('../../../lib/defaults');

module.exports = {
  testTransformRequestJson: function (test) {
    var data = defaults.transformRequest[0]({foo: 'bar'});

    test.equals(data, '{"foo":"bar"}');
    test.done();
  },

  testTransformRequestString: function (test) {
    var data = defaults.transformRequest[0]('foo=bar');

    test.equals(data, 'foo=bar');
    test.done();
  },

  testTransformResponseJson: function (test) {
    var data = defaults.transformResponse[0]('{"foo":"bar"}');

    test.equals(typeof data, 'object');
    test.equals(data.foo, 'bar');
    test.done();
  },

  testTransformResponseString: function (test) {
    var data = defaults.transformResponse[0]('foo=bar');

    test.equals(data, 'foo=bar');
    test.done();
  }
};