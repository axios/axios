var defaults = require('../../lib/defaults');

describe('instance', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should have the same methods as default instance', function () {
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
        'isAxiosError',
        'VERSION',
        'default'].indexOf(prop) > -1) {
        continue;
      }
      expect(typeof instance[prop]).toBe(typeof axios[prop]);
    }
  });

  it('should make an http request without verb helper', function (done) {
    var instance = axios.create();

    instance('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('/foo');
      done();
    });
  });

  it('should make an http request with url instead of baseURL', function (done) {
    var instance = axios.create({
      url: 'https://api.example.com'
    });

    instance('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('/foo');
      done();
    });
  });

  it('should make an http request', function (done) {
    var instance = axios.create();

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('/foo');
      done();
    });
  });

  it('should use instance options', function (done) {
    var instance = axios.create({ timeout: 1000 });

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.timeout).toBe(1000);
      done();
    });
  });

  it('should have defaults.headers', function () {
    var instance = axios.create({
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

    var instance = axios.create();
    instance.interceptors.request.use(function (config) {
      config.bar = true;
      return config;
    });

    var response;
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

  describe('with disabled useLiveConfig option', function() {
    it('should support getConfig method', function () {
      var instance = axios.create({
        x: 123,
        y: 456
      });

      var instance2 = instance.create({
        z: 789
      });

      var config2 = instance2.getConfig();

      expect(typeof config2).toBe('object');
      expect(config2.x).toEqual(123);
      expect(config2.y).toEqual(456);
      expect(config2.z).toEqual(789);
    });

    it('should support setConfig method', function () {
      var instance = axios.create({
        x: 123,
        y: 456
      });

      var instance2 = instance.create({
        z: 789
      });

      instance.setConfig({
        x: 321
      });

      var config = instance.getConfig();
      var config2 = instance2.getConfig();

      expect(typeof config).toBe('object');
      expect(config.x).toEqual(321);

      expect(typeof config2).toBe('object');
      expect(config2.x).toEqual(123);
      expect(config2.y).toEqual(456);
      expect(config2.z).toEqual(789);
    });
  });

  describe('with enabled useLiveConfig option', function() {
    it('should support getConfig method', function () {
      var instance = axios.create({
        x: 123,
        y: 456
      }, true);

      var instance2 = instance.create({
        z: 789
      }, true);

      var instance3 = instance2.create({
        z: 987
      }, true);

      var config = instance.getConfig();
      var config2 = instance2.getConfig();
      var config3 = instance3.getConfig();

      expect(typeof config).toBe('object');
      expect(config.x).toEqual(123);
      expect(config.y).toEqual(456);
      expect(config.z).toEqual(undefined);

      expect(typeof config2).toBe('object');
      expect(config2.x).toEqual(123);
      expect(config2.y).toEqual(456);
      expect(config2.z).toEqual(789);

      expect(typeof config3).toBe('object');
      expect(config3.x).toEqual(123);
      expect(config3.y).toEqual(456);
      expect(config3.z).toEqual(987);
    });

    it('should support setConfig method', function () {
      var instance = axios.create({
        x: 111,
        y: 222
      }, true);

      var instance2 = instance.create({
        z: 333
      }, true);

      var instance3 = instance2.create({
        z: 444
      }, true);

      var config = instance.getConfig();

      expect(typeof config).toBe('object');
      expect(config.x).toEqual(111);
      expect(config.y).toEqual(222);
      expect(config.z).toEqual(undefined);

      instance.setConfig({
        x: 555
      });

      instance2.setConfig({
        z: 666
      });

      config = instance.getConfig();
      var config2 = instance2.getConfig();
      var config3 = instance3.getConfig();

      expect(typeof config).toBe('object');
      expect(config.x).toEqual(555);
      expect(config.y).toEqual(222);
      expect(config.z).toEqual(undefined);

      expect(typeof config2).toBe('object');
      expect(config2.x).toEqual(555);
      expect(config2.y).toEqual(222);
      expect(config2.z).toEqual(666);

      expect(typeof config3).toBe('object');
      expect(config3.x).toEqual(555);
      expect(config3.y).toEqual(222);
      expect(config3.z).toEqual(444);
    });
  });
});
