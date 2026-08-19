import { describe, it, expect } from 'vitest';
import formDataToJSON from '../../../lib/helpers/formDataToJSON.js';
import AxiosError from '../../../lib/core/AxiosError.js';

describe('formDataToJSON', () => {
  it('should convert a FormData Object to JSON Object', () => {
    const formData = new FormData();

    formData.append('foo[bar][baz]', '123');

    expect(formDataToJSON(formData)).toEqual({
      foo: {
        bar: {
          baz: '123',
        },
      },
    });
  });

  it('should convert repeatable values as an array', () => {
    const formData = new FormData();

    formData.append('foo', '1');
    formData.append('foo', '2');

    expect(formDataToJSON(formData)).toEqual({
      foo: ['1', '2'],
    });
  });

  it('should keep repeatable values flat for 3+ entries', () => {
    const formData = new FormData();

    formData.append('select3', '301');
    formData.append('select3', '302');
    formData.append('select3', '303');

    expect(formDataToJSON(formData)).toEqual({
      select3: ['301', '302', '303'],
    });
  });

  it('should keep nested repeatable values flat for 3+ entries', () => {
    const formData = new FormData();

    formData.append('foo[bar]', '1');
    formData.append('foo[bar]', '2');
    formData.append('foo[bar]', '3');

    expect(formDataToJSON(formData)).toEqual({
      foo: {
        bar: ['1', '2', '3'],
      },
    });
  });

  it('should convert props with empty brackets to arrays', () => {
    const formData = new FormData();

    formData.append('foo[]', '1');
    formData.append('foo[]', '2');

    expect(formDataToJSON(formData)).toEqual({
      foo: ['1', '2'],
    });
  });

  it('should supported indexed arrays', () => {
    const formData = new FormData();

    formData.append('foo[0]', '1');
    formData.append('foo[1]', '2');

    expect(formDataToJSON(formData)).toEqual({
      foo: ['1', '2'],
    });
  });

  it('should resist prototype pollution CVE', () => {
    const formData = new FormData();

    formData.append('foo[0]', '1');
    formData.append('foo[1]', '2');
    formData.append('__proto__.x', 'hack');
    formData.append('constructor.prototype.y', 'value');

    expect(formDataToJSON(formData)).toEqual({
      foo: ['1', '2'],
      constructor: {
        prototype: {
          y: 'value',
        },
      },
    });

    expect({}.x).toEqual(undefined);
    expect({}.y).toEqual(undefined);
  });

  it('should not write through to inherited objects on Object.prototype', () => {
    Object.defineProperty(Object.prototype, 'injected', {
      value: { hijack: true },
      configurable: true,
      writable: true,
    });

    try {
      const formData = new FormData();

      formData.append('injected.hijack', 'STOLEN');

      const result = formDataToJSON(formData);

      expect(result.injected).toEqual({ hijack: 'STOLEN' });
      expect(Object.prototype.injected.hijack).toBe(true);
    } finally {
      delete Object.prototype.injected;
    }
  });

  it('should throw AxiosError when a field path exceeds the default depth limit', () => {
    const formData = new FormData();

    formData.append('foo' + '[bar]'.repeat(101), '123');

    try {
      formDataToJSON(formData);
      throw new Error('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AxiosError);
      expect(err.code).toBe(AxiosError.ERR_FORM_DATA_DEPTH_EXCEEDED);
      expect(err).not.toBeInstanceOf(RangeError);
    }
  });

  it('should throw AxiosError while tokenizing very deep field paths', () => {
    const formData = new FormData();

    formData.append('foo' + '[bar]'.repeat(10000), '123');

    try {
      formDataToJSON(formData);
      throw new Error('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AxiosError);
      expect(err.code).toBe(AxiosError.ERR_FORM_DATA_DEPTH_EXCEEDED);
      expect(err).not.toBeInstanceOf(RangeError);
    }
  });

  it('should convert a field path at the default depth limit', () => {
    const formData = new FormData();

    formData.append('foo' + '[bar]'.repeat(100), '123');

    let value = formDataToJSON(formData).foo;

    for (let i = 0; i < 100; i++) {
      value = value.bar;
    }

    expect(value).toBe('123');
  });

  // https://github.com/axios/axios/issues/5402
  it('should not split keys on characters other than brackets and dots', () => {
    const formData = new FormData();

    formData.append('user-name', 'johndoe');
    formData.append('first name', 'john');
    formData.append('a+b', 'plus');

    expect(formDataToJSON(formData)).toEqual({
      'user-name': 'johndoe',
      'first name': 'john',
      'a+b': 'plus',
    });
  });

  it('should still split bracket and dot notation', () => {
    const formData = new FormData();

    formData.append('foo[bar-baz]', '1');
    formData.append('a.b-c', '2');

    expect(formDataToJSON(formData)).toEqual({
      foo: { 'bar-baz': '1' },
      a: { 'b-c': '2' },
    });
  });

  it('should treat `.` and `[` as separators inside bracket groups', () => {
    const formData = new FormData();

    formData.append('foo[bar.baz]', '1');
    formData.append('qux[a[b]', '2');

    // `.`, `[` and `]` are not part of a key, so bracket contents are split the
    // same way as dot notation rather than captured as a single literal key.
    expect(formDataToJSON(formData)).toEqual({
      foo: { bar: { baz: '1' } },
      qux: { a: { b: '2' } },
    });
  });

  it('should parse long malformed bracket names in linear time', () => {
    const formData = new FormData();

    // A run of unmatched `[` must not make the tokenizer rescan to the end of
    // the string from each `[` (quadratic). This guards the bracket-capture
    // grammar against regressions by requiring the match to fail fast.
    formData.append('a' + '['.repeat(100000), 'x');

    expect(formDataToJSON(formData)).toEqual({ a: 'x' });
  });
});
