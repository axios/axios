import parseHeaders from '../../../lib/helpers/parseHeaders';

describe('helpers::parseHeaders', function () {
  it('should parse headers', function () {
    const date = new Date();
    const parsed = parseHeaders(
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

  it('should use array for set-cookie', function() {
    const parsedZero = parseHeaders('');
    const parsedSingle = parseHeaders(
      'Set-Cookie: key=val;'
    );
    const parsedMulti = parseHeaders(
      'Set-Cookie: key=val;\n' +
      'Set-Cookie: key2=val2;\n'
    );

    expect(parsedZero['set-cookie']).toBeUndefined();
    expect(parsedSingle['set-cookie']).toEqual(['key=val;']);
    expect(parsedMulti['set-cookie']).toEqual(['key=val;', 'key2=val2;']);
  });

  it('should handle duplicates', function() {
    const parsed = parseHeaders(
      'Age: age-a\n' + // age is in ignore duplicates blocklist
      'Age: age-b\n' +
      'Foo: foo-a\n' +
      'Foo: foo-b\n'
    );

    expect(parsed['age']).toEqual('age-a');
    expect(parsed['foo']).toEqual('foo-a, foo-b');
  });
});
