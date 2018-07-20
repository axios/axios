var Cancel = require('../../../lib/cancel/Cancel');

describe('Cancel', () => {
  describe('toString', () => {
    it('returns correct result when message is not specified', () => {
      var cancel = new Cancel();
      expect(cancel.toString()).toBe('Cancel');
    });

    it('returns correct result when message is specified', () => {
      var cancel = new Cancel('Operation has been canceled.');
      expect(cancel.toString()).toBe('Cancel: Operation has been canceled.');
    });
  });
});
