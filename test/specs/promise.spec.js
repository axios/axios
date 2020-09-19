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
});
