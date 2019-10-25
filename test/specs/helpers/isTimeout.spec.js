var isTimeout = require('../../../lib/helpers/isTimeout');

describe('isTimeout', function () {
  it('should return true when the axiosTimeout key is truthy on it\'s first argument', function () {
    var o = { axiosTimeout: true };
    expect(isTimeout(o)).toEqual(true);
  });

  it('should return false when the axiosTimeout key is unset on it\'s first argument', function () {
    var o = { };
    expect(isTimeout(o)).toEqual(false);
  });
});
