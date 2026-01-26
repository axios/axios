import axios from "../../index";

function validateInvalidCharacterError(error) {
  expect(/character/i.test(error.message)).toEqual(true);
};

describe('basicAuth', function () {
  // Validate an invalid character error
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should accept HTTP Basic auth with username/password', function (done) {
    axios('/foo', {
      auth: {
        username: 'Aladdin',
        password: 'open sesame'
      }
    });

    setTimeout(function () {
      const request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['Authorization']).toEqual('Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==');
      done();
    }, 100);
  });

  it('should accept HTTP Basic auth credentials without the password parameter', function (done) {
    axios('/foo', {
      auth: {
        username: 'Aladdin'
      }
    });

    setTimeout(function () {
      const request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['Authorization']).toEqual('Basic QWxhZGRpbjo=');
      done();
    }, 100);
  });

  it('should accept HTTP Basic auth credentials with non-Latin1 characters in password', function (done) {
    axios('/foo', {
      auth: {
        username: 'Aladdin',
        password: 'open ßç£☃sesame'
      }
    });

    setTimeout(function () {
      const request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['Authorization']).toEqual('Basic QWxhZGRpbjpvcGVuIMOfw6fCo+KYg3Nlc2FtZQ==');
      done();
    }, 100);
  });

  it('should fail to encode HTTP Basic auth credentials with non-Latin1 characters in username', function (done) {
    axios('/foo', {
      auth: {
        username: 'Aladßç£☃din',
        password: 'open sesame'
      }
    }).then(function (response) {
      done(new Error('Should not succeed to make a HTTP Basic auth request with non-latin1 chars in credentials.'));
    }).catch(function (error) {
      validateInvalidCharacterError(error);
      done();
    });
  });
});
