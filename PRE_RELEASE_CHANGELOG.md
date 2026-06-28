# Pre-Release Changelog

## Unreleased

## Bug Fixes

- **Params serialization:** Custom `paramsSerializer.encode` functions now receive the active `AxiosURLSearchParams` instance as `this`, matching the intended `encoder.call(this, value, defaultEncode)` behavior during query string construction. (**#11019**)
- **Runtime and types hardening:** Guarded several edge-case crashes in cookie decoding, data URI parsing, form serialization, config merging, option validation, XHR cleanup, and Node HTTP URL serialization error handling. Type declarations now expose missing `CanceledError`, `CancelToken`, `AxiosHeaders`, `SerializerOptions`, and Cloudflare 52x status-code members that already exist at runtime. (**#10959**)
- **HTTP Adapter - native env proxy:** Avoid double-applying environment proxy handling when Node.js native HTTP proxy support is active for the selected agent. Axios still resolves env proxies itself when the selected agent is not using Node's `proxyEnv` support. (**#10942**, closes **#7299**)
- **HTTP Adapter - socketPath:** Path-only request URLs (e.g. `'/foo'`) now work again with `config.socketPath`, fixing the `TypeError [ERR_INVALID_URL]` regression introduced in 1.7.4 when `new URL()` was added to the dispatch path. A synthetic `http://localhost` base is supplied only when an own `socketPath` is set, so absolute URLs, non-socket requests, and prototype-polluted `socketPath` values are unaffected. (**#6611**)
- **Core - malformed URL error message:** The `ERR_INVALID_URL` error thrown for `http:`/`https:` URLs missing the `//` after the protocol (added in the malformed-URL SSRF hardening, #11000) now includes the offending URL, e.g. `Invalid URL "https:example.com": missing "//" after protocol`. This makes the rejection self-diagnosable; the control-character-normalized form of the URL is reported, with userinfo (credentials), query parameter values, and fragment contents redacted (parameter names, host and path are kept) so secrets are not leaked into the always-serialized `AxiosError.message`. (closes **#11008**)
- **FormData:** Removed browser-reachable `Buffer` fallback code from `toFormData` ArrayBuffer/TypedArray handling, avoiding unnecessary browser `buffer` polyfills while preserving Node.js `Buffer` conversion for non-spec FormData implementations. (**#11018**, closes **#10990**)
- **FormData:** `formDataToJSON`/`formToJSON` no longer split field names on `-`, spaces, `+`, `*`, or `&`; only bracket and dot notation create nested keys, so a key like `user-name` stays literal. (**#11006**, closes **#5402**)

## Documentation

- **Request data defaults:** Clarified that `data` is request-specific and is not inherited or deep-merged from global or instance defaults. Shared body fields should be added with a request interceptor or `transformRequest`, scoped carefully to avoid sending sensitive values to unintended endpoints.

## Release Tracking

- **Proxy Agent Streams:** Guarded Node HTTP adapter TCP keep-alive setup so proxy agents that return generic Duplex streams do not throw when `setKeepAlive` is unavailable. (**#10917**, closes **#10908**)
