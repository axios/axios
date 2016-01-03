var axios = require('../../index');
var defaults = require('../../lib/defaults');
var utils = require('../../lib/utils');

describe('defaults', function () {
  var __defaults;
  var XSRF_COOKIE_NAME = 'CUSTOM-XSRF-TOKEN';

  beforeEach(function () {
    jasmine.Ajax.install();
    __defaults = axios.defaults;
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
    axios.defaults = __defaults;
    document.cookie = XSRF_COOKIE_NAME + '=;expires=' + new Date(Date.now() - 86400000).toGMTString();
  });

  it('should transform request json', function () {
    expect(defaults.transformRequest[0]({foo: 'bar'})).toEqual('{"foo":"bar"}');
  });

  it('should do nothing to request string', function () {
    expect(defaults.transformRequest[0]('foo=bar')).toEqual('foo=bar');
  });

  it('should transform response json', function () {
    var data = defaults.transformResponse[0]('{"foo":"bar"}');

    expect(typeof data).toEqual('object');
    expect(data.foo).toEqual('bar');
  });

  it('should do nothing to response string', function () {
    expect(defaults.transformResponse[0]('foo=bar')).toEqual('foo=bar');
  });

  it('should use global defaults config', function (done) {
    var request;

    axios({ url: '/foo' });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('/foo');
      done();
    }, 0);
  });

  it('should use modified defaults config', function (done) {
    var request;
    axios.defaults.baseURL = 'http://example.com/';

    axios({ url: '/foo' });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('http://example.com/foo');
      done();
    }, 0);
  });

  it('should use request config', function (done) {
    var request;

    axios({
      url: '/foo',
      baseURL: 'http://www.example.com'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('http://www.example.com/foo');
      done();
    }, 0);
  });

  it('should use default config for custom instance', function (done) {
    var request;
    var instance = axios.create({
      xsrfCookieName: XSRF_COOKIE_NAME,
      xsrfHeaderName: 'X-CUSTOM-XSRF-TOKEN'
    });
    document.cookie = instance.defaults.xsrfCookieName + '=foobarbaz';

    instance.get('/foo');

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders[instance.defaults.xsrfHeaderName]).toEqual('foobarbaz');
      done();
    }, 0);
  });

  it('should use header config', function (done) {
    var request;
    var instance = axios.create({
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

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders).toEqual(
        utils.merge(defaults.headers.common, {
          'X-COMMON-HEADER': 'commonHeaderValue',
          'X-GET-HEADER': 'getHeaderValue',
          'X-FOO-HEADER': 'fooHeaderValue',
          'X-BAR-HEADER': 'barHeaderValue'
        })
      );
      done();
    }, 0);
  });

});

