import CanceledError from '../../../lib/cancel/CanceledError';

describe('Cancel', function() {
  describe('toString', function() {
    it('returns correct result when message is not specified', function() {
      const cancel = new CanceledError();
      expect(cancel.toString()).toBe('CanceledError: canceled');
    });

    it('returns correct result when message is specified', function() {
      const cancel = new CanceledError('Operation has been canceled.');
      expect(cancel.toString()).toBe('CanceledError: Operation has been canceled.');
    });
  });
  it('should be a native error as checked by the NodeJS `isNativeError` function', async function (){
    if((typeof process !== 'undefined') && (process.release.name === 'node')){
      let {isNativeError} = require('node:util/types');
      expect(isNativeError(new CanceledError("My Cancelled Error"))).toBeTruthy();
    }
  });
});
