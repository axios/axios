var axios = require('../../index');

describe('adapter', function () {
  it('should support custom adapter', function (done) {
    axios('/foo', {
      adapter: function(config) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            config.headers.async = 'promise';
            resolve(config);
          }, 100);
        });
      }
    }).catch(console.log);

    setTimeout(function () {
      done();
    }, 100);
  });
});
