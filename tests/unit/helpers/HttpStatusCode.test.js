import { describe, it, expect } from 'vitest';
import HttpStatusCode from '../../../lib/helpers/HttpStatusCode.js';

describe('helpers::HttpStatusCode', () => {
  it('should expose Cloudflare status 520 in both directions', () => {
    expect(HttpStatusCode.WebServerReturnsAnUnknownError).toBe(520);
    expect(HttpStatusCode[520]).toBe('WebServerReturnsAnUnknownError');
  });
});
