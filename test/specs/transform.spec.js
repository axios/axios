var axios = require('../../index');

describe('transform', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should transform JSON to string', function (done) {
    var request;
    var data = {
      foo: 'bar'
    };

    axios({
      url: '/foo',
      method: 'post',
      data: data
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.params).toEqual('{"foo":"bar"}');
      done();
    }, 0);
  });

  it('should override default transform', function (done) {
    var request;
    var data = {
      foo: 'bar'
    };

    axios({
      url: '/foo',
      method: 'post',
      data: data,
      transformRequest: function (data) {
        return data;
      }
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(typeof request.params).toEqual('object');
      done();
    }, 0);
  });

  it('should allow an Array of transformers', function (done) {
    var request;
    var data = {
      foo: 'bar'
    };

    axios({
      url: '/foo',
      method: 'post',
      data: data,
      transformRequest: axios.defaults.transformRequest.concat(
        function (data) {
          return data.replace('bar', 'baz');
        }
      )
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.params).toEqual('{"foo":"baz"}');
      done();
    }, 0);
  });

  it('should allowing mutating headers', function (done) {
    var token = Math.floor(Math.random() * Math.pow(2, 64)).toString(36);
    var request;

    axios({
      url: '/foo',
      transformRequest: function (data, headers) {
        headers['X-Authorization'] = token;
      }
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['X-Authorization']).toEqual(token);
      done();
    }, 0);
  });
});
