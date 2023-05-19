import buildURL from '../../../lib/helpers/buildURL';

describe('helpers::buildURL', function () {
  it('should support null params', function () {
    expect(buildURL('/foo')).toEqual('/foo');
  });

  it('should support params', function () {
    expect(buildURL('/foo', {
      foo: 'bar',
      isUndefined: undefined,
      isNull: null
    })).toEqual('/foo?foo=bar');
  });

  it('should support sending raw params to custom serializer func', function () {
        const serializer = sinon.stub();
        const params = { foo: "bar" };
        serializer.returns("foo=bar");
    expect(
      buildURL(
        "/foo",
        {
          foo: "bar",
        },
        {
          serialize: serializer,
        }
      )
    ).toEqual("/foo?foo=bar");
    expect(serializer.calledOnce).toBe(true);
    expect(serializer.calledWith(params)).toBe(true);
  });

  it('should support object params', function () {
    expect(buildURL('/foo', {
      foo: {
        bar: 'baz'
      }
    })).toEqual('/foo?foo%5Bbar%5D=baz');
  });

  it('should support date params', function () {
    const date = new Date();

    expect(buildURL('/foo', {
      date: date
    })).toEqual('/foo?date=' + date.toISOString());
  });

  it('should support array params with encode', function () {
    expect(buildURL('/foo', {
      foo: ['bar', 'baz']
    })).toEqual('/foo?foo%5B%5D=bar&foo%5B%5D=baz');
  });

  it('should support special char params', function () {
    expect(buildURL('/foo', {
      foo: ':$, '
    })).toEqual('/foo?foo=:$,+');
  });

  it('should support existing params', function () {
    expect(buildURL('/foo?foo=bar', {
      bar: 'baz'
    })).toEqual('/foo?foo=bar&bar=baz');
  });

  it('should support "length" parameter', function () {
    expect(buildURL('/foo', {
      query: 'bar',
      start: 0,
      length: 5
    })).toEqual('/foo?query=bar&start=0&length=5');
  });

  it('should correct discard url hash mark', function () {
    expect(buildURL('/foo?foo=bar#hash', {
      query: 'baz'
    })).toEqual('/foo?foo=bar&query=baz');
  });

  it('should support URLSearchParams', function () {
    expect(buildURL('/foo', new URLSearchParams('bar=baz'))).toEqual('/foo?bar=baz');
  });

  it('should support custom serialize function', function () {
    const params = {
      x: 1
    }

    const options = {
      serialize: (thisParams, thisOptions) => {
        expect(thisParams).toEqual(params);
        expect(thisOptions).toEqual(options);
        return "rendered"
      }
    };

    expect(buildURL('/foo', params, options)).toEqual('/foo?rendered');
  });
});
