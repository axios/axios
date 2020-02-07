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
});
