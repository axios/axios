var axios = require('../../index');

describe('options', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should default method to get', function (done) {
    var request;

    axios({
      url: '/foo'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.method).toBe('GET');
      done();
    }, 0);
  });

  it('should accept headers', function (done) {
    var request;

    axios({
      url: '/foo',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['X-Requested-With']).toEqual('XMLHttpRequest');
      done();
    }, 0);
  });

  it('should accept params', function (done) {
    var request;

    axios({
      url: '/foo',
      params: {
        foo: 123,
        bar: 456
      }
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('/foo?foo=123&bar=456');
      done();
    }, 0);
  });

  it('should allow overriding default headers', function (done) {
    var request;

    axios({
      url: '/foo',
      headers: {
        'Accept': 'foo/bar'
      }
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['Accept']).toEqual('foo/bar');
      done();
    }, 0);
  });

  it('should accept base URL', function (done) {
    var request;

    const instance = axios.create({
      baseURL: 'http://test.com/'
    });

    instance.request({
      url: '/foo'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('http://test.com/foo');
      done();
    }, 0);
  });

  it('should ignore base URL if request URL is absolute', function (done) {
    var request;

    const instance = axios.create({
      baseURL: 'http://someurl.com/'
    });

    instance.request({
      url: 'http://someotherurl.com/'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('http://someotherurl.com/');
      done();
    }, 0);
  });
});
