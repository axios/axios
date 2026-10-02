import { describe, it, expect } from 'vitest';
import parseHeaders from '../../../lib/helpers/parseHeaders.js';

describe('helpers::parseHeaders', () => {
  it.each(['', undefined, null])('should return an empty dictionary for %s', (rawHeaders) => {
    const parsed = parseHeaders(rawHeaders);

    expect(Object.getPrototypeOf(parsed)).toBeNull();
    expect(Object.keys(parsed)).toEqual([]);
  });

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

  it('should retain prototype-like header names as own dictionary entries', () => {
    const parsed = parseHeaders(
      '__proto__: first\n' +
        '__proto__: second\n' +
        'Constructor: first\n' +
        'constructor: second\n' +
        'Prototype: value\n'
    );

    expect(Object.getPrototypeOf(parsed)).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(parsed, '__proto__')).toBe(true);
    expect(parsed.__proto__).toBe('first, second');
    expect(parsed.constructor).toBe('first, second');
    expect(parsed.prototype).toBe('value');
  });

  it.each(['x-parseheaders-accessor', 'set-cookie'])(
    'should not invoke inherited accessors while parsing %s',
    (name) => {
      const descriptor = Object.getOwnPropertyDescriptor(Object.prototype, name);

      try {
        Object.defineProperty(Object.prototype, name, {
          configurable: true,
          get() {
            throw new Error('inherited header getter');
          },
          set() {
            throw new Error('inherited header setter');
          },
        });

        const parsed = parseHeaders(name + ': first\n' + name + ': second\n');

        expect(Object.prototype.hasOwnProperty.call(parsed, name)).toBe(true);
        expect(parsed[name]).toEqual(name === 'set-cookie' ? ['first', 'second'] : 'first, second');
      } finally {
        if (descriptor) {
          Object.defineProperty(Object.prototype, name, descriptor);
        } else {
          delete Object.prototype[name];
        }
      }
    }
  );

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
