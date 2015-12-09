var axios = require('../../index');

describe('options', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should accept HTTP Basic auth with user/pass', function (done) {
    var request;

    axios({
      url: '/foo',
      auth: {
        user: 'Aladdin',
        pass: 'open sesame'
      }
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['Authorization']).toEqual('Basic: QWxhZGRpbjpvcGVuIHNlc2FtZQ==');
      done();
    }, 0);
  });

  it('should accept HTTP Basic auth with username/pass', function (done) {
    var request;

    axios({
      url: '/foo',
      auth: {
        username: 'Aladdin',
        pass: 'open sesame'
      }
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['Authorization']).toEqual('Basic: QWxhZGRpbjpvcGVuIHNlc2FtZQ==');
      done();
    }, 0);
  });

  it('should accept HTTP Basic auth with user/password', function (done) {
    var request;

    axios({
      url: '/foo',
      auth: {
        user: 'Aladdin',
        password: 'open sesame'
      }
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['Authorization']).toEqual('Basic: QWxhZGRpbjpvcGVuIHNlc2FtZQ==');
      done();
    }, 0);
  });

  it('should accept HTTP Basic auth with username/password', function (done) {
    var request;

    axios({
      url: '/foo',
      auth: {
        username: 'Aladdin',
        password: 'open sesame'
      }
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['Authorization']).toEqual('Basic: QWxhZGRpbjpvcGVuIHNlc2FtZQ==');
      done();
    }, 0);
  });
});
