# Pre-Release Changelog

## Unreleased

## Security Fixes

- **HTTP Adapter Redirects:** Added a Node.js `sensitiveHeaders` request config option that strips caller-selected custom secret headers from cross-origin redirects. (**#10892**)

## Bug Fixes

- **Types:** Add the missing readonly `name: 'CanceledError'` declaration to CommonJS `CanceledError` typings to match the ESM declarations. (**#10922**)
- **Config Merge:** Added `transitional.validateStatusUndefinedResolves` (default `true`) so applications can opt into treating explicit `validateStatus: undefined` like an omitted option by setting it to `false`. `validateStatus: null` still accepts every response status. (**#10899**, closes **#6688**)

## Release Tracking

- ESM/CJS typings are updated for `transitional.validateStatusUndefinedResolves`; README/docs updates are tracked in `PRE_RELEASE_DOCS.md` for release preparation.
