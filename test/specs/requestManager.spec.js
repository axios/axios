describe('RequestManager', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should add a request with the specified requestId', function (done) {
    axios('/foo', {
      requestId: 'requestId'
    });

    getAjaxRequest().then(function (request) {

      expect(request.requestId).toBe('requestId');
      expect(axios.requestManager.get('requestId').requestId).toBe('requestId');
      expect(axios.requestManager.requests.length).toBe(1);

      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      done();
    });
  });

  it('should remove a request with the specified requestId after it finishes', function (done) {
    axios('/foo', {
      requestId: 'requestId'
    });

    getAjaxRequest().then(function (request) {

      expect(axios.requestManager.requests.length).toBe(1);

      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      setTimeout(function () {
        expect(axios.requestManager.requests.length).toBe(0);
        done();
      });
    });
  });

  it('should get a request with the specified requestId', function (done) {
    axios('/foo', {
      requestId: 'requestId',
      headers: {
        test: 'added for requestManager'
      }
    });

    getAjaxRequest().then(function (request) {

      expect(axios.requestManager.get('requestId').requestHeaders.test)
        .toBe('added for requestManager');

      request.respondWith({
        status: 200,
        responseText: 'OK'
      });

      done();

    });

  });



  it('should abort a request', function (done) {
    axios('/foo', {
      requestId: 'requestId'
    });


    getAjaxRequest().then(function (request) {

      axios.abort('requestId');

      expect(request.readyState).toBe(0);

      expect(axios.requestManager.requests.length).toBe(0);

      done();
    });
  });

  it('should abort a request on when retried', function (done) {
    axios('/foo', {
      requestId: 'requestId'
    });

    getAjaxRequest().then(function (request) {

      axios('/foo', {
        requestId: 'requestId',
        abortOnRetry: true
      });

      setTimeout(function () {
        expect(request.readyState).toBe(0);

        expect(axios.requestManager.requests.length).toBe(1);

        done();
      }, 0);

    });
  });

});