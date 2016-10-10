var Cancel = require('../../../lib/cancel/Cancel');

describe('Cancel', function() {
  describe('toString', function() {
    it('returns correct result when message is not specified', function() {
      var cancel = new Cancel();
      expect(cancel.toString()).toBe('Cancel');
    });

    it('returns correct result when message is specified', function() {
      var cancel = new Cancel('Operation has been canceled.');
      expect(cancel.toString()).toBe('Cancel: Operation has been canceled.');
    });
  });
});
