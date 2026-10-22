import { describe, expect, test } from 'bun:test';
import axios from 'axios';

describe('Bun importing', () => {
  test('default export is callable', () => {
    expect(typeof axios).toBe('function');
  });

  test('named exports are present', async () => {
    const exports = (await import('axios')) as Record<string, any>;

    expect(typeof (exports.axios ?? exports.default)).toBe('function');
    expect(typeof (exports.create ?? exports.default.create)).toBe('function');
    expect(typeof exports.isCancel).toBe('function');
    expect(typeof exports.isAxiosError).toBe('function');
    expect(typeof exports.CancelToken).toBe('function');
    expect(typeof exports.VERSION).toBe('string');
  });
});
