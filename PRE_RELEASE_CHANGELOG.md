# Pre-Release Changelog

## Unreleased

## Bug Fixes

- **Params serialization:** Custom `paramsSerializer.encode` functions now receive the active `AxiosURLSearchParams` instance as `this`, matching the intended `encoder.call(this, value, defaultEncode)` behavior during query string construction. (**#11019**)
- **Runtime and types hardening:** Guarded several edge-case crashes in cookie decoding, data URI parsing, form serialization, config merging, option validation, XHR cleanup, and Node HTTP URL serialization error handling. Type declarations now expose missing `CanceledError`, `CancelToken`, `AxiosHeaders`, `SerializerOptions`, and Cloudflare 52x status-code members that already exist at runtime. (**#10959**)
- **HTTP Adapter - native env proxy:** Avoid double-applying environment proxy handling when Node.js native HTTP proxy support is active for the selected agent. Axios still resolves env proxies itself when the selected agent is not using Node's `proxyEnv` support. (**#10942**, closes **#7299**)
- **HTTP Adapter - socketPath:** Path-only request URLs (e.g. `'/foo'`) now work again with `config.socketPath`, fixing the `TypeError [ERR_INVALID_URL]` regression introduced in 1.7.4 when `new URL()` was added to the dispatch path. A synthetic `http://localhost` base is supplied only when an own `socketPath` is set, so absolute URLs, non-socket requests, and prototype-polluted `socketPath` values are unaffected. (**#6611**)
- **NO_PROXY IPv4 normalization:** `shouldBypassProxy` now canonicalises NO_PROXY entries and request hostnames written in Node's URL-parser-accepted shorthand, octal (`0177.0.0.1`), and hex (`0x7f.0.0.1`) forms to dotted-decimal before comparison, so a `NO_PROXY=127.1` entry matches a request to `http://127.0.0.1/` (and vice versa). The shorthand tail of a 2- or 3-part input is parsed as a full IPv4 number (hex/octal/decimal) and packed low-byte-right into the remaining octets, matching Node's URL parser, so `NO_PROXY=127.65535` matches `http://127.0.255.255/`, `NO_PROXY=127.0x00ff` matches `http://127.0.0.255/`, and `NO_PROXY=127.0177` matches `http://127.0.0.127/`. The helper is fail-safe: invalid octets (out of 0-255, non-hex digits), 1-part inputs, 5+ parts, and out-of-range tails (e.g. `127.16777216`) are returned unchanged so the policy falls through to non-bypass. (**#11029**)

## Documentation

- **Request data defaults:** Clarified that `data` is request-specific and is not inherited or deep-merged from global or instance defaults. Shared body fields should be added with a request interceptor or `transformRequest`, scoped carefully to avoid sending sensitive values to unintended endpoints.

## Release Tracking

- **Proxy Agent Streams:** Guarded Node HTTP adapter TCP keep-alive setup so proxy agents that return generic Duplex streams do not throw when `setKeepAlive` is unavailable. (**#10917**, closes **#10908**)
