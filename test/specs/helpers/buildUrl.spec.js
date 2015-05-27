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
    })).toEqual('/foo?foo%5B%5D=bar&foo%5B%5D=baz');
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
});

