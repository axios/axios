var buildURL = require('../../../lib/helpers/buildURL');
var URLSearchParams = require('url-search-params');

describe('helpers::buildURL', function () {
  it('should support null params', function () {
    expect(buildURL('/foo')).toEqual('/foo');
  });

  it('should support params', function () {
    expect(buildURL('/foo', {
      foo: 'bar'
    })).toEqual('/foo?foo=bar');
  });

  it('should support object params', function () {
    expect(buildURL('/foo', {
      foo: {
        bar: 'baz'
      }
    })).toEqual('/foo?foo[bar]=baz');
  });

  it('should support date params', function () {
    var date = new Date();

    expect(buildURL('/foo', {
      date: date
    })).toEqual('/foo?date=' + date.toISOString());
  });

  it('should support array params', function () {
    expect(buildURL('/foo', {
      foo: ['bar', 'baz']
    })).toEqual('/foo?foo[]=bar&foo[]=baz');
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
    var params = {
      x: 1
    };

    var options = {
      serialize: function (thisParams, thisOptions) {
        expect(thisParams).toEqual(params);
        expect(thisOptions).toEqual(options);
        return 'rendered';
      }
    };

    expect(buildURL('/foo', params, options)).toEqual('/foo?rendered');
  });
});
