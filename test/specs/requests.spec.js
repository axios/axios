describe('requests', () => {
  beforeEach(() => {
    jasmine.Ajax.install();
  });

  afterEach(() => {
    jasmine.Ajax.uninstall();
  });

  it('should treat single string arg as url', done => {
    axios('/foo');

    getAjaxRequest().then(request => {
      expect(request.url).toBe('/foo');
      expect(request.method).toBe('GET');
      done();
    });
  });

  it('should treat method value as lowercase string', done => {
    axios({
      url: '/foo',
      method: 'POST'
    }).then(response => {
      expect(response.config.method).toBe('post');
      done();
    });

    getAjaxRequest().then(request => {
      request.respondWith({
        status: 200
      });
    });
  });

  it('should allow string arg as url, and config arg', done => {
    axios.post('/foo');

    getAjaxRequest().then(request => {
      expect(request.url).toBe('/foo');
      expect(request.method).toBe('POST');
      done();
    });
  });

  it('should make an http request', done => {
    axios('/foo');

    getAjaxRequest().then(request => {
      expect(request.url).toBe('/foo');
      done();
    });
  });

  it('should reject on network errors', done => {
    // disable jasmine.Ajax since we're hitting a non-existant server anyway
    jasmine.Ajax.uninstall();

    var resolveSpy = jasmine.createSpy('resolve');
    var rejectSpy = jasmine.createSpy('reject');

    var finish = () => {
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

  it('should reject on abort', done => {
    var resolveSpy = jasmine.createSpy('resolve');
    var rejectSpy = jasmine.createSpy('reject');

    var finish = () => {
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

    getAjaxRequest().then(request => {
      request.abort();
    });
  });

  it('should reject when validateStatus returns false', done => {
    var resolveSpy = jasmine.createSpy('resolve');
    var rejectSpy = jasmine.createSpy('reject');

    axios('/foo', {
      validateStatus: status => status !== 500
    }).then(resolveSpy)
      .catch(rejectSpy)
      .then(() => {
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

    getAjaxRequest().then(request => {
      request.respondWith({
        status: 500
      });
    });
  });

  it('should resolve when validateStatus returns true', done => {
    var resolveSpy = jasmine.createSpy('resolve');
    var rejectSpy = jasmine.createSpy('reject');

    axios('/foo', {
      validateStatus: status => status === 500
    }).then(resolveSpy)
      .catch(rejectSpy)
      .then(() => {
        expect(resolveSpy).toHaveBeenCalled();
        expect(rejectSpy).not.toHaveBeenCalled();
        done();
      });

    getAjaxRequest().then(request => {
      request.respondWith({
        status: 500
      });
    });
  });

  // https://github.com/axios/axios/issues/378
  it('should return JSON when rejecting', done => {
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
    .catch(error => {
      response = error.response;
    });

    getAjaxRequest().then(request => {
      request.respondWith({
        status: 400,
        statusText: 'Bad Request',
        responseText: '{"error": "BAD USERNAME", "code": 1}'
      });

      setTimeout(() => {
        expect(typeof response.data).toEqual('object');
        expect(response.data.error).toEqual('BAD USERNAME');
        expect(response.data.code).toEqual(1);
        done();
      }, 100);
    });
  });

  it('should make cross domian http request', done => {
    var response;

    axios.post('www.someurl.com/foo').then(res => {
      response = res;
    });

    getAjaxRequest().then(request => {
      request.respondWith({
        status: 200,
        statusText: 'OK',
        responseText: '{"foo": "bar"}',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setTimeout(() => {
        expect(response.data.foo).toEqual('bar');
        expect(response.status).toEqual(200);
        expect(response.statusText).toEqual('OK');
        expect(response.headers['content-type']).toEqual('application/json');
        done();
      }, 100);
    });
  });


  it('should supply correct response', done => {
    var response;

    axios.post('/foo').then(res => {
      response = res;
    });

    getAjaxRequest().then(request => {
      request.respondWith({
        status: 200,
        statusText: 'OK',
        responseText: '{"foo": "bar"}',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setTimeout(() => {
        expect(response.data.foo).toEqual('bar');
        expect(response.status).toEqual(200);
        expect(response.statusText).toEqual('OK');
        expect(response.headers['content-type']).toEqual('application/json');
        done();
      }, 100);
    });
  });

  it('should allow overriding Content-Type header case-insensitive', done => {
    var response;
    var contentType = 'application/vnd.myapp.type+json';

    axios.post('/foo', { prop: 'value' }, {
      headers: {
        'content-type': contentType
      }
    }).then(res => {
      response = res;
    });

    getAjaxRequest().then(request => {
      expect(request.requestHeaders['Content-Type']).toEqual(contentType);
      done();
    });
  });

  it('should support binary data as array buffer', done => {
    var input = new Int8Array(2);
    input[0] = 1;
    input[1] = 2;

    axios.post('/foo', input.buffer);

    getAjaxRequest().then(request => {
      var output = new Int8Array(request.params);
      expect(output.length).toEqual(2);
      expect(output[0]).toEqual(1);
      expect(output[1]).toEqual(2);
      done();
    });
  });

  it('should support binary data as array buffer view', done => {
    var input = new Int8Array(2);
    input[0] = 1;
    input[1] = 2;

    axios.post('/foo', input);

    getAjaxRequest().then(request => {
      var output = new Int8Array(request.params);
      expect(output.length).toEqual(2);
      expect(output[0]).toEqual(1);
      expect(output[1]).toEqual(2);
      done();
    });
  });

  it('should support array buffer response', done => {
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
    }).then(data => {
      response = data;
    });

    getAjaxRequest().then(request => {
      request.respondWith({
        status: 200,
        response: str2ab('Hello world')
      });

      setTimeout(() => {
        expect(response.data.byteLength).toBe(22);
        done();
      }, 100);
    });
  });

  it('should support URLSearchParams', done => {
    var params = new URLSearchParams();
    params.append('param1', 'value1');
    params.append('param2', 'value2');

    axios.post('/foo', params);

    getAjaxRequest().then(request => {
      expect(request.requestHeaders['Content-Type']).toBe('application/x-www-form-urlencoded;charset=utf-8');
      expect(request.params).toBe('param1=value1&param2=value2');
      done();
    });
  });
});
