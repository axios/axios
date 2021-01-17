describe('interceptors', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
    axios.interceptors.request.handlers = [];
    axios.interceptors.response.handlers = [];
  });

  it('should add a request interceptor', function (done) {
    axios.interceptors.request.use(function (config) {
      config.headers.test = 'added by interceptor';
      return config;
    });

    axios('/foo');

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      expect(request.requestHeaders.test).toBe('added by interceptor');
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

  describe('given you add multiple interceptors', function () {
    describe('and when the response was fulfilled', function () {
      function fireRequestAndExpect(expectation) {
        var response;
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
        var interceptor1 = jasmine.createSpy('interceptor1');
        var interceptor2 = jasmine.createSpy('interceptor2');
        axios.interceptors.response.use(interceptor1);
        axios.interceptors.response.use(interceptor2);

        fireRequestAndExpect(function () {
          expect(interceptor1).toHaveBeenCalled();
          expect(interceptor2).toHaveBeenCalled();
          done();
        });
      });
      it('then they are executed in the order they were added', function (done) {
        var interceptor1 = jasmine.createSpy('interceptor1');
        var interceptor2 = jasmine.createSpy('interceptor2');
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
          var interceptor2 = jasmine.createSpy('interceptor2');
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
          var unusedFulfillInterceptor = function() {};
          var rejectIntercept = jasmine.createSpy('rejectIntercept');
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

          var unusedFulfillInterceptor = function() {};
          var catchingThrowingInterceptor = function() {};
          axios.interceptors.response.use(unusedFulfillInterceptor, catchingThrowingInterceptor);

          var interceptor3 = jasmine.createSpy('interceptor3');
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
