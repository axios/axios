
describe('browser fetch', function () {
  beforeEach(function () {
    setupMockFetch();
  });

  it('should have the same methods as default instance', function () {
      const instance = axios.create();
      expect(axios.FetchAdapter).toBeDefined();
      expect(instance.FetchAdapter).not.toBeDefined();
  });

  it('fake adapter should fail', function (done) {
    axios('https://stubbed_domain.local:1/foo', {
      adapter: 'i-do-not-exist'
    }).then(function () {
      throw new Error('should not happen');
    }, function (err) {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should support specifying the `fetch` adapter by name', function (done) {
    axios('https://stubbed_domain.local:1/foo', fetchConfigurator({
      adapter: 'fetch'
    })).then(function () {
      done();
    });
  });

  it('should support specifying the `fetch` adapter by global reference', function (done) {
    expect(axios.FetchAdapter).toBeDefined();
    axios('https://stubbed_domain.local:1/foo', fetchConfigurator({
      adapter: axios.FetchAdapter
    })).then(function () {
      done();
    });
  });

  it('should support specifying a URL by string', function (done) {
    axios('https://stubbed_domain.local:1/foo', fetchConfigurator()).then(function () {
      expect(getFetch().input.url).toBe('https://stubbed_domain.local:1/foo');
      done();
    });
  });

  it('should support fetching by URL object', function (done) {
    axios(new URL('https://stubbed_domain.local:1/foo'), fetchConfigurator()).then(function () {
      expect(getFetch().input.url).toBe('https://stubbed_domain.local:1/foo');
      done();
    }, function () {
      throw new Error('should not happen');
    });
  });

  it('should support specifying a URL object in config', function (done) {
    axios(fetchConfigurator({
      url: new URL('https://stubbed_domain.local:1/foo'),
    })).then(function () {
      expect(getFetch().input.url).toBe('https://stubbed_domain.local:1/foo');
      done();
    });
  });

  it('should translate relative URL to same-origin request', function (done) {
    const origin = window.location.origin;

    axios('/foo', fetchConfigurator()).then(function () {
      expect(getFetch().input.url).toBe(`${origin}/foo`);
      done();
    });
  });

  // not yet supported
  // it('should support fetching by Request object', function (done) {
  //   const url = new URL('https://stubbed_domain.local:1/foo');
  //   const req = new Request(url);
  //
  //   axios(req, fetchConfigurator()).then(function () {
  //     expect(getFetch().input.url).toBe('https://stubbed_domain.local:1/foo');
  //     done();
  //   }, function () {
  //     throw new Error('should not happen');
  //   });
  // });

  afterEach(function () {
    teardownMockFetch();
  });
});
