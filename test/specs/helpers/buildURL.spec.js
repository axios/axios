var buildURL = require('../../../lib/helpers/buildURL');
var URLSearchParams = require('url-search-params');

describe('helpers::buildURL', () => {
  it('should support null params', () => {
    expect(buildURL('/foo')).toEqual('/foo');
  });

  it('should support params', () => {
    expect(buildURL('/foo', {
      foo: 'bar'
    })).toEqual('/foo?foo=bar');
  });

  it('should support object params', () => {
    expect(buildURL('/foo', {
      foo: {
        bar: 'baz'
      }
    })).toEqual('/foo?foo=' + encodeURI('{"bar":"baz"}'));
  });

  it('should support date params', () => {
    var date = new Date();

    expect(buildURL('/foo', {
      date: date
    })).toEqual('/foo?date=' + date.toISOString());
  });

  it('should support array params', () => {
    expect(buildURL('/foo', {
      foo: ['bar', 'baz']
    })).toEqual('/foo?foo[]=bar&foo[]=baz');
  });

  it('should support special char params', () => {
    expect(buildURL('/foo', {
      foo: '@:$, '
    })).toEqual('/foo?foo=@:$,+');
  });

  it('should support existing params', () => {
    expect(buildURL('/foo?foo=bar', {
      bar: 'baz'
    })).toEqual('/foo?foo=bar&bar=baz');
  });

  it('should support "length" parameter', () => {
    expect(buildURL('/foo', {
      query: 'bar',
      start: 0,
      length: 5
    })).toEqual('/foo?query=bar&start=0&length=5');
  });

  it('should correct discard url hash mark', () => {
    expect(buildURL('/foo?foo=bar#hash', {
      query: 'baz'
    })).toEqual('/foo?foo=bar&query=baz');
  });

  it('should use serializer if provided', () => {
    serializer = sinon.stub();
    params = {foo: 'bar'};
    serializer.returns('foo=bar');
    expect(buildURL('/foo', params, serializer)).toEqual('/foo?foo=bar');
    expect(serializer.calledOnce).toBe(true);
    expect(serializer.calledWith(params)).toBe(true);
  });

  it('should support URLSearchParams', () => {
    expect(buildURL('/foo', new URLSearchParams('bar=baz'))).toEqual('/foo?bar=baz');
  });
});
