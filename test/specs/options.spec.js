describe('options', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should default method to get', function () {
    var request;

    runs(function () {
      axios({
        url: '/foo'
      });
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      expect(request.method).toBe('GET');
    });
  });

  it('should accept headers', function () {
    var request;

    runs(function () {
      axios({
        url: '/foo',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      expect(request.requestHeaders['X-Requested-With']).toEqual('XMLHttpRequest');
    });
  });

  it('should accept params', function () {
    var request;

    runs(function () {
      axios({
        url: '/foo',
        params: {
          foo: 123,
          bar: 456
        }
      });
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      expect(request.url).toBe('/foo?foo=123&bar=456');
    });
  });

  it('should allow overriding default headers', function () {
    var request;

    runs(function () {
      axios({
        url: '/foo',
        headers: {
          'Accept': 'foo/bar'
        }
      });
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      expect(request.requestHeaders['Accept']).toEqual('foo/bar');
    });
  });
});
