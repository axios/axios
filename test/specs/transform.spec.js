describe('transform', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  it('should transform JSON to string', function () {
    var data = {
      foo: 'bar'
    };

    axios({
      url: '/foo',
      method: 'post',
      data: data
    });

    var request = jasmine.Ajax.requests.mostRecent();
    expect(request.params).toEqual('{"foo":"bar"}');
  });

  it('should override default transform', function () {
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

    var request = jasmine.Ajax.requests.mostRecent();
    expect(typeof request.params).toEqual('object');
  });

  it('should allow an Array of transformers', function () {
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

    var request = jasmine.Ajax.requests.mostRecent();
    expect(request.params).toEqual('{"foo":"baz"}');
  });

  it('should allowing mutating headers', function () {
    var token = Math.floor(Math.random() * Math.pow(2, 64)).toString(36);

    axios({
      url: '/foo',
      transformRequest: function (data, headers) {
        headers['X-Authorization'] = token;
      }
    });

    var request = jasmine.Ajax.requests.mostRecent();
    expect(request.requestHeaders['X-Authorization']).toEqual(token);
  });
});