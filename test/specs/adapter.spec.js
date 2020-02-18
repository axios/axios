var axios = require('../../index');

describe('adapter', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should support custom adapter', function (done) {
    axios('/foo', {
      adapter: function barAdapter(config) {
        return new Promise(function dispatchXhrRequest(resolve) {
          var request = new XMLHttpRequest();
          request.open('GET', '/bar');

          request.onreadystatechange = function () {
            resolve({
              config: config,
              request: request
            });
          };

          request.send(null);
        });
      }
    }).catch(console.log);

    getAjaxRequest().then(function(request) {
      expect(request.url).toBe('/bar');
      done();
    });
  });

  it('should execute adapter code synchronously', function (done) {
    var asyncFlag = false;
    axios('/foo', {
      adapter: function barAdapter(config) {
        return new Promise(function dispatchXhrRequest(resolve) {
          var request = new XMLHttpRequest();
          request.open('GET', '/bar');

          request.onreadystatechange = function () {
            resolve({
              config: config,
              request: request
            });
          };

          expect(asyncFlag).toBe(false);
          request.send(null);
        });
      }
    }).catch(console.log);

    asyncFlag = true;

    getAjaxRequest().then(function() {
      done();
    });
  });

  it('should execute adapter code asynchronously when interceptor is present', function (done) {
    var asyncFlag = false;

    axios.interceptors.request.use(function (config) {
      config.headers.async = 'async it!';
      return config;
    });

    axios('/foo', {
      adapter: function barAdapter(config) {
        return new Promise(function dispatchXhrRequest(resolve) {
          var request = new XMLHttpRequest();
          request.open('GET', '/bar');

          request.onreadystatechange = function () {
            resolve({
              config: config,
              request: request
            });
          };

          expect(asyncFlag).toBe(true);
          request.send(null);
        });
      }
    }).catch(console.log);

    asyncFlag = true;

    getAjaxRequest().then(function() {
      done();
    });
  });
});
