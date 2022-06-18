import CancelToken from '../../../lib/cancel/CancelToken';
import CanceledError from '../../../lib/cancel/CanceledError';

describe('CancelToken', function() {
  describe('constructor', function() {
    it('throws when executor is not specified', function() {
      expect(function() {
        new CancelToken();
      }).toThrowError(TypeError, 'executor must be a function.');
    });

    it('throws when executor is not a function', function() {
      expect(function() {
        new CancelToken(123);
      }).toThrowError(TypeError, 'executor must be a function.');
    });
  });

  describe('reason', function() {
    it('returns a CanceledError if cancellation has been requested', function() {
      let cancel;
      const token = new CancelToken(function(c) {
        cancel = c;
      });
      cancel('Operation has been canceled.');
      expect(token.reason).toEqual(jasmine.any(CanceledError));
      expect(token.reason.message).toBe('Operation has been canceled.');
    });

    it('returns undefined if cancellation has not been requested', function() {
      const token = new CancelToken(function() {});
      expect(token.reason).toBeUndefined();
    });
  });

  describe('promise', function() {
    it('returns a Promise that resolves when cancellation is requested', function(done) {
      let cancel;
      const token = new CancelToken(function(c) {
        cancel = c;
      });
      token.promise.then(function onFulfilled(value) {
        expect(value).toEqual(jasmine.any(CanceledError));
        expect(value.message).toBe('Operation has been canceled.');
        done();
      });
      cancel('Operation has been canceled.');
    });
  });

  describe('throwIfRequested', function() {
    it('throws if cancellation has been requested', function() {
      // Note: we cannot use expect.toThrowError here as CanceledError does not inherit from Error
      let cancel;
      const token = new CancelToken(function(c) {
        cancel = c;
      });
      cancel('Operation has been canceled.');
      try {
        token.throwIfRequested();
        fail('Expected throwIfRequested to throw.');
      } catch (thrown) {
        if (!(thrown instanceof CanceledError)) {
          fail('Expected throwIfRequested to throw a CanceledError, but it threw ' + thrown + '.');
        }
        expect(thrown.message).toBe('Operation has been canceled.');
      }
    });

    it('does not throw if cancellation has not been requested', function() {
      const token = new CancelToken(function() {});
      token.throwIfRequested();
    });
  });

  describe('source', function() {
    it('returns an object containing token and cancel function', function() {
      const source = CancelToken.source();
      expect(source.token).toEqual(jasmine.any(CancelToken));
      expect(source.cancel).toEqual(jasmine.any(Function));
      expect(source.token.reason).toBeUndefined();
      source.cancel('Operation has been canceled.');
      expect(source.token.reason).toEqual(jasmine.any(CanceledError));
      expect(source.token.reason.message).toBe('Operation has been canceled.');
    });
  });
});
