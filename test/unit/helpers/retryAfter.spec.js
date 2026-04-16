'use strict';

const {
  parseRetryAfter,
  shouldRetry,
  getRetryDelay
} = require('../../../lib/helpers/retryAfter');

describe('parseRetryAfter', () => {

  it('returns null when headers object is null', () => {
    expect(parseRetryAfter(null)).toBeNull();
  });

  it('returns null when headers object is undefined', () => {
    expect(parseRetryAfter(undefined)).toBeNull();
  });

  it('returns null when Retry-After header is absent', () => {
    expect(parseRetryAfter({ 'content-type': 'application/json' })).toBeNull();
  });

  it('parses lowercase retry-after delta-seconds correctly', () => {
    expect(parseRetryAfter({ 'retry-after': '60' })).toBe(60000);
  });

  it('parses mixed-case Retry-After delta-seconds correctly', () => {
    expect(parseRetryAfter({ 'Retry-After': '120' })).toBe(120000);
  });

  it('parses a delta-seconds value of 0 as 0ms', () => {
    expect(parseRetryAfter({ 'retry-after': '0' })).toBe(0);
  });

  it('parses a large delta-seconds value', () => {
    expect(parseRetryAfter({ 'retry-after': '3600' })).toBe(3600000);
  });

  it('parses a future HTTP-date and returns positive ms', () => {
    const future = new Date(Date.now() + 5000).toUTCString();
    const result = parseRetryAfter({ 'retry-after': future });
    expect(result).toBeGreaterThan(4000);
    expect(result).toBeLessThanOrEqual(5000);
  });

  it('parses a past HTTP-date and clamps to 0ms', () => {
    const past = new Date(Date.now() - 5000).toUTCString();
    const result = parseRetryAfter({ 'retry-after': past });
    expect(result).toBe(0);
  });

  it('returns null for an unparseable header value', () => {
    expect(parseRetryAfter({ 'retry-after': 'not-a-date' })).toBeNull();
  });
});

describe('shouldRetry', () => {

  it('returns false when config has no retry key', () => {
    expect(shouldRetry({}, { response: { status: 429 } }, 0)).toBe(false);
  });

  it('returns false when config is null', () => {
    expect(shouldRetry(null, { response: { status: 429 } }, 0)).toBe(false);
  });

  it('returns false when retry.retries is 0 (default)', () => {
    const config = { retry: { retries: 0 } };
    expect(shouldRetry(config, { response: { status: 429 } }, 0)).toBe(false);
  });

  it('returns true for 429 when within retry limit', () => {
    const config = { retry: { retries: 3 } };
    const error  = { response: { status: 429 } };
    expect(shouldRetry(config, error, 0)).toBe(true);
    expect(shouldRetry(config, error, 1)).toBe(true);
    expect(shouldRetry(config, error, 2)).toBe(true);
  });

  it('returns false once all retries are exhausted', () => {
    const config = { retry: { retries: 3 } };
    const error  = { response: { status: 429 } };
    expect(shouldRetry(config, error, 3)).toBe(false);
    expect(shouldRetry(config, error, 4)).toBe(false);
  });

  it('returns true for 503 when within retry limit', () => {
    const config = { retry: { retries: 2 } };
    const error  = { response: { status: 503 } };
    expect(shouldRetry(config, error, 0)).toBe(true);
  });

  it('returns false for 404 (not a retryable code by default)', () => {
    const config = { retry: { retries: 3 } };
    const error  = { response: { status: 404 } };
    expect(shouldRetry(config, error, 0)).toBe(false);
  });

  it('returns false for 500 (not a retryable code by default)', () => {
    const config = { retry: { retries: 3 } };
    const error  = { response: { status: 500 } };
    expect(shouldRetry(config, error, 0)).toBe(false);
  });

  it('retries on custom status codes when configured', () => {
    const config = { retry: { retries: 2, retryStatusCodes: [500, 502] } };
    const error  = { response: { status: 500 } };
    expect(shouldRetry(config, error, 0)).toBe(true);
  });

  it('returns false for network error (no response)', () => {
    const config = { retry: { retries: 3 } };
    const error  = new Error('Network Error');
    expect(shouldRetry(config, error, 0)).toBe(false);
  });
});

describe('getRetryDelay', () => {

  it('returns Retry-After header value when present and respectRetryAfter is true', () => {
    const config = { retry: { respectRetryAfter: true, retryDelay: 500 } };
    const headers = { 'retry-after': '10' };
    expect(getRetryDelay(config, headers)).toBe(10000);
  });

  it('ignores Retry-After header when respectRetryAfter is false', () => {
    const config = { retry: { respectRetryAfter: false, retryDelay: 800 } };
    const headers = { 'retry-after': '10' };
    expect(getRetryDelay(config, headers)).toBe(800);
  });

  it('falls back to retryDelay when no Retry-After header is present', () => {
    const config = { retry: { respectRetryAfter: true, retryDelay: 750 } };
    expect(getRetryDelay(config, {})).toBe(750);
  });

  it('falls back to 1000ms default when retryDelay is not configured', () => {
    const config = { retry: {} };
    expect(getRetryDelay(config, {})).toBe(1000);
  });

  it('handles missing retry object gracefully', () => {
    const config = {};
    expect(getRetryDelay(config, {})).toBe(1000);
  });
});