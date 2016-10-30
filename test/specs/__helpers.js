// Polyfill ES6 Promise
require('es6-promise').polyfill();

// Polyfill URLSearchParams
URLSearchParams = require('url-search-params');

// Import axios
axios = require('../../index');

// Jasmine config
jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
jasmine.getEnv().defaultTimeoutInterval = 20000;

// Is this an old version of IE that lacks standard objects like DataView, ArrayBuffer, FormData, etc.
isOldIE = /MSIE (8|9)\.0/.test(navigator.userAgent);

// Get Ajax request using an increasing timeout to retry
getAjaxRequest = (function () {
var attempts = 0;
var MAX_ATTEMPTS = 5;
var ATTEMPT_DELAY_FACTOR = 5;

function getAjaxRequest() {
  return new Promise(function (resolve, reject) {
    attempts = 0;
    attemptGettingAjaxRequest(resolve, reject);
  });
}

function attemptGettingAjaxRequest(resolve, reject) {
  var delay = attempts * attempts * ATTEMPT_DELAY_FACTOR;

  if (attempts++ > MAX_ATTEMPTS) {
    reject(new Error('No request was found'));
    return;
  }

  setTimeout(function () {
    var request = jasmine.Ajax.requests.mostRecent();
    if (request) {
      resolve(request);
    } else {
      attemptGettingAjaxRequest(resolve, reject);
    }
  }, delay);
}

return getAjaxRequest;
})();

// Validate an invalid character error
validateInvalidCharacterError = function validateInvalidCharacterError(error) {
  expect(/character/i.test(error.message)).toEqual(true);
};

// Setup basic auth tests
setupBasicAuthTest = function setupBasicAuthTest() {
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
      var request = jasmine.Ajax.requests.mostRecent();

      expect(request.requestHeaders['Authorization']).toEqual('Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==');
      done();
    }, 100);
  });

  it('should fail to encode HTTP Basic auth credentials with non-Latin1 characters', function (done) {
    axios('/foo', {
      auth: {
        username: 'Aladßç£☃din',
        password: 'open sesame'
      }
    }).then(function(response) {
      done(new Error('Should not succeed to make a HTTP Basic auth request with non-latin1 chars in credentials.'));
    }).catch(function(error) {
      validateInvalidCharacterError(error);
      done();
    });
  });
};
