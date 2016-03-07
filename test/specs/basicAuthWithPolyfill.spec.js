var window_btoa;

describe('basicAuth with btoa polyfill', function () {
  beforeAll(function() {
    window_btoa = window.btoa;
    window.btoa = undefined;
  });

  afterAll(function() {
    window.btoa = window_btoa;
    window_btoa = undefined;
  });

  it('should not have native window.btoa', function () {
    expect(window.btoa).toEqual(undefined);
  });

  setupBasicAuthTest();
});

