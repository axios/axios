import { describe, it, expect, vi } from 'vitest';
import buildURL, { encode } from '../../../lib/helpers/buildURL.js';

describe('helpers::buildURL', () => {
  it('should support null params', () => {
    expect(buildURL('/foo')).toEqual('/foo');
  });

  it('should support params', () => {
    expect(
      buildURL('/foo', {
        foo: 'bar',
        isUndefined: undefined,
        isNull: null,
      })
    ).toEqual('/foo?foo=bar');
  });

  it('should support sending raw params to custom serializer func', () => {
    const serializer = vi.fn().mockReturnValue('foo=bar');
    const params = { foo: 'bar' };
    const options = {
      serialize: serializer,
    };
    expect(
      buildURL(
        '/foo',
        {
          foo: 'bar',
        },
        options
      )
    ).toEqual('/foo?foo=bar');
    expect(serializer).toHaveBeenCalledTimes(1);
    expect(serializer).toHaveBeenCalledWith(params, options);
  });

  it('should support object params', () => {
    expect(
      buildURL('/foo', {
        foo: {
          bar: 'baz',
        },
      })
    ).toEqual('/foo?foo%5Bbar%5D=baz');
  });

  it('should support date params', () => {
    const date = new Date();

    expect(
      buildURL('/foo', {
        date,
      })
    ).toEqual('/foo?date=' + date.toISOString());
  });

  it('should support array params with encode', () => {
    expect(
      buildURL('/foo', {
        foo: ['bar', 'baz'],
      })
    ).toEqual('/foo?foo%5B%5D=bar&foo%5B%5D=baz');
  });

  it('should support special char params', () => {
    expect(
      buildURL('/foo', {
        foo: ':$, ',
      })
    ).toEqual('/foo?foo=:$,+');
  });

  it('should support existing params', () => {
    expect(
      buildURL('/foo?foo=bar', {
        bar: 'baz',
      })
    ).toEqual('/foo?foo=bar&bar=baz');
  });

  it('should support "length" parameter', () => {
    expect(
      buildURL('/foo', {
        query: 'bar',
        start: 0,
        length: 5,
      })
    ).toEqual('/foo?query=bar&start=0&length=5');
  });

  it('should correct discard url hash mark', () => {
    expect(
      buildURL('/foo?foo=bar#hash', {
        query: 'baz',
      })
    ).toEqual('/foo?foo=bar&query=baz');
  });

  it('should support URLSearchParams', () => {
    expect(buildURL('/foo', new URLSearchParams('bar=baz'))).toEqual('/foo?bar=baz');
  });

  it('should support custom serialize function', () => {
    const params = {
      x: 1,
    };

    const options = {
      serialize: (thisParams, thisOptions) => {
        expect(thisParams).toEqual(params);
        expect(thisOptions).toEqual(options);
        return 'rendered';
      },
    };

    expect(buildURL('/foo', params, options)).toEqual('/foo?rendered');

    const customSerializer = (thisParams) => {
      expect(thisParams).toEqual(params);
      return 'rendered';
    };

    expect(buildURL('/foo', params, customSerializer)).toEqual('/foo?rendered');
  });
});

describe('helpers::encode', () => {
  it('should be exported as a named export', () => {
    expect(typeof encode).toBe('function');
  });

  it('should leave plain ASCII unchanged', () => {
    expect(encode('foo')).toEqual('foo');
  });

  it('should preserve `:` rather than percent-encoding it', () => {
    expect(encode(':')).toEqual(':');
  });

  it('should preserve `$` rather than percent-encoding it', () => {
    expect(encode('$')).toEqual('$');
  });

  it('should preserve `,` rather than percent-encoding it', () => {
    expect(encode(',')).toEqual(',');
  });

  it('should encode space as `+` (form-style) rather than `%20`', () => {
    expect(encode(' ')).toEqual('+');
  });

  it('should still percent-encode characters outside the preserved set', () => {
    expect(encode('a/b')).toEqual('a%2Fb');
    expect(encode('a&b')).toEqual('a%26b');
    expect(encode('a=b')).toEqual('a%3Db');
  });

  it('should apply all substitutions together', () => {
    expect(encode('a:b$c,d e')).toEqual('a:b$c,d+e');
  });
});
