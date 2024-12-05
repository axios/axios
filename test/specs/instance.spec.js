describe('instance', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should have the same methods as default instance', function () {
    const instance = axios.create();

    for (const prop in axios) {
      if ([
        'Axios',
        'AxiosError',
        'create',
        'Cancel',
        'CanceledError',
        'CancelToken',
        'isCancel',
        'all',
        'spread',
        'getUri',
        'isAxiosError',
        'mergeConfig',
        'getAdapter',
        'VERSION',
        'default',
        'toFormData',
        'formToJSON',
        'AxiosHeaders',
        'HttpStatusCode'
      ].indexOf(prop) > -1) {
        continue;
      }
      expect(typeof instance[prop]).toBe(typeof axios[prop]);
    }
  });

  it('should make an http request without verb helper', function (done) {
    const instance = axios.create();

    instance('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('/foo');
      done();
    });
  });

  it('should make an http request with url instead of baseURL', function (done) {
    const instance = axios.create({
      url: 'https://api.example.com'
    });

    instance('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('/foo');
      done();
    });
  });

  it('should make an http request', function (done) {
    const instance = axios.create();

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('/foo');
      done();
    });
  });

  it('should use instance options', function (done) {
    const instance = axios.create({ timeout: 1000 });

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.timeout).toBe(1000);
      done();
    });
  });

  it('should have defaults.headers', function () {
    const instance = axios.create({
      baseURL: 'https://api.example.com'
    });

    expect(typeof instance.defaults.headers, 'object');
    expect(typeof instance.defaults.headers.common, 'object');
  });

  it('should have interceptors on the instance', function (done) {
    axios.interceptors.request.use(function (config) {
      config.foo = true;
      return config;
    });

    const instance = axios.create();
    instance.interceptors.request.use(function (config) {
      config.bar = true;
      return config;
    });

    let response;
    instance.get('/foo').then(function (res) {
      response = res;
    });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200
      });

      setTimeout(function () {
        expect(response.config.foo).toEqual(undefined);
        expect(response.config.bar).toEqual(true);
        done();
      }, 100);
    });
  });

  it('should have getUri on the instance', function() {
    const instance = axios.create({
      baseURL: 'https://api.example.com'
    });
    const options = {
      url: 'foo/bar',
      params: {
        name: 'axios'
      }
    };
    expect(instance.getUri(options)).toBe('https://api.example.com/foo/bar?name=axios');
  });

  it('should correctly build url without baseURL', function () {
    const instance = axios.create();
    const options = {
      url: 'foo/bar?foo=bar',
      params: {
        name: 'axios'
      }
    };
    expect(instance.getUri(options)).toBe('foo/bar?foo=bar&name=axios');
  });

  it('should correctly discard url hash mark', function () {
    const instance = axios.create();
    const options = {
      baseURL: 'https://api.example.com',
      url: 'foo/bar?foo=bar#hash',
      params: {
        name: 'axios'
      }
    };
    expect(instance.getUri(options)).toBe('https://api.example.com/foo/bar?foo=bar&name=axios');
  });
});
