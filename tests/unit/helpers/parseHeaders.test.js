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

  it('should parse header names that match Object prototype properties', () => {
    const parsed = parseHeaders(
      '__proto__: proto-value\n' +
        'Constructor: constructor-value\n' +
        'ToString: tostring-value'
    );

    expect(Object.getPrototypeOf(parsed)).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(parsed, '__proto__')).toBe(true);
    expect(parsed['__proto__']).toEqual('proto-value');
    expect(parsed.constructor).toEqual('constructor-value');
    expect(parsed.tostring).toEqual('tostring-value');
  });

  it('should ignore duplicate singleton headers even when the first value is empty', () => {
    const parsed = parseHeaders('Content-Type:\nContent-Type: text/plain');

    expect(parsed['content-type']).toEqual('');
  });
});
