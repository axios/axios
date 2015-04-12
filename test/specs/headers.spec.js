var axios = require('../../index');

describe('headers', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should add X-Requested-With header', function (done) {
    var request;

    axios({
      url: '/foo'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['X-Requested-With']).toEqual('XMLHttpRequest');
      done();
    });
  });

  it('should default common headers', function (done) {
    var request;
    var headers = axios.defaults.headers.common;

    axios({
      url: '/foo'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
          expect(request.requestHeaders[key]).toEqual(headers[key]);
        }
      }
      done();
    }, 0);
  });

  it('should add extra headers for post', function (done) {
    var request;
    var headers = axios.defaults.headers.common;

    axios({
      method: 'post',
      url: '/foo',
      data: 'fizz=buzz'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
          expect(request.requestHeaders[key]).toEqual(headers[key]);
        }
      }
      done();
    }, 0);
  });

  it('should use application/json when posting an object', function (done) {
    var request;

    axios({
      url: '/foo/bar',
      method: 'post',
      data: {
        firstName: 'foo',
        lastName: 'bar'
      }
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['Content-Type']).toEqual('application/json;charset=utf-8');
      done();
    }, 0);
  });

  it('should remove content-type if data is empty', function (done) {
    var request;

    axios({
      method: 'post',
      url: '/foo'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['content-type']).toEqual(undefined);
      done();
    }, 0);
  });
});
