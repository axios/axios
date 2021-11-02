var buildURL = require('../../../lib/helpers/buildURL');
var URLSearchParams = require('url-search-params');

describe('helpers::buildURL', function() {
  it('should support null params', function() {
    expect(buildURL('/foo')).toEqual('/foo');
  });

  it('should support params', function() {
    expect(buildURL('/foo', {
      foo: 'bar'
    })).toEqual('/foo?foo=bar');
  });

  it('should support object params', function() {
    expect(buildURL('/foo', {
      foo: {
        bar: 'baz'
      }
    })).toEqual('/foo?foo=' + encodeURI('{"bar":"baz"}'));
  });

  it('should support date params', function() {
    var date = new Date();

    expect(buildURL('/foo', {
      date: date
    })).toEqual('/foo?date=' + date.toISOString());
  });

  it('should support array params', function() {
    expect(buildURL('/foo', {
      foo: ['bar', 'baz']
    })).toEqual('/foo?foo[]=bar&foo[]=baz');
  });

  it('should support special char params', function() {
    expect(buildURL('/foo', {
      foo: ':$, '
    })).toEqual('/foo?foo=:$,+');
  });

  it('should support existing params', function() {
    expect(buildURL('/foo?foo=bar', {
      bar: 'baz'
    })).toEqual('/foo?foo=bar&bar=baz');
  });

  it('should support "length" parameter', function() {
    expect(buildURL('/foo', {
      query: 'bar',
      start: 0,
      length: 5
    })).toEqual('/foo?query=bar&start=0&length=5');
  });

  it('should correct discard url hash mark', function() {
    expect(buildURL('/foo?foo=bar#hash', {
      query: 'baz'
    })).toEqual('/foo?foo=bar&query=baz');
  });

  it('should use serializer if provided', function() {
    serializer = sinon.stub();
    params = { foo: 'bar' };
    serializer.returns('foo=bar');
    expect(buildURL('/foo', params, serializer)).toEqual('/foo?foo=bar');
    expect(serializer.calledOnce).toBe(true);
    expect(serializer.calledWith(params)).toBe(true);
  });

  it('should support URLSearchParams', function() {
    expect(buildURL('/foo', new URLSearchParams('bar=baz'))).toEqual('/foo?bar=baz');
  });

  // buildUrl restfulParams support tests
  it('should support RestfulParams', function() {
    expect(
      buildURL('/some_base_url/:kinda_id_with_CAPITAL_LeTtErS',
        undefined,
        undefined,
        { kinda_id_with_CAPITAL_LeTtErS: 'should_be_replaced' }
      )
    ).toEqual('/some_base_url/should_be_replaced');
  });

  it('should not replace escaped expression', function() {
    expect(
      buildURL('/another_base_url/\\:should_not_be_replaced',
        undefined,
        undefined,
        { should_not_be_replaced: 'NO REPLACEMENT' }
      )
    ).toEqual('/another_base_url/\\:should_not_be_replaced');
  });

  it('should support number', function() {
    expect(
      buildURL('/more_base_urls/:id',
        undefined,
        undefined,
        { id: 300 }
      )
    ).toEqual('/more_base_urls/300');
  });

  it('should support bool', function() {
    expect(
      buildURL('/damn_base_urls/:fucked',
        undefined,
        undefined,
        { fucked: true }
      )
    ).toEqual('/damn_base_urls/true');
  });

  it('should support multiple params', function() {
    expect(
      buildURL('/fuck_urls/:fuck/you/:tests',
        undefined,
        undefined,
        {fuck: 'FFFFFFFFFFUCK', tests: 'TESTSSSSSSS'}
      )
    ).toEqual('/fuck_urls/FFFFFFFFFFUCK/you/TESTSSSSSSS');
  });
});
