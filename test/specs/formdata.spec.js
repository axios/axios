
describe('FormData', function() {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should allow FormData posting', function () {
    var response = axios.postForm('/foo', {
      a: 'foo',
      b: 'bar'
    });

    return getAjaxRequest().then(function (request) {
      expect(request.params).toEqual(jasmine.any(FormData));
      expect(request.params.get('a')).toEqual('foo');
      expect(request.params.get('b')).toEqual('bar');

      request.respondWith({
        status: 200,
        responseText: '{}'
      });

      return response;
    });
  });
});
