
var utils = require('../../lib/utils');

describe('promise', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should provide succinct object to then', function (done) {
    var response;

    axios('/foo').then(function (r) {
      response = r;
    });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        responseText: '{"hello":"world"}'
      });

      setTimeout(function () {
        expect(typeof response).toEqual('object');
        expect(response.data.hello).toEqual('world');
        expect(response.status).toEqual(200);
        expect(response.headers['content-type']).toEqual('application/json');
        expect(response.config.url).toEqual('/foo');
        done();
      }, 100);
    });
  });

  it('should support all', function (done) {
    var fulfilled = false;

    axios.all([true, 123]).then(function () {
      fulfilled = true;
    });

    setTimeout(function () {
      expect(fulfilled).toEqual(true);
      done();
    }, 100);
  });

  it('should support spread', function (done) {
    var sum = 0;
    var fulfilled = false;
    var result;

    axios
      .all([123, 456])
      .then(axios.spread(function (a, b) {
        sum = a + b;
        fulfilled = true;
        return 'hello world';
      }))
      .then(function (res) {
        result = res;
      });

    setTimeout(function () {
      expect(fulfilled).toEqual(true);
      expect(sum).toEqual(123 + 456);
      expect(result).toEqual('hello world');
      done();
    }, 100);
  });

  it('should validate custom Promise', function () {

    var thenable = Promise.resolve();

    expect(function() {
      axios.usePromise(null);
    }).toThrowError(TypeError, 'Promise should be a Function.');

    expect(function() {
      axios.usePromise('string');
    }).toThrowError(TypeError, 'Promise should be a Function.');

    expect(function() {
      function P () {}

      axios.usePromise(function P () {});
    }).toThrowError(TypeError, 'Promise should return a thenable.');

    expect(function() {
      function P () { return thenable; }

      axios.usePromise(P);
    }).toThrowError(TypeError, 'Promise should have static method: resolve');

    expect(function() {
      function P () { return thenable; }
      P.resolve = function resolve () {};

      axios.usePromise(P);
    }).toThrowError(TypeError, 'Promise.resolve method should return a thenable.');

    expect(function() {
      function P () { return thenable; }
      P.resolve = function resolve () { return thenable; };

      axios.usePromise(P);
    }).toThrowError(TypeError, 'Promise should have static method: reject');

    expect(function() {
      function P () { return thenable; }
      P.resolve = function resolve () { return thenable; };
      P.reject = function reject () {};

      axios.usePromise(P);
    }).toThrowError(TypeError, 'Promise.reject method should return a thenable.');

    expect(function() {
      function P () { return thenable; }
      P.resolve = function resolve () { return thenable; }
      P.reject = function reject () { return thenable; }

      axios.usePromise(P);
    }).toThrowError(TypeError, 'Promise should have static method: all');

    expect(function() {
      function P () { return thenable; }
      P.resolve = function resolve () { return thenable; };
      P.reject = function reject () { return thenable; };
      P.all = function all () {};

      axios.usePromise(P);
    }).toThrowError(TypeError, 'Promise.all method should return a thenable.');

    function ValidPromise () { return thenable; }
    ValidPromise.resolve = function resolve () { return thenable; };
    ValidPromise.reject = function reject () { return thenable; };
    ValidPromise.all = function all () { return thenable; };

    var OriginalPromise = axios.usePromise();

    axios.usePromise(ValidPromise);
    
    expect(axios.usePromise()).toBe(ValidPromise);

    axios.usePromise(OriginalPromise);

    expect(axios.usePromise()).toBe(OriginalPromise);

  });
});