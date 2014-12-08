describe('transform', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should transform JSON to string', function () {
    var request;
    var data = {
      foo: 'bar'
    };

    runs(function () {
      axios({
        url: '/foo',
        method: 'post',
        data: data
      });
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      expect(request.params).toEqual('{"foo":"bar"}');
    });
  });

  it('should override default transform', function () {
    var request;
    var data = {
      foo: 'bar'
    };

    runs(function () {
      axios({
        url: '/foo',
        method: 'post',
        data: data,
        transformRequest: function (data) {
          return data;
        }
      });
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      expect(typeof request.params).toEqual('object');
    });
  });

  it('should allow an Array of transformers', function () {
    var request;
    var data = {
      foo: 'bar'
    };

    runs(function () {
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
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      expect(request.params).toEqual('{"foo":"baz"}');
    });
  });

  it('should allowing mutating headers', function () {
    var token = Math.floor(Math.random() * Math.pow(2, 64)).toString(36);
    var request;

    runs(function () {
      axios({
        url: '/foo',
        transformRequest: function (data, headers) {
          headers['X-Authorization'] = token;
        }
      });
    });

    waitsFor(function () {
      return request = jasmine.Ajax.requests.mostRecent();
    }, 'waiting for the request', 100);

    runs(function () {
      expect(request.requestHeaders['X-Authorization']).toEqual(token);
    });
  });
});
