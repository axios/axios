var axios = require('../../index');

describe('instance', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should make an http request', function (done) {
    var instance = axios.create();

    instance.get('/foo');

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('/foo');
      done();
    }, 0);
  });

  it('should use instance options', function (done) {
    var instance = axios.create({ timeout: 1000 });

    instance.get('/foo');

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.timeout).toBe(1000);
      done();
    }, 0);
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

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      request.respondWith({
        status: 200
      });

      setTimeout(function () {
        expect(response.config.foo).toEqual(undefined);
        expect(response.config.bar).toEqual(true);
        done();
      });
    }, 0);
  });
});
