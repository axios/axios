var CancelToken = require('../../../lib/cancel/CancelToken');
var Cancel = require('../../../lib/cancel/Cancel');

describe('CancelToken', () => {
  describe('constructor', () => {
    it('throws when executor is not specified', () => {
      expect(() => {
        new CancelToken();
      }).toThrowError(TypeError, 'executor must be a function.');
    });

    it('throws when executor is not a function', () => {
      expect(() => {
        new CancelToken(123);
      }).toThrowError(TypeError, 'executor must be a function.');
    });
  });

  describe('reason', () => {
    it('returns a Cancel if cancellation has been requested', () => {
      var cancel;
      var token = new CancelToken(c => {
        cancel = c;
      });
      cancel('Operation has been canceled.');
      expect(token.reason).toEqual(jasmine.any(Cancel));
      expect(token.reason.message).toBe('Operation has been canceled.');
    });

    it('returns undefined if cancellation has not been requested', () => {
      var token = new CancelToken(() => {});
      expect(token.reason).toBeUndefined();
    });
  });

  describe('promise', () => {
    it('returns a Promise that resolves when cancellation is requested', done => {
      var cancel;
      var token = new CancelToken(c => {
        cancel = c;
      });
      token.promise.then(function onFulfilled(value) {
        expect(value).toEqual(jasmine.any(Cancel));
        expect(value.message).toBe('Operation has been canceled.');
        done();
      });
      cancel('Operation has been canceled.');
    });
  });

  describe('throwIfRequested', () => {
    it('throws if cancellation has been requested', () => {
      // Note: we cannot use expect.toThrowError here as Cancel does not inherit from Error
      var cancel;
      var token = new CancelToken(c => {
        cancel = c;
      });
      cancel('Operation has been canceled.');
      try {
        token.throwIfRequested();
        fail('Expected throwIfRequested to throw.');
      } catch (thrown) {
        if (!(thrown instanceof Cancel)) {
          fail('Expected throwIfRequested to throw a Cancel, but it threw ' + thrown + '.');
        }
        expect(thrown.message).toBe('Operation has been canceled.');
      }
    });

    it('does not throw if cancellation has not been requested', () => {
      var token = new CancelToken(() => {});
      token.throwIfRequested();
    });
  });

  describe('source', () => {
    it('returns an object containing token and cancel function', () => {
      var source = CancelToken.source();
      expect(source.token).toEqual(jasmine.any(CancelToken));
      expect(source.cancel).toEqual(jasmine.any(Function));
      expect(source.token.reason).toBeUndefined();
      source.cancel('Operation has been canceled.');
      expect(source.token.reason).toEqual(jasmine.any(Cancel));
      expect(source.token.reason.message).toBe('Operation has been canceled.');
    });
  });
});
