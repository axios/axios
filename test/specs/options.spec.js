describe('options', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should default method to get', function (done) {
    axios('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.method).toBe('GET');
      done();
    });
  });

  it('should accept headers', function (done) {
    axios('/foo', {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders['X-Requested-With']).toEqual('XMLHttpRequest');
      done();
    });
  });

  it('should accept params', function (done) {
    axios('/foo', {
      params: {
        foo: 123,
        bar: 456
      }
    });

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('/foo?foo=123&bar=456');
      done();
    });
  });

  it('should allow overriding default headers', function (done) {
    axios('/foo', {
      headers: {
        'Accept': 'foo/bar'
      }
    });

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders['Accept']).toEqual('foo/bar');
      done();
    });
  });

  it('should accept base URL', function (done) {
    var instance = axios.create({
      baseURL: 'http://test.com/'
    });

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('http://test.com/foo');
      done();
    });
  });

  it('should ignore base URL if request URL is absolute', function (done) {
    var instance = axios.create({
      baseURL: 'http://someurl.com/'
    });

    instance.get('http://someotherurl.com/');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('http://someotherurl.com/');
      done();
    });
  });

  it('should change only the baseURL of the specified instance', function() {
    var instance1 = axios.create();
    var instance2 = axios.create();

    instance1.defaults.baseURL = 'http://instance1.example.com/';

    expect(instance2.defaults.baseURL).not.toBe('http://instance1.example.com/');
  });

  it('should change only the headers of the specified instance', function() {
    var instance1 = axios.create();
    var instance2 = axios.create();

    instance1.defaults.headers.common.Authorization = 'faketoken';
    instance2.defaults.headers.common.Authorization = 'differentfaketoken';

    instance1.defaults.headers.common['Content-Type'] = 'application/xml';
    instance2.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded';

    expect(axios.defaults.headers.common.Authorization).toBe(undefined);
    expect(instance1.defaults.headers.common.Authorization).toBe('faketoken');
    expect(instance2.defaults.headers.common.Authorization).toBe('differentfaketoken');

    expect(axios.defaults.headers.common['Content-Type']).toBe(undefined);
    expect(instance1.defaults.headers.common['Content-Type']).toBe('application/xml');
    expect(instance2.defaults.headers.common['Content-Type']).toBe('application/x-www-form-urlencoded');
  });
});
