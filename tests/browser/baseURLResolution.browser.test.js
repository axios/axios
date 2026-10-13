import { describe, it, expect } from 'vitest';
import resolveConfig from '../../lib/helpers/resolveConfig.js';
import isURLSameOrigin from '../../lib/helpers/isURLSameOrigin.js';

describe('document base URL resolution', function () {
  it('checks relative destinations against the current document base', function () {
    var base = document.createElement('base');
    base.href = 'https://other.example.invalid/nested/';
    document.head.insertBefore(base, document.head.firstChild);
    document.cookie = 'request-consistency=example; path=/';
    try {
      expect(isURLSameOrigin('resource')).toBe(false);
      expect(isURLSameOrigin('/resource')).toBe(false);
      expect(isURLSameOrigin(window.location.href)).toBe(true);
      var config = {
        url: 'resource',
        xsrfCookieName: 'request-consistency',
        xsrfHeaderName: 'X-Example',
      };
      expect(resolveConfig(config).headers.get('X-Example')).toBeUndefined();
      config.withXSRFToken = true;
      expect(resolveConfig(config).headers.get('X-Example')).toBe('example');
      delete config.withXSRFToken;
      base.href = window.location.href;
      expect(resolveConfig(config).headers.get('X-Example')).toBe('example');
    } finally {
      base.remove();
      document.cookie = 'request-consistency=; max-age=0; path=/';
    }
  });
});
