# Pre-Release Changelog

## Unreleased

## Security Fixes

- **HTTP Adapter Redirects:** Added a Node.js `sensitiveHeaders` request config option that strips caller-selected custom secret headers from cross-origin redirects. (**#10892**)

## Bug Fixes

- **HTTP Adapter - socketPath:** Path-only request URLs (e.g. `'/foo'`) now work again with `config.socketPath`, fixing the `TypeError [ERR_INVALID_URL]` regression introduced in 1.7.4 when `new URL()` was added to the dispatch path. A synthetic `http://localhost` base is supplied only when an own `socketPath` is set, so absolute URLs, non-socket requests, and prototype-polluted `socketPath` values are unaffected. (**#6611**)
- **URL Validation:** Reject malformed `http:` and `https:` URLs that omit `//` before adapter URL normalization, returning `ERR_INVALID_URL` instead of silently normalizing invalid input. (**#10900**, closes **#7315**)
- **Types:** Add the missing readonly `name: 'CanceledError'` declaration to CommonJS `CanceledError` typings to match the ESM declarations. (**#10922**)
- **Config Merge:** Added `transitional.validateStatusUndefinedResolves` (default `true`) so applications can opt into treating explicit `validateStatus: undefined` like an omitted option by setting it to `false`. `validateStatus: null` still accepts every response status. (**#10899**, closes **#6688**)

## Release Tracking

- ESM/CJS typings are updated for `transitional.validateStatusUndefinedResolves`; README/docs updates are tracked in `PRE_RELEASE_DOCS.md` for release preparation.
