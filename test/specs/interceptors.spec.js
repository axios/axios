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
    var request;
    
    axios.interceptors.request.use(function (config) {
      config.headers.test = 'added by interceptor';
      return config;
    });

    axios({
      url: '/foo'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      expect(request.requestHeaders.test).toBe('added by interceptor');
      done();
    }, 0);
  });

  it('should add a request interceptor that returns a new config object', function (done) {
    var request;

    axios.interceptors.request.use(function () {
      return {
        url: '/bar',
        method: 'post'
      };
    });

    axios({
      url: '/foo'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      expect(request.method).toBe('POST');
      expect(request.url).toBe('/bar');
      done();
    }, 0);
  });

  it('should add a request interceptor that returns a promise', function (done) {
    var request;

    axios.interceptors.request.use(function (config) {
      return new Promise(function (resolve) {
        // do something async
        setTimeout(function () {
          config.headers.async = 'promise';
          resolve(config);
        }, 10);
      });
    });

    axios({
      url: '/foo'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      expect(request.requestHeaders.async).toBe('promise');
      done();
    }, 100);
  });

  it('should add multiple request interceptors', function (done) {
    var request;

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

    axios({
      url: '/foo'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      expect(request.requestHeaders.test1).toBe('1');
      expect(request.requestHeaders.test2).toBe('2');
      expect(request.requestHeaders.test3).toBe('3');
      done();
    }, 0);
  });

  it('should add a response interceptor', function (done) {
    var request, response;

    axios.interceptors.response.use(function (data) {
      data.data = data.data + ' - modified by interceptor';
      return data;
    });

    axios({
      url: '/foo'
    }).then(function (data) {
      response = data;
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      request.respondWith({
        status: 200,
        responseText: 'OK'
      });
      
      setTimeout(function () {
        expect(response.data).toBe('OK - modified by interceptor');
        done();
      }, 0);
    }, 0);
  });

  it('should add a response interceptor that returns a new data object', function (done) {
    var request, response;

    axios.interceptors.response.use(function () {
      return {
        data: 'stuff'
      };
    });

    axios({
      url: '/foo'
    }).then(function (data) {
      response = data;
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      setTimeout(function () {
        expect(response.data).toBe('stuff');
        done();
      }, 0);
    }, 0);
  });

  it('should add a response interceptor that returns a promise', function (done) {
    var request, response;

    axios.interceptors.response.use(function (data) {
      return new Promise(function (resolve) {
        // do something async
        setTimeout(function () {
          data.data = 'you have been promised!';
          resolve(data);
        }, 10);
      });
    });

    axios({
      url: '/foo'
    }).then(function (data) {
      response = data;
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      setTimeout(function () {
        expect(response.data).toBe('you have been promised!');
        done();
      }, 100);
    }, 0);
  });

  it('should add multiple response interceptors', function (done) {
    var request, response;

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

    axios({
      url: '/foo'
    }).then(function (data) {
      response = data;
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      request.respondWith({
        status: 200,
        responseText: 'OK'
      });
      
      setTimeout(function () {
        expect(response.data).toBe('OK123');
        done();
      }, 0);
    }, 0);
  });

  it('should allow removing interceptors', function (done) {
    var request, response, intercept;

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

    axios({
      url: '/foo'
    }).then(function (data) {
      response = data;
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      setTimeout(function () {
        expect(response.data).toBe('OK13');
        done();
      }, 0);
    }, 0);
  });
});
