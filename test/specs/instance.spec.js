var axios = require('../../index');

describe('instance', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should make an http request', function (done) {
    var instance = axios.createNew();

    instance.request({
      url: '/foo'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('/foo');
      done();
    }, 0);
  });

  it('should use instance options', function (done) {
    var instance = axios.createNew({ timeout: 1000 });

    instance.request({
      url: '/foo'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.timeout).toBe(1000);
      done();
    }, 0);
  });
});
