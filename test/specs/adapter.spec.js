var axios = require('../../index');

describe('adapter', function () {
  it('should support custom adapter (asynchronously)', function (done) {

    var promiseResolveSpy = spyOn(window.Promise, 'resolve').and.callThrough();
    var called = false;

    axios('/foo', {
      adapter: function (config) {
        called = true;
      }
    });

    setTimeout(function () {
      expect(promiseResolveSpy).toHaveBeenCalled();
      expect(called).toBe(true);
      done();
    }, 100);
  });
});

