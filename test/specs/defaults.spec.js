import defaults from '../../lib/defaults';
import utils from '../../lib/utils';
import AxiosHeaders from '../../lib/core/AxiosHeaders';

describe('defaults', function () {
  const XSRF_COOKIE_NAME = 'CUSTOM-XSRF-TOKEN';

  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
    delete axios.defaults.baseURL;
    delete axios.defaults.headers.get['X-CUSTOM-HEADER'];
    delete axios.defaults.headers.post['X-CUSTOM-HEADER'];
    document.cookie = XSRF_COOKIE_NAME + '=;expires=' + new Date(Date.now() - 86400000).toGMTString();
  });

  it('should transform request json', function () {
    expect(defaults.transformRequest[0]({foo: 'bar'}, new AxiosHeaders())).toEqual('{"foo":"bar"}');
  });

  it("should also transform request json when 'Content-Type' is 'application/json'", function () {
    const headers = new AxiosHeaders({
      'Content-Type': 'application/json',
    });
    expect(defaults.transformRequest[0](JSON.stringify({ foo: 'bar' }), headers)).toEqual('{"foo":"bar"}');
    expect(defaults.transformRequest[0]([42, 43], headers)).toEqual('[42,43]');
    expect(defaults.transformRequest[0]('foo', headers)).toEqual('"foo"');
    expect(defaults.transformRequest[0](42, headers)).toEqual('42');
    expect(defaults.transformRequest[0](true, headers)).toEqual('true');
    expect(defaults.transformRequest[0](false, headers)).toEqual('false');
    expect(defaults.transformRequest[0](null, headers)).toEqual('null');
  });

  it("should transform the plain data object to a FormData instance 'Content-Type' if header is 'multipart/form-data'", function() {
    const headers = new AxiosHeaders({
      'Content-Type': 'multipart/form-data'
    });

    const payload = {x: 1};

    const transformed = defaults.transformRequest[0](payload, headers);

    expect(transformed).toEqual(jasmine.any(FormData));
  });

  it('should do nothing to request string', function () {
    expect(defaults.transformRequest[0]('foo=bar', new AxiosHeaders())).toEqual('foo=bar');
  });

  it('should transform response json', function () {
    const data = defaults.transformResponse[0].call(defaults, '{"foo":"bar"}');

    expect(typeof data).toEqual('object');
    expect(data.foo).toEqual('bar');
  });

  it('should do nothing to response string', function () {
    expect(defaults.transformResponse[0]('foo=bar')).toEqual('foo=bar');
  });

  it('should use global defaults config', function (done) {
    axios('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('/foo');
      done();
    });
  });

  it('should use modified defaults config', function (done) {
    axios.defaults.baseURL = 'http://example.com/';

    axios('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('http://example.com/foo');
      done();
    });
  });

  it('should use request config', function (done) {
    axios('/foo', {
      baseURL: 'http://www.example.com'
    });

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('http://www.example.com/foo');
      done();
    });
  });

  it('should use default config for custom instance', function (done) {
    const instance = axios.create({
      xsrfCookieName: XSRF_COOKIE_NAME,
      xsrfHeaderName: 'X-CUSTOM-XSRF-TOKEN'
    });
    document.cookie = instance.defaults.xsrfCookieName + '=foobarbaz';

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders[instance.defaults.xsrfHeaderName]).toEqual('foobarbaz');
      done();
    });
  });

  it('should use GET headers', function (done) {
    axios.defaults.headers.get['X-CUSTOM-HEADER'] = 'foo';
    axios.get('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders['X-CUSTOM-HEADER']).toBe('foo');
      done();
    });
  });

  it('should use POST headers', function (done) {
    axios.defaults.headers.post['X-CUSTOM-HEADER'] = 'foo';
    axios.post('/foo', {});

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders['X-CUSTOM-HEADER']).toBe('foo');
      done();
    });
  });

  it('should use header config', function (done) {
    const instance = axios.create({
      headers: {
        common: {
          'X-COMMON-HEADER': 'commonHeaderValue'
        },
        get: {
          'X-GET-HEADER': 'getHeaderValue'
        },
        post: {
          'X-POST-HEADER': 'postHeaderValue'
        }
      }
    });

    instance.get('/foo', {
      headers: {
        'X-FOO-HEADER': 'fooHeaderValue',
        'X-BAR-HEADER': 'barHeaderValue'
      }
    });

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders).toEqual(
        AxiosHeaders.concat(defaults.headers.common, defaults.headers.get, {
          'X-COMMON-HEADER': 'commonHeaderValue',
          'X-GET-HEADER': 'getHeaderValue',
          'X-FOO-HEADER': 'fooHeaderValue',
          'X-BAR-HEADER': 'barHeaderValue'
        }).toJSON()
      );
      done();
    });
  });

  it('should be used by custom instance if set before instance created', function (done) {
    axios.defaults.baseURL = 'http://example.org/';
    const instance = axios.create();

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('http://example.org/foo');
      done();
    });
  });

  it('should not be used by custom instance if set after instance created', function (done) {
    const instance = axios.create();
    axios.defaults.baseURL = 'http://example.org/';

    instance.get('/foo/users');

    getAjaxRequest().then(function (request) {
      expect(request.url).toBe('/foo/users');
      done();
    });
  });

  it('should resistent to ReDoS attack', function (done) {
    const instance = axios.create();
    const start = performance.now();
    const slashes = '/'.repeat(100000);
    instance.defaults.baseURL = '/' + slashes + 'bar/';
    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      const elapsedTimeMs = performance.now() - start;
      expect(elapsedTimeMs).toBeLessThan(20);
      expect(request.url).toBe('/' + slashes + 'bar/foo');
      done();
    });
  });
});
