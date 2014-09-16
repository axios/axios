describe('options', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  it('should default method to get', function () {
    axios({
      url: '/foo'
    });

    var request = jasmine.Ajax.requests.mostRecent();
    expect(request.method).toBe('get');
  });

  it('should accept headers', function () {
    axios({
      url: '/foo',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    var request = jasmine.Ajax.requests.mostRecent();
    expect(request.requestHeaders['X-Requested-With']).toEqual('XMLHttpRequest');
  });

  it('should accept params', function () {
    axios({
      url: '/foo',
      params: {
        foo: 123,
        bar: 456
      }
    });

    var request = jasmine.Ajax.requests.mostRecent();
    expect(request.url).toBe('/foo?foo=123&bar=456');
  });

  it('should allow overriding default headers', function () {
    axios({
      url: '/foo',
      headers: {
        'Accept': 'foo/bar'
      }
    });

    var request = jasmine.Ajax.requests.mostRecent();
    expect(request.requestHeaders['Accept']).toEqual('foo/bar');
  });
});