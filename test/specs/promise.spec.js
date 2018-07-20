describe('promise', () => {
  beforeEach(() => {
    jasmine.Ajax.install();
  });

  afterEach(() => {
    jasmine.Ajax.uninstall();
  });

  it('should provide succinct object to then', done => {
    var response;

    axios('/foo').then(r => {
      response = r;
    });

    getAjaxRequest().then(request => {
      request.respondWith({
        status: 200,
        responseText: '{"hello":"world"}'
      });

      setTimeout(() => {
        expect(typeof response).toEqual('object');
        expect(response.data.hello).toEqual('world');
        expect(response.status).toEqual(200);
        expect(response.headers['content-type']).toEqual('application/json');
        expect(response.config.url).toEqual('/foo');
        done();
      }, 100);
    });
  });

  it('should support all', done => {
    var fulfilled = false;

    axios.all([true, 123]).then(() => {
      fulfilled = true;
    });

    setTimeout(() => {
      expect(fulfilled).toEqual(true);
      done();
    }, 100);
  });

  it('should support spread', done => {
    var sum = 0;
    var fulfilled = false;
    var result;

    axios
      .all([123, 456])
      .then(axios.spread((a, b) => {
        sum = a + b;
        fulfilled = true;
        return 'hello world';
      }))
      .then(res => {
        result = res;
      });

    setTimeout(() => {
      expect(fulfilled).toEqual(true);
      expect(sum).toEqual(123 + 456);
      expect(result).toEqual('hello world');
      done();
    }, 100);
  });
});
