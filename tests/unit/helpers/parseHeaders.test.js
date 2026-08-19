import { describe, it, expect } from 'vitest';
import parseHeaders from '../../../lib/helpers/parseHeaders.js';

describe('helpers::parseHeaders', () => {
  it('should parse headers', () => {
    const date = new Date();
    const parsed = parseHeaders(
      'Date: ' +
        date.toISOString() +
        '\n' +
        'Content-Type: application/json\n' +
        'Connection: keep-alive\n' +
        'Transfer-Encoding: chunked'
    );

    expect(parsed.date).toEqual(date.toISOString());
    expect(parsed['content-type']).toEqual('application/json');
    expect(parsed.connection).toEqual('keep-alive');
    expect(parsed['transfer-encoding']).toEqual('chunked');
  });

  it('should use array for set-cookie', () => {
    const parsedZero = parseHeaders('');
    const parsedSingle = parseHeaders('Set-Cookie: key=val;');
    const parsedMulti = parseHeaders('Set-Cookie: key=val;\n' + 'Set-Cookie: key2=val2;\n');

    expect(parsedZero['set-cookie']).toBeUndefined();
    expect(parsedSingle['set-cookie']).toEqual(['key=val;']);
    expect(parsedMulti['set-cookie']).toEqual(['key=val;', 'key2=val2;']);
  });

  it('should handle duplicates', () => {
    const parsed = parseHeaders(
      'Age: age-a\n' +
        'Age: age-b\n' +
        'Foo: foo-a\n' +
        'Foo: foo-b\n'
    );

    expect(parsed.age).toEqual('age-a');
    expect(parsed.foo).toEqual('foo-a, foo-b');
  });

  it('should ignore duplicate node-style headers after an empty first value', () => {
    const parsed = parseHeaders('Content-Length:\n' + 'Content-Length: 10\n');

    expect(parsed['content-length']).toEqual('');
  });

  it('should ignore inherited parsed header values', () => {
    Object.prototype['content-length'] = '';
    Object.prototype.foo = true;

    try {
      const parsed = parseHeaders('Content-Length: 10\n' + 'Foo: foo\n' + 'Foo: bar\n');

      expect(parsed['content-length']).toEqual('10');
      expect(parsed.foo).toEqual('foo, bar');
    } finally {
      delete Object.prototype['content-length'];
      delete Object.prototype.foo;
    }
  });
});
