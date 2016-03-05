var axios = require('../../index');

describe('options', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should default method to get', function (done) {
    axios('/foo');

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      expect(request.method).toBe('GET');
      done();
    }, 0);
  });

  it('should accept headers', function (done) {
    axios('/foo', {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['X-Requested-With']).toEqual('XMLHttpRequest');
      done();
    }, 0);
  });

  it('should accept params', function (done) {
    axios('/foo', {
      params: {
        foo: 123,
        bar: 456
      }
    });

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('/foo?foo=123&bar=456');
      done();
    }, 0);
  });

  it('should allow overriding default headers', function (done) {
    axios('/foo', {
      headers: {
        'Accept': 'foo/bar'
      }
    });

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['Accept']).toEqual('foo/bar');
      done();
    }, 0);
  });

  it('should accept base URL', function (done) {
    var instance = axios.create({
      baseURL: 'http://test.com/'
    });

    instance.get('/foo');

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('http://test.com/foo');
      done();
    }, 0);
  });

  it('should ignore base URL if request URL is absolute', function (done) {
    var instance = axios.create({
      baseURL: 'http://someurl.com/'
    });

    instance.get('http://someotherurl.com/');

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('http://someotherurl.com/');
      done();
    }, 0);
  });
});
