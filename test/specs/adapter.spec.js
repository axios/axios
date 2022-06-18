
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
          const request = new XMLHttpRequest();
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
    }).catch(done);

    getAjaxRequest().then(function(request) {
      expect(request.url).toBe('/bar');
      done();
    });
  });

  it('should execute adapter code synchronously', function (done) {
    let asyncFlag = false;
    axios('/foo', {
      adapter: function barAdapter(config) {
        return new Promise(function dispatchXhrRequest(resolve) {
          const request = new XMLHttpRequest();
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
    }).catch(done);

    asyncFlag = true;

    getAjaxRequest().then(function() {
      done();
    });
  });

  it('should execute adapter code asynchronously when interceptor is present', function (done) {
    let asyncFlag = false;

    axios.interceptors.request.use(function (config) {
      config.headers.async = 'async it!';
      return config;
    });

    axios('/foo', {
      adapter: function barAdapter(config) {
        return new Promise(function dispatchXhrRequest(resolve) {
          const request = new XMLHttpRequest();
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
    }).catch(done);

    asyncFlag = true;

    getAjaxRequest().then(function() {
      done();
    });
  });
});
