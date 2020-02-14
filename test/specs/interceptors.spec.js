describe('interceptors', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
    axios.interceptors.request.handlers = [];
    axios.interceptors.response.handlers = [];
  });

  it('should add a request interceptor (asynchronous by default)', function (done) {
    var asyncFlag = false;
    axios.interceptors.request.use(function (config) {
      config.headers.test = 'added by interceptor';
      expect(asyncFlag).toBe(true);
      return config;
    });

    axios('/foo');
    asyncFlag = true;

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders.test).toBe('added by interceptor');
      done();
    });
  });

  it('should add a request interceptor (explicitly flagged as asynchronous)', function (done) {
    var asyncFlag = false;
    axios.interceptors.request.use(function (config) {
      config.headers.test = 'added by interceptor';
      expect(asyncFlag).toBe(true);
      return config;
    }, null, { synchronous: false });

    axios('/foo');
    asyncFlag = true;

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders.test).toBe('added by interceptor');
      done();
    });
  });

  it('should add a request interceptor that is executed synchronously when flag is provided', function (done) {
    var asyncFlag = false;
    axios.interceptors.request.use(function (config) {
      config.headers.test = 'added by synchronous interceptor';
      expect(asyncFlag).toBe(false);
      return config;
    }, null, { synchronous: true });

    axios('/foo');
    asyncFlag = true;

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders.test).toBe('added by synchronous interceptor');
      done();
    });
  });

  it('should execute asynchronously when not all interceptors are explicitly flagged as synchronous', function (done) {
    var asyncFlag = false;
    axios.interceptors.request.use(function (config) {
      config.headers.foo = 'uh oh, async';
      expect(asyncFlag).toBe(true);
      return config;
    });

    axios.interceptors.request.use(function (config) {
      config.headers.test = 'added by synchronous interceptor';
      expect(asyncFlag).toBe(true);
      return config;
    }, null, { synchronous: true });

    axios.interceptors.request.use(function (config) {
      config.headers.test = 'added by the async interceptor';
      expect(asyncFlag).toBe(true);
      return config;
    });

    axios('/foo');
    asyncFlag = true;

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders.foo).toBe('uh oh, async');
      /* request interceptors have a reversed execution order */
      expect(request.requestHeaders.test).toBe('added by synchronous interceptor');
      done();
    });
  });

  it('runs the interceptor if runWhen function is provided and resolves to true', function (done) {
    function onGetCall(config) {
      return config.method === 'get';
    }
    axios.interceptors.request.use(function (config) {
      config.headers.test = 'special get headers';
      return config;
    }, null, { runWhen: onGetCall });

    axios('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders.test).toBe('special get headers');
      done();
    });
  });

  it('does not run the interceptor if runWhen function is provided and resolves to false', function (done) {
    function onPostCall(config) {
      return config.method === 'post';
    }
    axios.interceptors.request.use(function (config) {
      config.headers.test = 'special get headers';
      return config;
    }, null, { runWhen: onPostCall });

    axios('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders.test).toBeUndefined()
      done();
    });
  });

  it('does not run async interceptor if runWhen function is provided and resolves to false (and run synchronously)', function (done) {
    var asyncFlag = false;

    function onPostCall(config) {
      return config.method === 'post';
    }
    axios.interceptors.request.use(function (config) {
      config.headers.test = 'special get headers';
      return config;
    }, null, { synchronous: false, runWhen: onPostCall });

    axios.interceptors.request.use(function (config) {
      config.headers.sync = 'hello world';
      expect(asyncFlag).toBe(false);
      return config;
    }, null, { synchronous: true });

    axios('/foo');
    asyncFlag = true

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders.test).toBeUndefined()
      expect(request.requestHeaders.sync).toBe('hello world')
      done();
    });
  });

  it('should add a request interceptor with an onRejected block that is called if interceptor code fails', function (done) {
    var rejectedSpy = jasmine.createSpy('rejectedSpy');
    var error = new Error('deadly error');
    axios.interceptors.request.use(function () {
      throw error;
    }, rejectedSpy, { synchronous: true });

    axios('/foo');

    getAjaxRequest().then(function () {
      expect(rejectedSpy).toHaveBeenCalledWith(error);
      done();
    });
  });

  it('should add a request interceptor that returns a new config object', function (done) {
    axios.interceptors.request.use(function () {
      return {
        url: '/bar',
        method: 'post'
      };
    });

    axios('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.method).toBe('POST');
      expect(request.url).toBe('/bar');
      done();
    });
  });

  it('should add a request interceptor that returns a promise', function (done) {
    axios.interceptors.request.use(function (config) {
      return new Promise(function (resolve) {
        // do something async
        setTimeout(function () {
          config.headers.async = 'promise';
          resolve(config);
        }, 100);
      });
    });

    axios('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders.async).toBe('promise');
      done();
    });
  });

  it('should add multiple request interceptors', function (done) {
    axios.interceptors.request.use(function (config) {
      config.headers.test1 = '1';
      return config;
    });
    axios.interceptors.request.use(function (config) {
      config.headers.test2 = '2';
      return config;
    });
    axios.interceptors.request.use(function (config) {
      config.headers.test3 = '3';
      return config;
    });

    axios('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders.test1).toBe('1');
      expect(request.requestHeaders.test2).toBe('2');
      expect(request.requestHeaders.test3).toBe('3');
      done();
    });
  });

  it('should add a response interceptor', function (done) {
    var response;

    axios.interceptors.response.use(function (data) {
      data.data = data.data + ' - modified by interceptor';
      return data;
    });

    axios('/foo').then(function (data) {
      response = data;
    });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      setTimeout(function () {
        expect(response.data).toBe('OK - modified by interceptor');
        done();
      }, 100);
    });
  });

  it('should add a response interceptor that returns a new data object', function (done) {
    var response;

    axios.interceptors.response.use(function () {
      return {
        data: 'stuff'
      };
    });

    axios('/foo').then(function (data) {
      response = data;
    });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      setTimeout(function () {
        expect(response.data).toBe('stuff');
        done();
      }, 100);
    });
  });

  it('should add a response interceptor that returns a promise', function (done) {
    var response;

    axios.interceptors.response.use(function (data) {
      return new Promise(function (resolve) {
        // do something async
        setTimeout(function () {
          data.data = 'you have been promised!';
          resolve(data);
        }, 10);
      });
    });

    axios('/foo').then(function (data) {
      response = data;
    });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      setTimeout(function () {
        expect(response.data).toBe('you have been promised!');
        done();
      }, 100);
    });
  });

  it('should add multiple response interceptors', function (done) {
    var response;

    axios.interceptors.response.use(function (data) {
      data.data = data.data + '1';
      return data;
    });
    axios.interceptors.response.use(function (data) {
      data.data = data.data + '2';
      return data;
    });
    axios.interceptors.response.use(function (data) {
      data.data = data.data + '3';
      return data;
    });

    axios('/foo').then(function (data) {
      response = data;
    });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      setTimeout(function () {
        expect(response.data).toBe('OK123');
        done();
      }, 100);
    });
  });

  it('should allow removing interceptors', function (done) {
    var response, intercept;

    axios.interceptors.response.use(function (data) {
      data.data = data.data + '1';
      return data;
    });
    intercept = axios.interceptors.response.use(function (data) {
      data.data = data.data + '2';
      return data;
    });
    axios.interceptors.response.use(function (data) {
      data.data = data.data + '3';
      return data;
    });

    axios.interceptors.response.eject(intercept);

    axios('/foo').then(function (data) {
      response = data;
    });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      setTimeout(function () {
        expect(response.data).toBe('OK13');
        done();
      }, 100);
    });
  });

  it('should remove async interceptor before making request and execute synchronously', function (done) {
    var asyncFlag = false;
    var asyncIntercept = axios.interceptors.request.use(function (config) {
      config.headers.async = 'async it!';
      return config;
    }, null, { synchronous: false });

    var syncIntercept = axios.interceptors.request.use(function (config) {
      config.headers.sync = 'hello world';
      expect(asyncFlag).toBe(false);
      return config;
    }, null, { synchronous: true });


    axios.interceptors.request.eject(asyncIntercept);

    axios('/foo')
    asyncFlag = true

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders.async).toBeUndefined();
      expect(request.requestHeaders.sync).toBe('hello world');
      done()
    });
  });

  it('should execute interceptors before transformers', function (done) {
    axios.interceptors.request.use(function (config) {
      config.data.baz = 'qux';
      return config;
    });

    axios.post('/foo', {
      foo: 'bar'
    });

    getAjaxRequest().then(function (request) {
      expect(request.params).toEqual('{"foo":"bar","baz":"qux"}');
      done();
    });
  });

  it('should modify base URL in request interceptor', function (done) {
    var instance = axios.create({
      baseURL: 'http://test.com/'
    });

    instance.interceptors.request.use(function (config) {
      config.baseURL = 'http://rebase.com/';
      return config;
    });

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('http://rebase.com/foo');
      done();
    });
  });
});
