var CanceledError = require('../../../lib/cancel/CanceledError');

describe('Cancel', function() {
  describe('toString', function() {
    it('returns correct result when message is not specified', function() {
      var cancel = new CanceledError();
      expect(cancel.toString()).toBe('CanceledError: canceled');
    });

    it('returns correct result when message is specified', function() {
      var cancel = new CanceledError('Operation has been canceled.');
      expect(cancel.toString()).toBe('CanceledError: Operation has been canceled.');
    });
  });
});
