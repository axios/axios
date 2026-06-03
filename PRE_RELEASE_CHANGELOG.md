# Pre-Release Changelog

## Unreleased

## Security Fixes

- **HTTP Adapter Redirects:** Added a Node.js `sensitiveHeaders` request config option that strips caller-selected custom secret headers from cross-origin redirects. (**#10892**)

## Bug Fixes

- **Types:** Add the missing readonly `name: 'CanceledError'` declaration to CommonJS `CanceledError` typings to match the ESM declarations. (**#10922**)
