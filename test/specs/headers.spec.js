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

    axios('/foo');

    getAjaxRequest().then(function (request) {
      for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
          expect(request.requestHeaders[key]).toEqual(headers[key]);
        }
      }
      done();
    });
  });

  it('should add extra headers for post', function (done) {
    var headers = axios.defaults.headers.common;

    axios.post('/foo', 'fizz=buzz');

    getAjaxRequest().then(function (request) {
      for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
          expect(request.requestHeaders[key]).toEqual(headers[key]);
        }
      }
      done();
    });
  });

  it('should use application/json when posting an object', function (done) {
    axios.post('/foo/bar', {
      firstName: 'foo',
      lastName: 'bar'
    });

    getAjaxRequest().then(function (request) {
      testHeaderValue(request.requestHeaders, 'Content-Type', 'application/json;charset=utf-8');
      done();
    });
  });

  it('should remove content-type if data is empty', function (done) {
    axios.post('/foo');

    getAjaxRequest().then(function (request) {
      testHeaderValue(request.requestHeaders, 'Content-Type', undefined);
      done();
    });
  });

  it('should preserve content-type if data is false', function (done) {
    axios.post('/foo', false);

    getAjaxRequest().then(function (request) {
      testHeaderValue(request.requestHeaders, 'Content-Type', 'application/x-www-form-urlencoded');
      done();
    });
  });
});
