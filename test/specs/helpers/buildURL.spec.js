var buildURL = require('../../../lib/helpers/buildURL');
var URLSearchParams = require('url-search-params');

describe('helpers::buildURL', function () {
  it('should support null params', function () {
    expect(buildURL('/foo')).toEqual('/foo');
  });

  it('should support params', function () {
    expect(buildURL('/foo', {
      params: {
        foo: 'bar'
      }
    })).toEqual('/foo?foo=bar');
  });

  it('should support object params', function () {
    expect(buildURL('/foo', {
      params: {
        foo: {
          bar: 'baz'
        }
      }
    })).toEqual('/foo?foo=' + encodeURI('{"bar":"baz"}'));
  });

  it('should support date params', function () {
    var date = new Date();

    expect(buildURL('/foo', {
      params: {
        date: date
      }
    })).toEqual('/foo?date=' + date.toISOString());
  });

  it('should support array params', function () {
    expect(buildURL('/foo', {
      params: {
        foo: ['bar', 'baz']
      }
    })).toEqual('/foo?foo[]=bar&foo[]=baz');
  });

  it('should support special char params', function () {
    expect(buildURL('/foo', {
      params: {
        foo: ':$, '
      }
    })).toEqual('/foo?foo=:$,+');
  });

  it('should support existing params', function () {
    expect(buildURL('/foo?foo=bar', {
      params: {
        bar: 'baz'
      }
    })).toEqual('/foo?foo=bar&bar=baz');
  });

  it('should support "length" parameter', function () {
    expect(buildURL('/foo', {
      params: {
        query: 'bar',
        start: 0,
        length: 5
      }
    })).toEqual('/foo?query=bar&start=0&length=5');
  });

  it('should correct discard url hash mark', function () {
    expect(buildURL('/foo?foo=bar#hash', {
      params: {
        query: 'baz'
      }
    })).toEqual('/foo?foo=bar&query=baz');
  });

  it('should use serializer if provided', function () {
    serializer = sinon.stub();
    params = { foo: 'bar' };
    serializer.returns('foo=bar');
    expect(buildURL('/foo', { params: params, paramsSerializer: serializer })).toEqual('/foo?foo=bar');
    expect(serializer.calledOnce).toBe(true);
    expect(serializer.calledWith(params)).toBe(true);
  });

  it('should support URLSearchParams', function () {
    expect(buildURL('/foo', { params: new URLSearchParams('bar=baz') })).toEqual('/foo?bar=baz');
  });

  it('should support keepPathnameDecoded', function () {
    expect(buildURL('/TripPinRESTierService/(S(djtqmgxgkc3viudbv33lqjxb))/People(%27russellwhyte%27)', {
      params: {
        foo: {
          bar: 'baz'
        },
      },
      keepPathnameDecoded: true
    })).toEqual("/TripPinRESTierService/(S(djtqmgxgkc3viudbv33lqjxb))/People('russellwhyte')?foo=" + encodeURI('{"bar":"baz"}'));
  });
});
