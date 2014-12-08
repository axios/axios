describe('xsrf', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    document.cookie = axios.defaults.xsrfCookieName + '=;expires=' + new Date(Date.now() - 86400000).toGMTString();
    jasmine.Ajax.uninstall();
  });

  it('should not set xsrf header if cookie is null', function () {
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
      expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toEqual(undefined);
    });
  });

  it('should set xsrf header if cookie is set', function () {
    var request;
    document.cookie = axios.defaults.xsrfCookieName + '=12345';

    runs(function () {
      axios({
        url: '/foo'
      });
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toEqual('12345');
    });
  });
});
