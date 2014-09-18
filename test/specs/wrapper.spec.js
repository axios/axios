describe('wrapper', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  it('should make an http request', function () {
    axios({
      url: '/foo'
    });

    var request = jasmine.Ajax.requests.mostRecent();
    expect(request.url).toBe('/foo');
  });

  it('should default common headers', function () {
    axios({
      url: '/foo'
    });

    var request = jasmine.Ajax.requests.mostRecent();
    var headers = axios.defaults.headers.common;
    for (var key in headers) {
      if (headers.hasOwnProperty(key)) {
        expect(request.requestHeaders[key]).toEqual(headers[key]);
      }
    }
  });

  it('should add extra headers for post', function () {
    axios({
      method: 'post',
      url: '/foo',
      data: {
        firstName: 'foo',
        lastName: 'bar'
      }
    });

    var request = jasmine.Ajax.requests.mostRecent();
    var headers = axios.defaults.headers.post;
    for (var key in headers) {
      if (headers.hasOwnProperty(key)) {
        expect(request.requestHeaders[key]).toEqual(headers[key]);
      }
    }
  });

  it('should support binary data as array buffer', function () {
    var input = new Int8Array(2);
    input[0] = 1;
    input[1] = 2;

    axios({
      method: 'post',
      url: '/foo',
      data: input.buffer
    });

    var request = jasmine.Ajax.requests.mostRecent();
    var output = new Int8Array(request.params.buffer);
    expect(output.length).toEqual(2);
    expect(output[0]).toEqual(1);
    expect(output[1]).toEqual(2);
  });

  it('should support binary data as array buffer view', function () {
    var input = new Int8Array(2);
    input[0] = 1;
    input[1] = 2;

    axios({
      method: 'post',
      url: '/foo',
      data: input
    });

    var request = jasmine.Ajax.requests.mostRecent();
    var output = new Int8Array(request.params.buffer);
    expect(output.length).toEqual(2);
    expect(output[0]).toEqual(1);
    expect(output[1]).toEqual(2);
  });

  it('should remove content-type if data is empty', function () {
    axios({
      method: 'post',
      url: '/foo'
    });

    var request = jasmine.Ajax.requests.mostRecent();
    expect(request.requestHeaders['content-type']).toEqual(undefined);
  });
});