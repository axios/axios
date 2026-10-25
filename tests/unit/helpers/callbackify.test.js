import { describe, it, expect, vi } from 'vitest';
import callbackify from '../../../lib/helpers/callbackify.js';

describe('helpers::callbackify', () => {
  it('returns non-function input untouched', () => {
    expect(callbackify(null)).toBeNull();
    expect(callbackify(undefined)).toBeUndefined();
  });

  it('handles callback-style functions', () => {
    const fn = (a, b, cb) => cb(null, a + b);
    const cbFn = callbackify(fn);
    const cb = vi.fn();

    cbFn(2, 3, cb);
    expect(cb).toHaveBeenCalledWith(null, 5);
  });

  it('handles async functions', async () => {
    const fn = async (a, b) => a + b;
    const cbFn = callbackify(fn);

    await new Promise((resolve) => {
      cbFn(2, 3, (err, result) => {
        expect(err).toBeNull();
        expect(result).toBe(5);
        resolve();
      });
    });
  });

  it('handles non-async Promise-returning functions', async () => {
    const fn = (a, b) => Promise.resolve(a + b);
    const cbFn = callbackify(fn);

    await new Promise((resolve) => {
      cbFn(2, 3, (err, result) => {
        expect(err).toBeNull();
        expect(result).toBe(5);
        resolve();
      });
    });
  });

  it('applies reducer when provided for Promise-returning functions', async () => {
    const fn = (a, b) => Promise.resolve([a, b]);
    const cbFn = callbackify(fn, (arr) => arr);

    await new Promise((resolve) => {
      cbFn('127.0.0.1', 4, (err, ip, family) => {
        expect(err).toBeNull();
        expect(ip).toBe('127.0.0.1');
        expect(family).toBe(4);
        resolve();
      });
    });
  });

  it('passes rejected Promise to callback', async () => {
    const error = new Error('DNS failure');
    const fn = () => Promise.reject(error);
    const cbFn = callbackify(fn);

    await new Promise((resolve) => {
      cbFn((err) => {
        expect(err).toBe(error);
        resolve();
      });
    });
  });

  it('passes synchronous throw to callback', () => {
    const error = new Error('Sync error');
    const fn = () => {
      throw error;
    };
    const cbFn = callbackify(fn);
    const cb = vi.fn();

    cbFn(cb);
    expect(cb).toHaveBeenCalledWith(error);
  });
});
