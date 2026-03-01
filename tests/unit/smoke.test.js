import { describe, expect, test } from 'vitest';

describe('vitest unit smoke', () => {
  test('runs in node environment', () => {
    expect(typeof process.versions.node).toBe('string');
  });
});
