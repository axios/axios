describe('defaultReject', function () {
  var instanceWithInitialDefaults = axios.create();

  axios.defaults.defaultReject = function (axiosError) {
    expect(axiosError instanceof Error).toBe(true);
    expect(axios.isAxiosError(axiosError)).toBe(true);
  }

  beforeEach(function () {
    jasmine.Ajax.install();
    spyOn(axios.defaults, 'defaultReject').and.callThrough();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
    axios.defaults.defaultReject.calls.reset();
  });

  it('should be null by default', function () {
  	expect(instanceWithInitialDefaults.defaults.defaultReject).toBe(null);
  });

  describe('defaultReject setter', function () {
    beforeEach(function () {
      spyOn(window, 'addEventListener').and.callThrough();
      spyOn(window, 'removeEventListener').and.callThrough();
    });

    afterEach(function () {
      window.addEventListener.calls.reset();
      window.removeEventListener.calls.reset();
    });

    it('should clear/add an unhandledrejection event listener when set to a function', function () {
      instanceWithInitialDefaults.defaults.defaultReject = function () {
        return 'Testing behaviour of defaultReject setter';
      };
      expect(window.addEventListener).toHaveBeenCalled();
    });

    it('should clear its event listener(s) when set to any other value', function () {
      instanceWithInitialDefaults.defaults.defaultReject = null;
      expect(window.removeEventListener).toHaveBeenCalled();
    });

    it('should throw an error if browser does not support the unhandledrejection event', function () {
      spyOnProperty(window, 'onunhandledrejection', 'get').and.returnValue(undefined);
      function setDefaultReject() {
        instance.defaults.defaults = function () { return ('Setting this should throw an error'); }
      }
      expect(setDefaultReject).toThrow();
    });
  });

  it('should not be called if axios request was successful', function (done) {
  	axios.get('www.someurl.com/foo')

  	getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        statusText: 'OK',
        responseText: '{"foo": "bar"}',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setTimeout(function () {
        expect(axios.defaults.defaultReject).not.toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  it('should not be called if a catch block was set manually', function (done) {
  	var manualCatch = jasmine.createSpy();
  	axios.get('www.someurl.com/foo')
  		.catch(manualCatch);

  	getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 404,
        statusText: 'NOT FOUND',
        responseText: 'Resource not found'
      });

      setTimeout(function () {
        expect(axios.defaults.defaultReject).not.toHaveBeenCalled();
        expect(manualCatch).toHaveBeenCalled();
        done();
      }, 100);
    });
  });


  // Following specs should trigger an unhandledpromise event

  /*it('should be called with AxiosError otherwise', function (done) {
  	axios.get('www.someurl.com/foo');

  	getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 404,
        statusText: 'NOT FOUND',
        responseText: 'Resource not found'
      });

      setTimeout(function () {
      	// Only instance2's default reject should have been called
        expect(axios.defaults.defaultReject).toHaveBeenCalled();
        done();
      }, 100);
    });
  });*/

  /*it('should only be called by the same instance that sent the request', function (done) {
  	var instance1DefaultReject = jasmine.createSpy();
  	var instance2DefaultReject = jasmine.createSpy();

  	var instance1 = axios.create();
  	instance1.defaults.defaultReject = instance1DefaultReject;
  	var instance2 = axios.create();
  	instance2.defaults.defaultReject = instance2DefaultReject;

  	// instance2 sends the request
  	instance2.get('www.someurl.com/foo');

  	getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 404,
        statusText: 'NOT FOUND',
        responseText: 'Resource not found'
      });

      setTimeout(function () {
      	// Only instance2's default reject should have been called
        expect(instance2.defaults.defaultReject).toHaveBeenCalled();
        expect(instance1.defaults.defaultReject).not.toHaveBeenCalled();
        done();
      }, 100);
    });
  });*/
});