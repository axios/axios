var axios = require('../../index');

describe('adapter', function () {
  it('should support custom adapter', function (done) {
    var called = false;

    axios({
      url: '/foo',
      adapter: function (resolve, reject, config) {
        called = true;
      }
    });

    setTimeout(function () {
      expect(called).toBe(true);
      done();
    }, 100);
  });
});

