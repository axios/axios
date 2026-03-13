import { describe, expect, it } from 'vitest';

import isURLSameOrigin from '../../lib/helpers/isURLSameOrigin.js';

describe('helpers::isURLSameOrigin (vitest browser)', () => {
  it('detects same origin', () => {
    expect(isURLSameOrigin(window.location.href)).toBe(true);
  });

  it('detects different origin', () => {
    expect(isURLSameOrigin('https://github.com/axios/axios')).toBe(false);
  });
});
