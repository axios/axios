describe('axios', function () {
  describe('api', function () {
    it('should have request method helpers', function () {
      expect(typeof axios.get).toEqual('function');
      expect(typeof axios.head).toEqual('function');
      expect(typeof axios.delete).toEqual('function');
      expect(typeof axios.post).toEqual('function');
      expect(typeof axios.put).toEqual('function');
      expect(typeof axios.patch).toEqual('function');
    });

    it('should have promise method helpers', function () {
      var promise = axios();

      expect(typeof promise.then).toEqual('function');
      expect(typeof promise.catch).toEqual('function');
      expect(typeof promise.success).toEqual('function');
      expect(typeof promise.error).toEqual('function');
    });

    it('should have defaults', function () {
      expect(typeof axios.defaults).toEqual('object');
      expect(typeof axios.defaults.headers).toEqual('object');
    });
  });

  describe('wrapper', function () {
    beforeEach(function () {
      jasmine.Ajax.install();
    });

    it('should make an http request', function () {
      axios({
        url: '/foo'
      });

      var request = jasmine.Ajax.requests.mostRecent();
      expect(request.url).toBe('/foo');
    });

    it('should default common headers', function () {
      axios({
        url: '/foo'
      });

      var request = jasmine.Ajax.requests.mostRecent();
      var headers = axios.defaults.headers.common;
      for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
          expect(request.requestHeaders[key]).toEqual(headers[key]);
        }
      }
    });

    it('should add extra headers for post', function () {
      axios({
        method: 'post',
        url: '/foo',
        data: {
          firstName: 'foo',
          lastName: 'bar'
        }
      });

      var request = jasmine.Ajax.requests.mostRecent();
      var headers = axios.defaults.headers.post;
      for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
          expect(request.requestHeaders[key]).toEqual(headers[key]);
        }
      }
    });

    it('should remove content-type if data is empty', function () {
      axios({
        method: 'post',
        url: '/foo'
      });

      var request = jasmine.Ajax.requests.mostRecent();
      expect(request.requestHeaders['content-type']).toEqual(undefined);
    });
  });

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
});