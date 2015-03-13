describe('wrapper', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should make an http request', function (done) {
    var request;

    axios({
      url: '/foo'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('/foo');
      done();
    }, 0);
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

  it('should support binary data as array buffer', function (done) {
    var request;
    var input = new Int8Array(2);
    input[0] = 1;
    input[1] = 2;

    axios({
      method: 'post',
      url: '/foo',
      data: input.buffer
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      var output = new Int8Array(request.params.buffer);
      expect(output.length).toEqual(2);
      expect(output[0]).toEqual(1);
      expect(output[1]).toEqual(2);
      done();
    }, 0);
  });

  it('should support binary data as array buffer view', function (done) {
    var request;
    var input = new Int8Array(2);
    input[0] = 1;
    input[1] = 2;

    axios({
      method: 'post',
      url: '/foo',
      data: input
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      var output = new Int8Array(request.params.buffer);
      expect(output.length).toEqual(2);
      expect(output[0]).toEqual(1);
      expect(output[1]).toEqual(2);
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

  it('should supply correct response', function (done) {
    var request, response;

    axios({
      method: 'post',
      url: '/foo'
    }).then(function (res) {
      response = res;
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      request.respondWith({
        status: 200,
        statusText: 'OK',
        responseText: '{"foo": "bar"}',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setTimeout(function () {
        expect(response.data.foo).toEqual('bar');
        expect(response.status).toEqual(200);
        expect(response.statusText).toEqual('OK');
        expect(response.headers['content-type']).toEqual('application/json');
        done();
      }, 0);
    }, 0);
  });

  it('should support array buffer response', function (done) {
    var request, response;

    function str2ab(str) {
      var buff = new ArrayBuffer(str.length * 2);
      var view = new Uint16Array(buff);
      for ( var i=0, l=str.length; i<l; i++) {
        view[i] = str.charCodeAt(i);
      }
      return buff;
    }

    axios({
      url: '/foo',
      responseType: 'arraybuffer'
    }).then(function (data) {
      response = data;
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      request.respondWith({
        status: 200,
        response: str2ab('Hello world')
      });

      setTimeout(function () {
        expect(response.data.byteLength).toBe(22);
        done();
      }, 0);
    }, 0);
  });

});
