describe('origins', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    document.cookie = axios.defaults.xsrfCookieName + '=;expires=' + new Date(Date.now() - 86400000).toGMTString();
    jasmine.Ajax.uninstall();
  });

  it('should support instance config merging', function () {
    const instanceA = axios.create({
      origins: {
        'foo.com': {
          foo: 'fooValue'
        },

        'bar.com': {
          foo: 'barValue'
        }
      }
    });

    const instanceB = instanceA.create({
      origins: {
        'bar.com': {
          foo: 'barValue2'
        }
      }
    });

    return instanceB.get('/test', {
      async adapter(config) {
        expect(config.origins).toEqual({
          'foo.com': {
            foo: 'fooValue'
          },

          'bar.com': {
            foo: 'barValue2'
          }
        });

        return {status: 200, headers: new axios.AxiosHeaders()};
      }
    })



  });
});
