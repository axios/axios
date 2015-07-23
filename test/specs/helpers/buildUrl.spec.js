var buildUrl = require('../../../lib/helpers/buildUrl');

describe('helpers::buildUrl', function () {
  it('should support null params', function () {
    expect(buildUrl('/foo')).toEqual('/foo');
  });

  it('should support params', function () {
    expect(buildUrl('/foo', {
      foo: 'bar'
    })).toEqual('/foo?foo=bar');
  });

  it('should support object params', function () {
    expect(buildUrl('/foo', {
      foo: {
        bar: 'baz'
      }
    })).toEqual('/foo?foo=' + encodeURI('{"bar":"baz"}'));
  });

  it('should support date params', function () {
    var date = new Date();

    expect(buildUrl('/foo', {
      date: date
    })).toEqual('/foo?date=' + date.toISOString());
  });

  it('should support array params', function () {
    expect(buildUrl('/foo', {
      foo: ['bar', 'baz']
    })).toEqual('/foo?foo=bar&foo=baz');
  });

  it('should support special char params', function () {
    expect(buildUrl('/foo', {
      foo: '@:$, '
    })).toEqual('/foo?foo=@:$,+');
  });

  it('should support existing params', function () {
    expect(buildUrl('/foo?foo=bar', {
      bar: 'baz'
    })).toEqual('/foo?foo=bar&bar=baz');
  });

  it('should support "length" parameter', function () {
    expect(buildUrl('/foo', {
      query: 'bar',
      start: 0,
      length: 5
    })).toEqual('/foo?query=bar&start=0&length=5');
  });
});

