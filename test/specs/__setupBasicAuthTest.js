var axios = require('../../index');

module.exports = function setupBasicAuthTest() {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should accept HTTP Basic auth with username/password', function (done) {
    axios({
      url: '/foo',
      auth: {
        username: 'Aladdin',
        password: 'open sesame'
      }
    });

    setTimeout(function () {
      var request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['Authorization']).toEqual('Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==');
      done();
    }, 0);
  });

  it('should fail to encode HTTP Basic auth credentials with non-Latin1 characters', function (done) {
    axios({
      url: '/foo',
      auth: {
        username: 'Aladßç£☃din',
        password: 'open sesame'
      }
    }).then(function(response) {
      done(new Error('Should not succeed to make a HTTP Basic auth request with non-latin1 chars in credentials.'));
    }).catch(function(error) {
      expect(error.message).toEqual('INVALID_CHARACTER_ERR: DOM Exception 5');
      done();
    });
  });
};
