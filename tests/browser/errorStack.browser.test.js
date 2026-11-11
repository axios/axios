import { describe, expect, it } from 'vitest';
import axios from '../../index.js';
import AxiosError, { CAUSED_BY_SEPARATOR } from '../../lib/core/AxiosError.js';

describe('wrapped error stacks', () => {
  it('preserves the wrapped stack after reconstructed request frames', async () => {
    const cause = new TypeError('connection failed');
    const sourceStack = cause.stack;
    const failure = AxiosError.from(cause, AxiosError.ERR_NETWORK);
    const error = await axios
      .request({ adapter: () => Promise.reject(failure) })
      .catch((reason) => reason);

    expect(error).toBe(failure);
    expect(sourceStack).toBeTypeOf('string');
    const causeIndex = error.stack.indexOf(CAUSED_BY_SEPARATOR);
    expect(causeIndex).toBeGreaterThan(0);
    expect(error.stack.slice(causeIndex)).toBe(CAUSED_BY_SEPARATOR + sourceStack);
    expect(error.cause).toBe(cause);
    expect(Object.getOwnPropertyDescriptor(error, 'cause').enumerable).toBe(false);
  });

  it('normalizes errors even when the wrapped stack getter throws', () => {
    const cause = new Error('connection failed');
    Object.defineProperty(cause, 'stack', {
      get() {
        throw new Error('stack unavailable');
      },
    });

    const error = AxiosError.from(cause, AxiosError.ERR_NETWORK);

    expect(error.cause).toBe(cause);
    expect(error.code).toBe(AxiosError.ERR_NETWORK);
    expect(error.stack).not.toContain(CAUSED_BY_SEPARATOR);
  });
});
