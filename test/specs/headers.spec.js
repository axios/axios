var axios = require('../../index');

function testHeaderValue(headers, key, val) {
  var found = false;

  for (var k in headers) {
    if (k.toLowerCase() === key.toLowerCase()) {
      found = true;
      expect(headers[k]).toEqual(val);
      break;
    }
  }

  if (!found) {
    if (typeof val === 'undefined') {
      expect(headers.hasOwnProperty(key)).toEqual(false);
    } else {
      throw new Error(key + ' was not found in headers');
    }
  }
}

describe('headers', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should default common headers', function (done) {
    var headers = axios.defaults.headers.common;

    axios({
      url: '/foo'
    });

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
          expect(request.requestHeaders[key]).toEqual(headers[key]);
        }
      }
      done();
    }, 0);
  });

  it('should add extra headers for post', function (done) {
    var headers = axios.defaults.headers.common;

    axios({
      method: 'post',
      url: '/foo',
      data: 'fizz=buzz'
    });

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
          expect(request.requestHeaders[key]).toEqual(headers[key]);
        }
      }
      done();
    }, 0);
  });

  it('should use application/json when posting an object', function (done) {
    axios({
      url: '/foo/bar',
      method: 'post',
      data: {
        firstName: 'foo',
        lastName: 'bar'
      }
    });

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();
      testHeaderValue(request.requestHeaders, 'Content-Type', 'application/json;charset=utf-8');
      done();
    }, 0);
  });

  it('should remove content-type if data is empty', function (done) {
    axios({
      url: '/foo',
      method: 'post'
    });

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();
      testHeaderValue(request.requestHeaders, 'Content-Type', undefined);
      done();
    }, 0);
  });

  xit('should preserve content-type if data is false', function (done) {
    axios({
      url: '/foo',
      method: 'post',
      data: false
    });

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();
      testHeaderValue(request.requestHeaders, 'Content-Type', 'application/x-www-form-urlencoded');
      done();
    }, 0);
  });
});
