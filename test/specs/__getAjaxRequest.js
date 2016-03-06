var attempts = 0;
var MAX_ATTEMPTS = 5;
var ATTEMPT_DELAY_FACTOR = 5;

module.exports = function getAjaxRequest() {
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
