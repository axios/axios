import { describe, it, expect } from 'vitest';
import resolveProtocols from '../../../lib/helpers/resolveProtocols.js';
import platform from '../../../lib/platform/index.js';

describe('helpers::resolveProtocols', () => {
  it('returns the platform defaults when nothing is configured', () => {
    expect(resolveProtocols()).toBe(platform.protocols);
    expect(resolveProtocols({})).toBe(platform.protocols);
    expect(resolveProtocols({ additionalProtocols: [] })).toBe(platform.protocols);
  });

  it('appends configured schemes to the platform defaults', () => {
    const protocols = resolveProtocols({ additionalProtocols: ['capacitor'] });

    expect(protocols).toContain('capacitor');
    platform.protocols.forEach((scheme) => expect(protocols).toContain(scheme));
  });

  it('accepts schemes written with a trailing colon or in mixed case', () => {
    expect(resolveProtocols({ additionalProtocols: ['Capacitor:'] })).toContain('capacitor');
  });

  it('never removes a platform default', () => {
    const protocols = resolveProtocols({ additionalProtocols: ['capacitor'] });

    expect(protocols).toContain('http');
    expect(protocols).toContain('https');
  });

  it('ignores a non-array value', () => {
    expect(resolveProtocols({ additionalProtocols: 'capacitor' })).toBe(platform.protocols);
  });

  it('ignores non-string entries', () => {
    expect(resolveProtocols({ additionalProtocols: [1, null, {}, 'ok'] })).toEqual([
      ...platform.protocols,
      'ok',
    ]);
  });

  it('does not duplicate a scheme that is already supported', () => {
    const protocols = resolveProtocols({ additionalProtocols: ['http', 'HTTP:'] });

    expect(protocols.filter((scheme) => scheme === 'http')).toHaveLength(1);
  });

  it('does not read the option from a polluted prototype', () => {
    Object.prototype.additionalProtocols = ['capacitor'];

    try {
      expect(resolveProtocols({})).toBe(platform.protocols);
    } finally {
      delete Object.prototype.additionalProtocols;
    }
  });

  it('does not leak into the platform list', () => {
    const before = platform.protocols.slice();
    resolveProtocols({ additionalProtocols: ['capacitor'] });

    expect(platform.protocols).toEqual(before);
  });
});
