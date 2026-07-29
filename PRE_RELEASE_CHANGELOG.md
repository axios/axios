# Pre-Release Changelog

## Unreleased

## Bug Fixes

- **Interceptor storage:** Removed trailing interceptor tombstones after ejection so repeated register-then-eject cycles no longer grow the handlers array, while preserving its public array shape, interceptor iteration behavior, and interceptor ID identity across registrations. (**#11070**)
