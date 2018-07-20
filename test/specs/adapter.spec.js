var axios = require('../../index');

describe('adapter', () => {
  it('should support custom adapter', done => {
    var called = false;

    axios('/foo', {
      adapter: config => {
        called = true;
      }
    });

    setTimeout(() => {
      expect(called).toBe(true);
      done();
    }, 100);
  });
});

