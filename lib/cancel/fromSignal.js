'use strict';

var CanceledError = require('./CanceledError');

module.exports = function fromSignal(signal, config, request) {
  var error = new CanceledError(null, config, request);

  if (signal) {
    try {
      var reason = signal.reason;
      if (reason !== undefined) {
        error.reason = reason;
      }
    } catch (e) {
      // A custom signal getter must not prevent cancellation.
    }
  }

  return error;
};
