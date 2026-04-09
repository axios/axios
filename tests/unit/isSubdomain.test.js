import { describe, it, expect } from 'vitest'
import isSubdomain from '../../lib/helpers/isSubdomain.js'

describe('isSubdomain', () => {
  it('returns true for valid subdomain', () => {
    expect(isSubdomain('api.example.com', 'example.com')).toBe(true)
    expect(isSubdomain('sub.api.example.com', 'example.com')).toBe(true)
  })

  it('returns false when same domain', () => {
    expect(isSubdomain('example.com', 'example.com')).toBe(false)
  })

  it('returns false when not a subdomain', () => {
    expect(isSubdomain('fakeexample.com', 'example.com')).toBe(false)
    expect(isSubdomain('example.co', 'example.com')).toBe(false)
  })

  it('returns false when domain is only suffix match without dot separator', () => {
    expect(isSubdomain('badexample.com', 'example.com')).toBe(false)
  })

  it('returns false when subdomain is too short', () => {
    expect(isSubdomain('a.com', 'com')).toBe(false)
  })

  it('handles edge cases', () => {
    expect(isSubdomain('', 'example.com')).toBe(false)
    expect(isSubdomain('example.com', '')).toBe(false)
  })

  it('works with multi-level domains', () => {
    expect(isSubdomain('a.b.example.co.uk', 'example.co.uk')).toBe(true)
    expect(isSubdomain('example.co.uk', 'example.co.uk')).toBe(false)
  })
})
