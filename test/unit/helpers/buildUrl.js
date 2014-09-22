var buildUrl = require('../../../lib/helpers/buildUrl');

module.exports = {
  testNullParams: function (test) {
    var url = buildUrl('/foo');

    test.equals(url, '/foo');
    test.done();
  },

  testParams: function (test) {
    var url = buildUrl('/foo', {
      foo: 'bar'
    });

    test.equals(url, '/foo?foo=bar');
    test.done();
  },

  testObjectParam: function (test) {
    var url = buildUrl('/foo', {
      foo: {
        bar: 'baz'
      }
    });

    test.equals(url, '/foo?foo=' + encodeURI('{"bar":"baz"}'));
    test.done();
  },

  testDateParam: function (test) {
    var date = new Date();
    var url = buildUrl('/foo', {
      date: date
    });

    test.equals(url, '/foo?date=' + date.toISOString());
    test.done();
  },

  testArrayParam: function (test) {
    var url = buildUrl('/foo', {
      foo: ['bar', 'baz']
    });

    test.equals(url, '/foo?foo=bar&foo=baz');
    test.done();
  },

  testSpecialChars: function (test) {
    var url = buildUrl('/foo', {
      foo: '@:$, '
    });

    test.equals(url, '/foo?foo=@:$,+');
    test.done();
  },

  testQuestionMark: function (test) {
    var url = buildUrl('/foo?foo=bar', {
      bar: 'baz'
    });

    test.equals(url, '/foo?foo=bar&bar=baz');
    test.done();
  }
};