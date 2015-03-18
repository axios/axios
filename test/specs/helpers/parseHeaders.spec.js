var parseHeaders = require('../../../lib/helpers/parseHeaders');

describe('helpers::parseHeaders', function () {
  it('should parse headers', function () {
    var date = new Date();
    var parsed = parseHeaders(
      'Date: ' + date.toISOString() + '\n' +
      'Content-Type: application/json\n' +
      'Connection: keep-alive\n' +
      'Transfer-Encoding: chunked'
    );

    expect(parsed['date']).toEqual(date.toISOString());
    expect(parsed['content-type']).toEqual('application/json');
    expect(parsed['connection']).toEqual('keep-alive');
    expect(parsed['transfer-encoding']).toEqual('chunked');
  });
});

