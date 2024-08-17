const Cancel = axios.Cancel;
const CancelToken = axios.CancelToken;
import {AbortController as _AbortController} from 'abortcontroller-polyfill/dist/cjs-ponyfill.js';

const envAbortController = typeof AbortController === 'function' ? AbortController : _AbortController;

describe('cancel', function() {
  beforeEach(function() {
    jasmine.Ajax.install();
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  describe('when called before sending request', function() {
    it('rejects Promise with a CanceledError object', function(done) {
      const source = CancelToken.source();
      source.cancel('Operation has been canceled.');
      axios.get('/foo', {
        cancelToken: source.token
      }).catch(function(thrown) {
        expect(thrown).toEqual(jasmine.any(Cancel));
        expect(thrown.message).toBe('Operation has been canceled.');
        done();
      });
    });
  });

  describe('when called after request has been sent', function() {
    it('rejects Promise with a CanceledError object', function(done) {
      const source = CancelToken.source();
      axios.get('/foo/bar', {
        cancelToken: source.token
      }).catch(function(thrown) {
        expect(thrown).toEqual(jasmine.any(Cancel));
        expect(thrown.message).toBe('Operation has been canceled.');
        done();
      });

      getAjaxRequest().then(function(request) {
        // call cancel() when the request has been sent, but a response has not been received
        source.cancel('Operation has been canceled.');
        request.respondWith({
          status: 200,
          responseText: 'OK'
        });
      });
    });

    it('calls abort on request object', function(done) {
      const source = CancelToken.source();
      let request;
      axios.get('/foo/bar', {
        cancelToken: source.token
      }).catch(function() {
        // jasmine-ajax sets statusText to 'abort' when request.abort() is called
        expect(request.statusText).toBe('abort');
        done();
      });

      getAjaxRequest().then(function(req) {
        // call cancel() when the request has been sent, but a response has not been received
        source.cancel();
        request = req;
      });
    });
  });

  // describe('when called after response has been received', function() {
  //   // https://github.com/axios/axios/issues/482
  //   it('does not cause unhandled rejection', function(done) {
  //     var source = CancelToken.source();
  //     axios.get('/foo', {
  //       cancelToken: source.token
  //     }).then(function() {
  //       window.addEventListener('unhandledrejection', function() {
  //         done.fail('Unhandled rejection.');
  //       });
  //       source.cancel();
  //       setTimeout(done, 100);
  //     });

  //     getAjaxRequest().then(function(request) {
  //       request.respondWith({
  //         status: 200,
  //         responseText: 'OK'
  //       });
  //     });
  //   });
  // });

  it('it should support cancellation using AbortController signal', function(done) {
    const controller = new envAbortController();

    axios.get('/foo/bar', {
      signal: controller.signal
    }).then(function() {
      done.fail('Has not been canceled');
    },
    function(thrown) {
      expect(thrown).toEqual(jasmine.any(Cancel));
      done();
    }
    );

    getAjaxRequest().then(function (request) {
      // call cancel() when the request has been sent, but a response has not been received
      controller.abort();
      setTimeout(function(){
        request.respondWith({
          status: 200,
          responseText: 'OK'
        });
      }, 0);
    });
  });
});
