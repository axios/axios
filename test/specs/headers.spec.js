const {AxiosHeaders} = axios;

/**
 * Checks if the given key-value pair exists in the headers object. If the key exists, the function checks if the value matches the given value. If the key does not exist, the function throws an error or checks if the value is undefined.
 * @param {object} headers - The headers object to search through.
 * @param {string} key - The key to search for in the headers object.
 * @param {*} val - The value to compare against the value of the key in the headers object.
 * @throws {Error} - If the key is not found in the headers object and the value is not undefined.
 * @remarks - This function is commonly used in testing scenarios to check if a specific header value exists in an HTTP response.
 */
function testHeaderValue(headers, key, val) {
  let found = false;

  for (const k in headers) {
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
    const headers = axios.defaults.headers.common;

    axios('/foo');

    getAjaxRequest().then(function (request) {
      for (const key in headers) {
        if (headers.hasOwnProperty(key)) {
          expect(request.requestHeaders[key]).toEqual(headers[key]);
        }
      }
      done();
    });
  });

  it('should add extra headers for post', function (done) {
    const headers = axios.defaults.headers.common;

    axios.post('/foo', 'fizz=buzz');

    getAjaxRequest().then(function (request) {
      for (const key in headers) {
        if (headers.hasOwnProperty(key)) {
          expect(request.requestHeaders[key]).toEqual(headers[key]);
        }
      }
      done();
    });
  });

  it('should reset headers by null or explicit undefined', function (done) {
    axios.create({
      headers: {
        common: {
          'x-header-a': 'a',
          'x-header-b': 'b',
          'x-header-c': 'c'
        }
      }
    }).post('/foo', {fizz: 'buzz'}, {
      headers: {
        'Content-Type': null,
        'x-header-a': null,
        'x-header-b': undefined
      }
    }).catch(function (err) {
      done(err);
    });

    getAjaxRequest().then(function (request) {
      testHeaderValue(request.requestHeaders, 'Content-Type', undefined);
      testHeaderValue(request.requestHeaders, 'x-header-a', undefined);
      testHeaderValue(request.requestHeaders, 'x-header-b', undefined);
      testHeaderValue(request.requestHeaders, 'x-header-c', 'c');
      done();
    }).catch(done);
  });

  it('should use application/json when posting an object', function (done) {
    axios.post('/foo/bar', {
      firstName: 'foo',
      lastName: 'bar'
    });

    getAjaxRequest().then(function (request) {
      testHeaderValue(request.requestHeaders, 'Content-Type', 'application/json');
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

  it('should preserve content-type if data is false', async function () {
    axios.post('/foo', false);

    await getAjaxRequest().then(function (request) {
      testHeaderValue(request.requestHeaders, 'Content-Type', 'application/x-www-form-urlencoded');
    });
  });

  it('should allow an AxiosHeaders instance to be used as the value of the headers option', async ()=> {
    const instance = axios.create({
      headers: new AxiosHeaders({
        xFoo: 'foo',
        xBar: 'bar'
      })
    });

    instance.get('/foo', {
      headers: {
        XFOO: 'foo2',
        xBaz: 'baz'
      }
    });

    await getAjaxRequest().then(function (request) {
      expect(request.requestHeaders.xFoo).toEqual('foo2');
      expect(request.requestHeaders.xBar).toEqual('bar');
      expect(request.requestHeaders.xBaz).toEqual('baz');
      expect(request.requestHeaders.XFOO).toEqual(undefined);
    });

  });
});
