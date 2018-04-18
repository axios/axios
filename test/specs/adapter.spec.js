var axios = require('../../index');

describe('adapter', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should support custom adapter', function (done) {
    var called = false;

    axios('/foo', {
      adapter: function (config) {
        called = true;
      }
    });

    setTimeout(function () {
      expect(called).toBe(true);
      done();
    }, 100);
  });

  it('should throw maxContentLength is exceed error', function(done) {
    var testMaxContentLength = 10
    axios.get('/foo', {maxContentLength: testMaxContentLength})
      .then(function() {
        fail('Ajax call should not success when the response is over maxContentLength.');
        done();
      })
      .catch(function(err) {
        expect(err.message).toBe(`maxContentLength size of ${testMaxContentLength} exceeded`);
        done();
      });
    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        responseText: 'OK',
        responseHeaders: {
          'Content-Length': testMaxContentLength + 1
        }
      });
    });
  });
});

