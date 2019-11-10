describe('requests', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should treat single string arg as url', function (done) {
    axios('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('/foo');
      expect(request.method).toBe('GET');
      done();
    });
  });

  it('should treat method value as lowercase string', function (done) {
    axios({
      url: '/foo',
      method: 'POST'
    }).then(function (response) {
      expect(response.config.method).toBe('post');
      done();
    });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200
      });
    });
  });

  it('should allow string arg as url, and config arg', function (done) {
    axios.post('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('/foo');
      expect(request.method).toBe('POST');
      done();
    });
  });

  it('should make an http request', function (done) {
    axios('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('/foo');
      done();
    });
  });

  it('should reject on network errors', function (done) {
    // disable jasmine.Ajax since we're hitting a non-existant server anyway
    jasmine.Ajax.uninstall();

    var resolveSpy = jasmine.createSpy('resolve');
    var rejectSpy = jasmine.createSpy('reject');

    var finish = function () {
      expect(resolveSpy).not.toHaveBeenCalled();
      expect(rejectSpy).toHaveBeenCalled();
      var reason = rejectSpy.calls.first().args[0];
      expect(reason instanceof Error).toBe(true);
      expect(reason.config.method).toBe('get');
      expect(reason.config.url).toBe('http://thisisnotaserver/foo');
      expect(reason.request).toEqual(jasmine.any(XMLHttpRequest));

      // re-enable jasmine.Ajax
      jasmine.Ajax.install();

      done();
    };

    axios('http://thisisnotaserver/foo')
      .then(resolveSpy, rejectSpy)
      .then(finish, finish);
  });

  it('should reject on abort', function (done) {
    var resolveSpy = jasmine.createSpy('resolve');
    var rejectSpy = jasmine.createSpy('reject');

    var finish = function () {
      expect(resolveSpy).not.toHaveBeenCalled();
      expect(rejectSpy).toHaveBeenCalled();
      var reason = rejectSpy.calls.first().args[0];
      expect(reason instanceof Error).toBe(true);
      expect(reason.config.method).toBe('get');
      expect(reason.config.url).toBe('/foo');
      expect(reason.request).toEqual(jasmine.any(XMLHttpRequest));

      done();
    };

    axios('/foo')
      .then(resolveSpy, rejectSpy)
      .then(finish, finish);

    getAjaxRequest().then(function (request) {
      request.abort();
    });
  });

  it('should reject when validateStatus returns false', function (done) {
    var resolveSpy = jasmine.createSpy('resolve');
    var rejectSpy = jasmine.createSpy('reject');

    axios('/foo', {
      validateStatus: function (status) {
        return status !== 500;
      }
    }).then(resolveSpy)
      .catch(rejectSpy)
      .then(function () {
        expect(resolveSpy).not.toHaveBeenCalled();
        expect(rejectSpy).toHaveBeenCalled();
        var reason = rejectSpy.calls.first().args[0];
        expect(reason instanceof Error).toBe(true);
        expect(reason.message).toBe('Request failed with status code 500');
        expect(reason.config.method).toBe('get');
        expect(reason.config.url).toBe('/foo');
        expect(reason.response.status).toBe(500);

        done();
      });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 500
      });
    });
  });

  it('should resolve when validateStatus returns true', function (done) {
    var resolveSpy = jasmine.createSpy('resolve');
    var rejectSpy = jasmine.createSpy('reject');

    axios('/foo', {
      validateStatus: function (status) {
        return status === 500;
      }
    }).then(resolveSpy)
      .catch(rejectSpy)
      .then(function () {
        expect(resolveSpy).toHaveBeenCalled();
        expect(rejectSpy).not.toHaveBeenCalled();
        done();
      });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 500
      });
    });
  });

  // https://github.com/axios/axios/issues/378
  it('should return JSON when rejecting', function (done) {
    var response;

    axios('/api/account/signup', {
      username: null,
      password: null
    }, {
      method: 'post',
      headers: {
        'Accept': 'application/json'
      }
    })
    .catch(function (error) {
      response = error.response;
    });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 400,
        statusText: 'Bad Request',
        responseText: '{"error": "BAD USERNAME", "code": 1}'
      });

      setTimeout(function () {
        expect(typeof response.data).toEqual('object');
        expect(response.data.error).toEqual('BAD USERNAME');
        expect(response.data.code).toEqual(1);
        done();
      }, 100);
    });
  });

  it('should make cross domian http request', function (done) {
    var response;

    axios.post('www.someurl.com/foo').then(function(res){
      response = res;
    });

    getAjaxRequest().then(function (request) {
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
      }, 100);
    });
  });


  it('should supply correct response', function (done) {
    var response;

    axios.post('/foo').then(function (res) {
      response = res;
    });

    getAjaxRequest().then(function (request) {
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
      }, 100);
    });
  });

  it('should not modify the config url with relative baseURL', function (done) {
    var config;

    axios.get('/foo', {
        baseURL: '/api'
    }).catch(function (error) {
        config = error.config;
    });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 404,
        statusText: 'NOT FOUND',
        responseText: 'Resource not found'
      });

      setTimeout(function () {
        expect(config.baseURL).toEqual('/api');
        expect(config.url).toEqual('/foo');
        done();
      }, 100);
    });
  });

  it('should allow overriding Content-Type header case-insensitive', function (done) {
    var response;
    var contentType = 'application/vnd.myapp.type+json';

    axios.post('/foo', { prop: 'value' }, {
      headers: {
        'content-type': contentType
      }
    }).then(function (res) {
      response = res;
    });

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders['Content-Type']).toEqual(contentType);
      done();
    });
  });

  it('should support binary data as array buffer', function (done) {
    var input = new Int8Array(2);
    input[0] = 1;
    input[1] = 2;

    axios.post('/foo', input.buffer);

    getAjaxRequest().then(function (request) {
      var output = new Int8Array(request.params);
      expect(output.length).toEqual(2);
      expect(output[0]).toEqual(1);
      expect(output[1]).toEqual(2);
      done();
    });
  });

  it('should support binary data as array buffer view', function (done) {
    var input = new Int8Array(2);
    input[0] = 1;
    input[1] = 2;

    axios.post('/foo', input);

    getAjaxRequest().then(function (request) {
      var output = new Int8Array(request.params);
      expect(output.length).toEqual(2);
      expect(output[0]).toEqual(1);
      expect(output[1]).toEqual(2);
      done();
    });
  });

  it('should support array buffer response', function (done) {
    var response;

    function str2ab(str) {
      var buff = new ArrayBuffer(str.length * 2);
      var view = new Uint16Array(buff);
      for ( var i=0, l=str.length; i<l; i++) {
        view[i] = str.charCodeAt(i);
      }
      return buff;
    }

    axios('/foo', {
      responseType: 'arraybuffer'
    }).then(function (data) {
      response = data;
    });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        response: str2ab('Hello world')
      });

      setTimeout(function () {
        expect(response.data.byteLength).toBe(22);
        done();
      }, 100);
    });
  });

  it('should support URLSearchParams', function (done) {
    var params = new URLSearchParams();
    params.append('param1', 'value1');
    params.append('param2', 'value2');

    axios.post('/foo', params);

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders['Content-Type']).toBe('application/x-www-form-urlencoded;charset=utf-8');
      expect(request.params).toBe('param1=value1&param2=value2');
      done();
    });
  });
});
