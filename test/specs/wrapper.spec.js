describe('wrapper', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should make an http request', function () {
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
      expect(request.url).toBe('/foo')
    });
  });

  it('should default common headers', function () {
    var request;
    var headers = axios.defaults.headers.common;

    runs(function () {
      axios({
        url: '/foo'
      });
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
          expect(request.requestHeaders[key]).toEqual(headers[key]);
        }
      }
    });
  });

  it('should add extra headers for post', function () {
    var request;
    var headers = axios.defaults.headers.common;

    runs(function () {
      axios({
        method: 'post',
        url: '/foo',
        data: 'fizz=buzz'
      });
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
          expect(request.requestHeaders[key]).toEqual(headers[key]);
        }
      }
    });
  });

  it('should use application/json when posting an object', function () {
    var request;

    runs(function () {
      axios({
        url: '/foo/bar',
        method: 'post',
        data: {
          firstName: 'foo',
          lastName: 'bar'
        }
      });
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      expect(request.requestHeaders['Content-Type']).toEqual('application/json;charset=utf-8');
    });
  });

  it('should support binary data as array buffer', function () {
    var request;
    var input = new Int8Array(2);
    input[0] = 1;
    input[1] = 2;

    runs(function () {
      axios({
        method: 'post',
        url: '/foo',
        data: input.buffer
      });
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      var output = new Int8Array(request.params.buffer);
      expect(output.length).toEqual(2);
      expect(output[0]).toEqual(1);
      expect(output[1]).toEqual(2);
    });
  });

  it('should support binary data as array buffer view', function () {
    var request;
    var input = new Int8Array(2);
    input[0] = 1;
    input[1] = 2;

    runs(function () {
      axios({
        method: 'post',
        url: '/foo',
        data: input
      });
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      var output = new Int8Array(request.params.buffer);
      expect(output.length).toEqual(2);
      expect(output[0]).toEqual(1);
      expect(output[1]).toEqual(2);
    });
  });

  it('should remove content-type if data is empty', function () {
    var request;

    runs(function () {
      axios({
        method: 'post',
        url: '/foo'
      });
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      expect(request.requestHeaders['content-type']).toEqual(undefined);
    });
  });

  // TODO this won't work until karma-jasmine updates to jasmine-ajax 2.99.0
  /*
  it('should support array buffer response', function () {
    var request, response;

    runs(function () {
      axios({
        url: '/foo',
        responseType: 'arraybuffer'
      }).then(function (data) {
        response = data;
      });
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      request.response({
        status: 200,
        response: new ArrayBuffer(16)
      });
      request.response = new ArrayBuffer(16);
    });

    waitsFor(function () {
      return response;
    }, 'waiting for the response', 100);

    runs(function () {
      expect(response.data.byteLength).toBe(16);
    });
  });
  */

});
