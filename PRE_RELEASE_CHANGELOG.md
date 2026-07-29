# Pre-Release Changelog

## Unreleased

## Bug Fixes

- **Request error stacks:** Preserved original request failures when custom `Error` stack instrumentation returns non-string data or throws during optional stack decoration. (**#11109**, closes **#11108**)
- **Interceptor storage:** Removed trailing interceptor tombstones after ejection so repeated register-then-eject cycles no longer grow the handlers array, while preserving its public array shape, interceptor iteration behavior, and interceptor ID identity across registrations. (**#11070**)
