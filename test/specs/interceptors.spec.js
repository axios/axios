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
    let asyncFlag = false;
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
    let asyncFlag = false;
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
    let asyncFlag = false;
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
    let asyncFlag = false;
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
    let asyncFlag = false;

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
    const rejectedSpy = jasmine.createSpy('rejectedSpy');
    const error = new Error('deadly error');
    axios.interceptors.request.use(function () {
      throw error;
    }, rejectedSpy, { synchronous: true });

    axios('/foo').catch(done);

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
    let response;

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

  it('should add a response interceptor when request interceptor is defined', function (done) {
    let response;

    axios.interceptors.request.use(function (data) {
      return data;
    });

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
    let response;

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
    let response;

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

  describe('given you add multiple response interceptors', function () {

    describe('and when the response was fulfilled', function () {

      function fireRequestAndExpect(expectation) {
        let response;
        axios('/foo').then(function(data) {
          response = data;
        });
        getAjaxRequest().then(function (request) {
          request.respondWith({
            status: 200,
            responseText: 'OK'
          });

          setTimeout(function() {
            expectation(response)
          }, 100);
        });
      }

      it('then each interceptor is executed', function (done) {
        const interceptor1 = jasmine.createSpy('interceptor1');
        const interceptor2 = jasmine.createSpy('interceptor2');
        axios.interceptors.response.use(interceptor1);
        axios.interceptors.response.use(interceptor2);

        fireRequestAndExpect(function () {
          expect(interceptor1).toHaveBeenCalled();
          expect(interceptor2).toHaveBeenCalled();
          done();
        });
      });

      it('then they are executed in the order they were added', function (done) {
        const interceptor1 = jasmine.createSpy('interceptor1');
        const interceptor2 = jasmine.createSpy('interceptor2');
        axios.interceptors.response.use(interceptor1);
        axios.interceptors.response.use(interceptor2);

        fireRequestAndExpect(function () {
          expect(interceptor1).toHaveBeenCalledBefore(interceptor2);
          done();
        });
      });

      it('then only the last interceptor\'s result is returned', function (done) {
        axios.interceptors.response.use(function() {
          return 'response 1';
        });
        axios.interceptors.response.use(function() {
          return 'response 2';
        });

        fireRequestAndExpect(function (response) {
          expect(response).toBe('response 2');
          done();
        });
      });

      it('then every interceptor receives the result of it\'s predecessor', function (done) {
        axios.interceptors.response.use(function() {
          return 'response 1';
        });
        axios.interceptors.response.use(function(response) {
          return [response, 'response 2'];
        });

        fireRequestAndExpect(function (response) {
          expect(response).toEqual(['response 1', 'response 2']);
          done();
        });
      });

      describe('and when the fulfillment-interceptor throws', function () {

        function fireRequestCatchAndExpect(expectation) {
          axios('/foo').catch(function(data) {
            // dont handle result
          });
          getAjaxRequest().then(function (request) {
            request.respondWith({
              status: 200,
              responseText: 'OK'
            });

            setTimeout(function() {
              expectation()
            }, 100);
          });
        }

        it('then the following fulfillment-interceptor is not called', function (done) {
          axios.interceptors.response.use(function() {
            throw Error('throwing interceptor');
          });
          const interceptor2 = jasmine.createSpy('interceptor2');
          axios.interceptors.response.use(interceptor2);

          fireRequestCatchAndExpect(function () {
            expect(interceptor2).not.toHaveBeenCalled();
            done();
          });
        });

        it('then the following rejection-interceptor is called', function (done) {
          axios.interceptors.response.use(function() {
            throw Error('throwing interceptor');
          });
          const unusedFulfillInterceptor = function() {};
          const rejectIntercept = jasmine.createSpy('rejectIntercept');
          axios.interceptors.response.use(unusedFulfillInterceptor, rejectIntercept);

          fireRequestCatchAndExpect(function () {
            expect(rejectIntercept).toHaveBeenCalled();
            done();
          });
        });

        it('once caught, another following fulfill-interceptor is called again (just like in a promise chain)', function (done) {
          axios.interceptors.response.use(function() {
            throw Error('throwing interceptor');
          });

          const unusedFulfillInterceptor = function() {};
          const catchingThrowingInterceptor = function() {};
          axios.interceptors.response.use(unusedFulfillInterceptor, catchingThrowingInterceptor);

          const interceptor3 = jasmine.createSpy('interceptor3');
          axios.interceptors.response.use(interceptor3);

          fireRequestCatchAndExpect(function () {
            expect(interceptor3).toHaveBeenCalled();
            done();
          });
        });
      });
    });
  });

  it('should allow removing interceptors', function (done) {
    let response, intercept;

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
    let asyncFlag = false;
    const asyncIntercept = axios.interceptors.request.use(function (config) {
      config.headers.async = 'async it!';
      return config;
    }, null, { synchronous: false });

    const syncIntercept = axios.interceptors.request.use(function (config) {
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
    const instance = axios.create({
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

  it('should clear all request interceptors', function () {
    const instance = axios.create({
      baseURL: 'http://test.com/'
    });

    instance.interceptors.request.use(function (config) {
      return config
    });

    instance.interceptors.request.clear();

    expect(instance.interceptors.request.handlers.length).toBe(0);
  });

  it('should clear all response interceptors', function () {
    const instance = axios.create({
      baseURL: 'http://test.com/'
    });

    instance.interceptors.response.use(function (config) {
      return config
    });

    instance.interceptors.response.clear();

    expect(instance.interceptors.response.handlers.length).toBe(0);
  });
});
