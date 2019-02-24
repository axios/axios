'use strict';

function AxiosException(message) {
  if (!(this instanceof AxiosException)) {
    return new AxiosException(message);
  }

  // Use a try/catch block to capture the stack trace. Capturing the stack trace here is
  // necessary, otherwise we will get the stack trace at the time the new error class was created,
  // rather than when it is instantiated.  We add `message` and `name` so that the stack trace
  // string will match our current error class.
  try {
    throw new Error(message);
  } catch (err) {
    this.stack = err.stack;
  }

  this.message = message || '';
}

AxiosException.prototype = new Error();
AxiosException.prototype.constructor = AxiosException;
AxiosException.prototype.name = AxiosException.name;

module.exports = AxiosException;
