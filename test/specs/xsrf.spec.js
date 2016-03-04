var axios = require('../../index');

describe('xsrf', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    document.cookie = axios.defaults.xsrfCookieName + '=;expires=' + new Date(Date.now() - 86400000).toGMTString();
    jasmine.Ajax.uninstall();
  });

  it('should not set xsrf header if cookie is null', function (done) {
    axios('/foo');

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toEqual(undefined);
      done();
    }, 0);
  });

  it('should set xsrf header if cookie is set', function (done) {
    document.cookie = axios.defaults.xsrfCookieName + '=12345';

    axios('/foo');

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toEqual('12345');
      done();
    }, 0);
  });

  it('should not set xsrf header for cross origin', function (done) {
    document.cookie = axios.defaults.xsrfCookieName + '=12345';

    axios('http://example.com/');

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toEqual(undefined);
      done();
    });
  });

  it('should set xsrf header for cross origin when using withCredentials', function (done) {
    document.cookie = axios.defaults.xsrfCookieName + '=12345';

    axios('http://example.com/', {
      withCredentials: true
    });

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toEqual('12345');
      done();
    });
  });
});
