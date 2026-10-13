import { describe, expect, it } from 'vitest';

import isURLSameOrigin from '../../lib/helpers/isURLSameOrigin.js';

describe('helpers::isURLSameOrigin (vitest browser)', () => {
  it('detects same origin', () => {
    expect(isURLSameOrigin(window.location.href)).toBe(true);
  });

  it('detects different origin', () => {
    expect(isURLSameOrigin('https://github.com/axios/axios')).toBe(false);
  });

  it('detects a different port on the same hostname', () => {
    const url = new URL(window.location.href);
    url.port = url.port === '65535' ? '65534' : '65535';

    expect(isURLSameOrigin(url.href)).toBe(false);
  });

  it('detects a different protocol on the same hostname', () => {
    const url = new URL(window.location.href);
    url.protocol = url.protocol === 'http:' ? 'https:' : 'http:';

    expect(isURLSameOrigin(url.href)).toBe(false);
  });

  it.each(['', '/resource', 'resource?query=value#fragment'])(
    'resolves the relative URL %j against the document base',
    (url) => {
      expect(isURLSameOrigin(url)).toBe(true);
    }
  );
});
