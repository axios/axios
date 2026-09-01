import { describe, it, expect } from 'vitest';
import { isNativeError } from 'node:util/types';
import CanceledError from '../../../lib/cancel/CanceledError.js';

describe('cancel::CanceledError', () => {
  describe('toString', () => {
    it('returns the default message when message is not specified', () => {
      const cancel = new CanceledError();

      expect(cancel.toString()).toBe('CanceledError: canceled');
    });

    it('returns the provided message when message is specified', () => {
      const cancel = new CanceledError('Operation has been canceled.');

      expect(cancel.toString()).toBe('CanceledError: Operation has been canceled.');
    });
  });

  it('is recognized as a native error by Node util/types', () => {
    expect(isNativeError(new CanceledError('My Canceled Error'))).toBe(true);
  });
  describe('cause', () => {
    it('is absent when no cause is supplied', () => {
      expect(new CanceledError('x')).not.toHaveProperty('cause');
    });

    it('is installed non-enumerable so it cannot break structured loggers', () => {
      const reason = { self: null };
      reason.self = reason;
      const cancel = new CanceledError(null, undefined, undefined, reason);

      expect(cancel.cause).toBe(reason);
      expect(Object.keys(cancel)).not.toContain('cause');
      expect(() => JSON.stringify(cancel.toJSON())).not.toThrow();
    });

    it('leaves the message alone', () => {
      expect(new CanceledError(null, undefined, undefined, 'TimeoutError').message).toBe('canceled');
    });
  });
});
