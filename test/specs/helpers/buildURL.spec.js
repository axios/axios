var buildURL = require('../../../lib/helpers/buildURL');

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

  it('should support nested object params', function () {
    expect(buildURL('/foo', {
      foo: {
        bar: 'baz',
        far: {
          bla: 'boz',
          lala: [
            {
              ba: 'a',
              da: 'b'
            },
            {
              sa: 'c',
              ha: 'd'
            }
          ]
        }
      }
    })).toEqual('/foo?foo[bar]=baz&foo[far][bla]=boz&foo[far][lala][0][ba]=a&foo[far][lala][0][da]=b&foo[far][lala][1][sa]=c&foo[far][lala][1][ha]=d');
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
      foo: '@:$, '
    })).toEqual('/foo?foo=@:$,+');
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

  it('should use serializer if provided', function () {
    serializer = sinon.stub();
    params = {foo: 'bar'};
    serializer.returns('foo=bar');
    expect(buildURL('/foo', params, serializer)).toEqual('/foo?foo=bar');
    expect(serializer.calledOnce).toBe(true);
    expect(serializer.calledWith(params)).toBe(true);
  });
});


