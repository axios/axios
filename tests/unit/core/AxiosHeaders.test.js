import { describe, it, expect } from 'vitest';
import AxiosHeaders from '../../../lib/core/AxiosHeaders.js';

describe('core::AxiosHeaders', () => {
  describe('whitespace-only input', () => {
    // Some XMLHttpRequest polyfills (notably React Native on HarmonyOS for
    // large multipart responses) can return '\n', '\r\n' or ' ' from
    // getAllResponseHeaders() instead of either a proper header block or ''.
    // The xhr adapter feeds that value straight into AxiosHeaders.from(),
    // which used to throw "header name must be a non-empty string" from
    // inside onloadend, leaving the request promise unsettled.
    it('treats "\\n" as an empty headers no-op', () => {
      expect(() => new AxiosHeaders('\n')).not.toThrow();
      const h = new AxiosHeaders('\n');
      expect(Object.keys(h)).toHaveLength(0);
    });

    it('treats "\\r\\n" as an empty headers no-op', () => {
      expect(() => new AxiosHeaders('\r\n')).not.toThrow();
      const h = new AxiosHeaders('\r\n');
      expect(Object.keys(h)).toHaveLength(0);
    });

    it('treats " " (single space) as an empty headers no-op', () => {
      expect(() => new AxiosHeaders(' ')).not.toThrow();
      const h = new AxiosHeaders(' ');
      expect(Object.keys(h)).toHaveLength(0);
    });

    it('AxiosHeaders.from() with whitespace-only string returns empty headers', () => {
      expect(() => AxiosHeaders.from('\n')).not.toThrow();
      const h = AxiosHeaders.from('\r\n');
      expect(Object.keys(h)).toHaveLength(0);
    });
  });

  describe('regression', () => {
    it('still parses a valid raw header block', () => {
      const h = new AxiosHeaders('Content-Type: application/json\n');
      expect(h.get('content-type')).toBe('application/json');
    });

    it('still supports set(name, value) for a single header name', () => {
      const h = new AxiosHeaders();
      h.set('X-Foo', 'bar');
      expect(h.get('x-foo')).toBe('bar');
    });

    it('still treats null/undefined input as empty headers', () => {
      expect(Object.keys(new AxiosHeaders(null))).toHaveLength(0);
      expect(Object.keys(new AxiosHeaders(undefined))).toHaveLength(0);
    });

    it('still treats "" as empty headers', () => {
      expect(Object.keys(new AxiosHeaders(''))).toHaveLength(0);
    });
  });
});
