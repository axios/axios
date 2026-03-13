import { describe, expect, it } from 'vitest';

import CancelToken from '../../lib/cancel/CancelToken.js';
import CanceledError from '../../lib/cancel/CanceledError.js';

describe('CancelToken (vitest browser)', () => {
  describe('constructor', () => {
    it('throws when executor is not specified', () => {
      expect(() => new CancelToken()).toThrowError(
        new TypeError('executor must be a function.')
      );
    });

    it('throws when executor is not a function', () => {
      expect(() => new CancelToken(123)).toThrowError(
        new TypeError('executor must be a function.')
      );
    });
  });

  describe('reason', () => {
    it('returns a CanceledError if cancellation has been requested', () => {
      let cancel;
      const token = new CancelToken((c) => {
        cancel = c;
      });

      cancel('Operation has been canceled.');

      expect(token.reason).toBeInstanceOf(CanceledError);
      expect(token.reason?.message).toBe('Operation has been canceled.');
    });

    it('returns undefined if cancellation has not been requested', () => {
      const token = new CancelToken(() => {});

      expect(token.reason).toBeUndefined();
    });
  });

  describe('promise', () => {
    it('resolves when cancellation is requested', async () => {
      let cancel;
      const token = new CancelToken((c) => {
        cancel = c;
      });

      cancel('Operation has been canceled.');
      const reason = await token.promise;

      expect(reason).toBeInstanceOf(CanceledError);
      expect(reason.message).toBe('Operation has been canceled.');
    });
  });

  describe('throwIfRequested', () => {
    it('throws if cancellation has been requested', () => {
      let cancel;
      const token = new CancelToken((c) => {
        cancel = c;
      });

      cancel('Operation has been canceled.');

      expect(() => token.throwIfRequested()).toThrow(CanceledError);
      expect(() => token.throwIfRequested()).toThrow('Operation has been canceled.');
    });

    it('does not throw if cancellation has not been requested', () => {
      const token = new CancelToken(() => {});

      expect(() => token.throwIfRequested()).not.toThrow();
    });
  });

  describe('source', () => {
    it('returns an object containing token and cancel function', () => {
      const source = CancelToken.source();

      expect(source.token).toBeInstanceOf(CancelToken);
      expect(source.cancel).toBeTypeOf('function');
      expect(source.token.reason).toBeUndefined();

      source.cancel('Operation has been canceled.');

      expect(source.token.reason).toBeInstanceOf(CanceledError);
      expect(source.token.reason?.message).toBe('Operation has been canceled.');
    });
  });
});
