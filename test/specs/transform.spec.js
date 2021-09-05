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

  it('should throw a SyntaxError if JSON parsing failed and responseType is "json" if silentJSONParsing is false',
    function (done) {
      var thrown;

      axios({
        url: '/foo',
        responseType: 'json',
        transitional: {silentJSONParsing: false}
      }).then(function () {
        done(new Error('should fail'));
      }, function (err) {
        thrown = err;
      });

      getAjaxRequest().then(function (request) {
        request.respondWith({
          status: 200,
          responseText: '{foo": "bar"}' // JSON SyntaxError
        });

        setTimeout(function () {
          expect(thrown).toBeTruthy();
          expect(thrown.name).toContain('SyntaxError');
          done();
        }, 100);
      });
    }
  );

  it('should send data as JSON if request content-type is application/json', function (done) {
    var response;

    axios.post('/foo', 123, {headers: {'Content-Type': 'application/json'}}).then(function (_response) {
      response = _response;
    }, function (err) {
      done(err);
    });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        responseText: ''
      });

      setTimeout(function () {
        expect(response).toBeTruthy();
        expect(request.requestHeaders['Content-Type']).toBe('application/json');
        expect(JSON.parse(request.params)).toBe(123);
        done();
      }, 100);
    });
  });

  it('should not assume JSON if responseType is not `json`', function (done) {
    var response;

    axios.get('/foo', {
      responseType: 'text',
      transitional: {
        forcedJSONParsing: false
      }
    }).then(function (_response) {
      response = _response;
    }, function (err) {
      done(err);
    });

    var rawData = '{"x":1}';

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        responseText: rawData
      });

      setTimeout(function () {
        expect(response).toBeTruthy();
        expect(response.data).toBe(rawData);
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
