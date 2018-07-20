describe('instance', () => {
  beforeEach(() => {
    jasmine.Ajax.install();
  });

  afterEach(() => {
    jasmine.Ajax.uninstall();
  });

  it('should have the same methods as default instance', () => {
    var instance = axios.create();

    for (var prop in axios) {
      if ([
        'Axios',
        'create',
        'Cancel',
        'CancelToken',
        'isCancel',
        'all',
        'spread',
        'default'].indexOf(prop) > -1) {
        continue;
      }
      expect(typeof instance[prop]).toBe(typeof axios[prop]);
    }
  });

  it('should make an http request without verb helper', done => {
    var instance = axios.create();

    instance('/foo');

    getAjaxRequest().then(request => {
      expect(request.url).toBe('/foo');
      done();
    });
  });

  it('should make an http request', done => {
    var instance = axios.create();

    instance.get('/foo');

    getAjaxRequest().then(request => {
      expect(request.url).toBe('/foo');
      done();
    });
  });

  it('should use instance options', done => {
    var instance = axios.create({ timeout: 1000 });

    instance.get('/foo');

    getAjaxRequest().then(request => {
      expect(request.timeout).toBe(1000);
      done();
    });
  });

  it('should have defaults.headers', () => {
    var instance = axios.create({
      baseURL: 'https://api.example.com'
    });

    expect(typeof instance.defaults.headers, 'object');
    expect(typeof instance.defaults.headers.common, 'object');
  });

  it('should have interceptors on the instance', done => {
    axios.interceptors.request.use(config => {
      config.foo = true;
      return config;
    });

    var instance = axios.create();
    instance.interceptors.request.use(config => {
      config.bar = true;
      return config;
    });

    var response;
    instance.get('/foo').then(res => {
      response = res;
    });

    getAjaxRequest().then(request => {
      request.respondWith({
        status: 200
      });

      setTimeout(() => {
        expect(response.config.foo).toEqual(undefined);
        expect(response.config.bar).toEqual(true);
        done();
      }, 100);
    });
  });
});
