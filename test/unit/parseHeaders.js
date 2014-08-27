var parseHeaders = require('../../lib/parseHeaders');

module.exports = {
  testParse: function (test) {
    var date = new Date();
    var parsed = parseHeaders(
      'Date: ' + date.toISOString() + '\n' +
      'Content-Type: application/json\n' +
      'Connection: keep-alive\n' +
      'Transfer-Encoding: chunked'
    );

    test.equals(parsed['date'], date.toISOString());
    test.equals(parsed['content-type'], 'application/json');
    test.equals(parsed['connection'], 'keep-alive');
    test.equals(parsed['transfer-encoding'], 'chunked');
    test.done();
  }
};