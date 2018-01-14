function testHeaderValue(headers, key, val) {
  var found = 0;

  for (var k in headers) {
    if (k.toLowerCase() === key.toLowerCase()) {
      found += 1;
      expect(headers[k]).toEqual(val);
    }
  }

  if (typeof val === 'undefined') {
    expect(found).toBe(0, 'header with name [' + key + '] must be absent');
  } else {
    expect(found).toBe(1, 'header with name [' + key + '] must be present only once');
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

  it('should ignore case when operating on header names', function (done) {
    var axiosInstance = axios.create({
      url: '/foo/bar',
      headers: {
        'test-Accept': 'text/plain, application/json'
      }
    });

    axiosInstance({
      headers: {
        'Test-Accept': '*/*'
      }
    });

    getAjaxRequest().then(function (request) {
      // Non-compliant implementation of setRequestHeader will leave both headers
      // Jasmine.Ajax is not following step 6 of https://xhr.spec.whatwg.org/#the-setrequestheader()-method
      // https://github.com/jasmine/jasmine-ajax/blob/master/lib/mock-ajax.js
      // compliant will combine them, but axios implementation should set header that was passed by user
      // to desired value, in this case '*/*'
      // This method will check that only one header was set using case insensitive comparison
      testHeaderValue(request.requestHeaders, 'Test-Accept', '*/*');

      done();
    });
  });

  it('should use header values set by adapter and ignore case', function (done) {
    axios('/foo/bar', {
      auth: {
        username: 'Aladdin',
        password: 'open sesame'
      },
      headers: {
        authorization: 'Bearer some-token'
      }
    });

    getAjaxRequest().then(function (request) {
      testHeaderValue(request.requestHeaders, 'Authorization', 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==');
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
