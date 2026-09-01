import { describe, it, expect } from 'vitest';
import abortReason from '../../../lib/helpers/abortReason.js';

describe('helpers::abortReason', () => {
  it('returns undefined without a signal', () => {
    expect(abortReason()).toBeUndefined();
    expect(abortReason(null)).toBeUndefined();
  });

  it('returns undefined for a signal that has not aborted', () => {
    expect(abortReason(new AbortController().signal)).toBeUndefined();
  });

  it('returns the reason an abort was triggered with', () => {
    const controller = new AbortController();
    controller.abort('TimeoutError');

    expect(abortReason(controller.signal)).toBe('TimeoutError');
  });

  it('returns the default reason for a bare abort', () => {
    const controller = new AbortController();
    controller.abort();

    expect(abortReason(controller.signal).name).toBe('AbortError');
  });

  it('swallows a signal whose reason getter throws', () => {
    const signal = {
      aborted: true,
      get reason() {
        throw new TypeError('branded getter');
      },
    };

    expect(abortReason(signal)).toBeUndefined();
  });
});
