var axios = require('../../index');

describe('adapter', function () {
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
});

