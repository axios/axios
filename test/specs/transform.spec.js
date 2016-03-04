var axios = require('../../index');

describe('transform', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should transform JSON to string', function (done) {
    var data = {
      foo: 'bar'
    };

    axios.post('/foo', data);

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      expect(request.params).toEqual('{"foo":"bar"}');
      done();
    }, 0);
  });

  it('should transform string to JSON', function (done) {
    var response;

    axios('/foo').then(function (data) {
      response = data;
    });

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      request.respondWith({
        status: 200,
        responseText: '{"foo": "bar"}'
      });
      
      setTimeout(function () {
        expect(typeof response.data).toEqual('object');
        expect(response.data.foo).toEqual('bar');
        done();
      }, 0);
    }, 0);
  });

  it('should override default transform', function (done) {
    var data = {
      foo: 'bar'
    };

    axios.post('/foo', data, {
      transformRequest: function (data) {
        return data;
      }
    });

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      expect(typeof request.params).toEqual('object');
      done();
    }, 0);
  });

  it('should allow an Array of transformers', function (done) {
    var data = {
      foo: 'bar'
    };

    axios.post('/foo', data, {
      transformRequest: axios.defaults.transformRequest.concat(
        function (data) {
          return data.replace('bar', 'baz');
        }
      )
    });

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      expect(request.params).toEqual('{"foo":"baz"}');
      done();
    }, 0);
  });

  it('should allowing mutating headers', function (done) {
    var token = Math.floor(Math.random() * Math.pow(2, 64)).toString(36);

    axios('/foo', {
      transformRequest: function (data, headers) {
        headers['X-Authorization'] = token;
      }
    });

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['X-Authorization']).toEqual(token);
      done();
    }, 0);
  });
});
