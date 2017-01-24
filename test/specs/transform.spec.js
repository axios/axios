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

    getAjaxRequest().then(function (request) {
      expect(request.params).toEqual('{"foo":"bar"}');
      done();
    });
  });

  it('should transform string to JSON', function (done) {
    var response;

    axios('/foo').then(function (data) {
      response = data;
    });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        responseText: '{"foo": "bar"}'
      });

      setTimeout(function () {
        expect(typeof response.data).toEqual('object');
        expect(response.data.foo).toEqual('bar');
        done();
      }, 100);
    });
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

    getAjaxRequest().then(function (request) {
      expect(typeof request.params).toEqual('object');
      done();
    });
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

    getAjaxRequest().then(function (request) {
      expect(request.params).toEqual('{"foo":"baz"}');
      done();
    });
  });

  it('should allowing mutating headers', function (done) {
    var token = Math.floor(Math.random() * Math.pow(2, 64)).toString(36);

    axios('/foo', {
      transformRequest: function (data, headers) {
        headers['X-Authorization'] = token;
      }
    });

    getAjaxRequest().then(function (request) {
      expect(request.requestHeaders['X-Authorization']).toEqual(token);
      done();
    });
  });
});
