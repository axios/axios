describe('transform', () => {
  beforeEach(() => {
    jasmine.Ajax.install();
  });

  afterEach(() => {
    jasmine.Ajax.uninstall();
  });

  it('should transform JSON to string', done => {
    var data = {
      foo: 'bar'
    };

    axios.post('/foo', data);

    getAjaxRequest().then(request => {
      expect(request.params).toEqual('{"foo":"bar"}');
      done();
    });
  });

  it('should transform string to JSON', done => {
    var response;

    axios('/foo').then(data => {
      response = data;
    });

    getAjaxRequest().then(request => {
      request.respondWith({
        status: 200,
        responseText: '{"foo": "bar"}'
      });

      setTimeout(() => {
        expect(typeof response.data).toEqual('object');
        expect(response.data.foo).toEqual('bar');
        done();
      }, 100);
    });
  });

  it('should override default transform', done => {
    var data = {
      foo: 'bar'
    };

    axios.post('/foo', data, {
      transformRequest: data => data
    });

    getAjaxRequest().then(request => {
      expect(typeof request.params).toEqual('object');
      done();
    });
  });

  it('should allow an Array of transformers', done => {
    var data = {
      foo: 'bar'
    };

    axios.post('/foo', data, {
      transformRequest: axios.defaults.transformRequest.concat(
        data => data.replace('bar', 'baz')
      )
    });

    getAjaxRequest().then(request => {
      expect(request.params).toEqual('{"foo":"baz"}');
      done();
    });
  });

  it('should allowing mutating headers', done => {
    var token = Math.floor(Math.random() * Math.pow(2, 64)).toString(36);

    axios('/foo', {
      transformRequest: (data, headers) => {
        headers['X-Authorization'] = token;
      }
    });

    getAjaxRequest().then(request => {
      expect(request.requestHeaders['X-Authorization']).toEqual(token);
      done();
    });
  });
});
