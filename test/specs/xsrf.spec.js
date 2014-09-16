describe('xsrf', function () {
  afterEach(function () {
    document.cookie = axios.defaults.xsrfCookieName + '=;expires=' + new Date(Date.now() - 86400000).toGMTString();
  });

  it('should not set xsrf header if cookie is null', function () {
    axios({
      url: '/foo'
    });

    var request = jasmine.Ajax.requests.mostRecent();
    expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toEqual(undefined);
  });

  it('should set xsrf header if cookie is set', function () {
    document.cookie = axios.defaults.xsrfCookieName + '=12345';
    axios({
      url: '/foo'
    });

    var request = jasmine.Ajax.requests.mostRecent();
    expect(request.requestHeaders[axios.defaults.xsrfHeaderName]).toEqual('12345');
  });
});