describe('timeout', function () {
  beforeEach(function() {
    jasmine.Ajax.install();
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

    it('resulting error should indicate rejection when the request times out', function (done) {
      //TODO note this request never rejects, I do not know why
      axios.get('/foo', {timeout: 100}).catch(function (thrown) {
        expect(error.axiosTimeout).toBe(true);
        done();
      });
    });
  });
  