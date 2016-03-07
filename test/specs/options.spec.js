describe('options', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should default method to get', function (done) {
    axios('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.method).toBe('GET');
      done();
    });
  });

  it('should accept headers', function (done) {
    axios('/foo', {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders['X-Requested-With']).toEqual('XMLHttpRequest');
      done();
    });
  });

  it('should accept params', function (done) {
    axios('/foo', {
      params: {
        foo: 123,
        bar: 456
      }
    });

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('/foo?foo=123&bar=456');
      done();
    });
  });

  it('should allow overriding default headers', function (done) {
    axios('/foo', {
      headers: {
        'Accept': 'foo/bar'
      }
    });

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders['Accept']).toEqual('foo/bar');
      done();
    });
  });

  it('should accept base URL', function (done) {
    var instance = axios.create({
      baseURL: 'http://test.com/'
    });

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('http://test.com/foo');
      done();
    });
  });

  it('should ignore base URL if request URL is absolute', function (done) {
    var instance = axios.create({
      baseURL: 'http://someurl.com/'
    });

    instance.get('http://someotherurl.com/');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('http://someotherurl.com/');
      done();
    });
  });
});
