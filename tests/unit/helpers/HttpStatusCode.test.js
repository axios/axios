import { describe, it, expect } from 'vitest';
import HttpStatusCode from '../../../lib/helpers/HttpStatusCode.js';

describe('helpers::HttpStatusCode', () => {
  it('should expose RFC 9110 status aliases while preserving legacy reverse lookups', () => {
    expect(HttpStatusCode.ContentTooLarge).toBe(413);
    expect(HttpStatusCode.PayloadTooLarge).toBe(413);
    expect(HttpStatusCode[413]).toBe('PayloadTooLarge');

    expect(HttpStatusCode.UnprocessableContent).toBe(422);
    expect(HttpStatusCode.UnprocessableEntity).toBe(422);
    expect(HttpStatusCode[422]).toBe('UnprocessableEntity');
  });

  it('should expose Cloudflare status 520 in both directions', () => {
    expect(HttpStatusCode.WebServerReturnsAnUnknownError).toBe(520);
    expect(HttpStatusCode[520]).toBe('WebServerReturnsAnUnknownError');
  });
});
