var parseHeaders = require('../../../lib/helpers/parseHeaders');

describe('helpers::parseHeaders', function () {
  it('should parse headers', function () {
    var date = new Date();
    var parsed = parseHeaders(
      'Date: ' + date.toISOString() + '\n' +
      'Content-Type: application/json\n' +
      'Connection: keep-alive\n' +
      'Transfer-Encoding: chunked\n' +
      'Set-Cookie: cookie_key_1=yyy; Path=/\n' +
      'Set-Cookie: cookie_key_2=xxx; expires=Mon, 17-Oct-2016 17:16:25 GMT; httponly; Max-Age=1209600; Path=/\n' +
      'Set-Cookie: cookie_key_3=zzz; Path=/www'
    );

    expect(parsed['date']).toEqual(date.toISOString());
    expect(parsed['content-type']).toEqual('application/json');
    expect(parsed['connection']).toEqual('keep-alive');
    expect(parsed['transfer-encoding']).toEqual('chunked');
    expect(parsed['set-cookie']).toEqual([
      'cookie_key_1=yyy; Path=/',
      'cookie_key_2=xxx; expires=Mon, 17-Oct-2016 17:16:25 GMT; httponly; Max-Age=1209600; Path=/',
      'cookie_key_3=zzz; Path=/www'
    ]);
  });
});

