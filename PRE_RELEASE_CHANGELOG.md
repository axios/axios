# Pre-Release Changelog

## Unreleased

## Features

- **Proxy bypass CIDR ranges:** Added IPv4 and IPv6 CIDR matching to `NO_PROXY`/`no_proxy`, including bracketed IPv6 and IPv4-mapped IPv6 normalization, while malformed ranges fail closed. A `/0` entry bypasses the proxy for its entire address family.
- **HTTP status code names:** Added the RFC 9110 names `HttpStatusCode.ContentTooLarge` for 413 and `HttpStatusCode.UnprocessableContent` for 422 across the runtime API and ESM/CommonJS declarations. The existing `PayloadTooLarge` and `UnprocessableEntity` names remain as deprecated aliases, and numeric reverse lookups retain their existing v1.x names for compatibility. (**#11082**, closes **#11066**)

## Bug Fixes

- **combineURLs with missing baseURL:** Guard against `undefined`/`null`/non-string `baseURL` so `combineURLs(undefined, "/users")` returns the relative path instead of throwing `TypeError: Cannot read properties of undefined (reading "length")`. Empty string baseURL is treated the same way. (closes **#11282**)

- **Percent-encoded Base64 data URLs:** Decode URL-escaped Base64 alphabet, padding, and whitespace before converting the Node HTTP adapter's data URL response. Estimate the Buffer backing allocation after the same decoding so encoded alphabet and padding no longer inflate byte-limit checks, while avoiding the per-character decoding scan for unescaped Base64. Ordinary Base64 inputs, forgiving Buffer decoding, and case-insensitive URL schemes and Base64 markers are preserved; pre-allocation limits still count ignored characters and content after padding. (**[#11294](https://github.com/axios/axios/pull/11294)**)
- **URL scheme casing:** Accept uppercase and mixed-case supported schemes in the XHR adapter and Node data URLs. Keep data URL allocation estimates aligned with decoding so configured limits reject oversized inputs before Buffer allocation, including ignored Base64 tails. URL paths, query values, payload casing, and unsupported-protocol rejection remain unchanged; no new API or type changes. (**[#11163](https://github.com/axios/axios/pull/11163)**)
