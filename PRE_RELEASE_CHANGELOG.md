# Pre-Release Changelog

## Unreleased

## Features

- **AxiosHeaders parameter parsing:** Added `AxiosHeaders.parseParameters()` as an opt-in parser for `AxiosHeaders#get()`. It returns a hardened null-prototype parameter map, removes RFC quoted-string delimiters, decodes quoted-pair escapes, preserves commas and semicolons inside quoted values, and trims only optional SP/HTAB whitespace while leaving the legacy `get(name, true)` parser unchanged. (**#11051**, closes **#11050**)

## Bug Fixes

- **Data URL size limits:** Corrected base64 `data:` URL size estimation so percent-embedded input cannot bypass `maxContentLength`. The Node HTTP adapter now bounds the raw `Buffer` allocation, including ignored characters and content after padding, while the fetch adapter preserves percent-decoded base64 semantics and excludes URL fragments from the payload estimate. (**#11061**)
- **AxiosError - aggregate errors:** `AxiosError.from()` now synthesizes a message from nested `AggregateError` entries when the outer message is blank, preserving dual-stack connection failure details in structured logs. (**#11059**, closes **#6721**)
- **AxiosError:** `AxiosError#toJSON()` now serializes `Set` values in request config snapshots as arrays instead of empty objects. (**#11044**, refs **#5910**)
- **HTTP Adapter - download progress:** Flushed the final `onDownloadProgress` callback before streamed responses emit `close`, preventing trailing progress notifications after consumers observe the stream as closed. (closes **#6878**)
- **URL construction:** `combineURLs()` now removes repeated trailing slashes from `baseURL` before joining a relative request URL, avoiding unintended double slashes in the final request path. (**#11038**)
- **Headers:** `AxiosHeaders#getSetCookie()` now always returns an array for present `set-cookie` values, including programmatic single-value headers. (**#11037**)
- **Headers:** Response header parsing now preserves an empty first value for singleton Node-style headers when later duplicate header lines are present, instead of replacing it with the duplicate. (**#11036**)
- **Core - custom config:** `mergeConfig()` now preserves own enumerable symbol keys, allowing symbol-keyed custom request config fields to reach interceptors and adapters. (**#11043**, closes **#11042**)
- **Params serialization:** Custom `paramsSerializer.encode` functions now receive the active `AxiosURLSearchParams` instance as `this`, matching the intended `encoder.call(this, value, defaultEncode)` behavior during query string construction. (**#11019**)
- **Runtime and types hardening:** Guarded several edge-case crashes in cookie decoding, data URI parsing, form serialization, config merging, option validation, XHR cleanup, and Node HTTP URL serialization error handling. Type declarations now expose missing `CanceledError`, `CancelToken`, `AxiosHeaders`, `SerializerOptions`, and Cloudflare 52x status-code members that already exist at runtime. (**#10959**)
- **HTTP Adapter - native env proxy:** Avoid double-applying environment proxy handling when Node.js native HTTP proxy support is active for the selected agent. Axios still resolves env proxies itself when the selected agent is not using Node's `proxyEnv` support. (**#10942**, closes **#7299**)
- **HTTP Adapter - socketPath:** Path-only request URLs (e.g. `'/foo'`) now work again with `config.socketPath`, fixing the `TypeError [ERR_INVALID_URL]` regression introduced in 1.7.4 when `new URL()` was added to the dispatch path. A synthetic `http://localhost` base is supplied only when an own `socketPath` is set, so absolute URLs, non-socket requests, and prototype-polluted `socketPath` values are unaffected. (**#6611**)
- **Fetch adapter cancellation:** Composed `AbortSignal`s now abort immediately when any input signal is already aborted, so pre-canceled fetch-adapter requests preserve cancellation semantics instead of starting work. (**#11035**)
- **NO_PROXY wildcard matching:** `shouldBypassProxy` now honors `*` when it appears as one entry in a comma- or space-separated `NO_PROXY` list, not only when the entire variable is exactly `*`. (**#11053**)
- **NO_PROXY IPv4 normalization:** `shouldBypassProxy` now canonicalises NO_PROXY entries and request hostnames written in Node's URL-parser-accepted shorthand, octal (`0177.0.0.1`), and hex (`0x7f.0.0.1`) forms to dotted-decimal before comparison, including shorthand tails such as `127.65535` -> `127.0.255.255`. Invalid octets, 1-part inputs, 5+ parts, and out-of-range tails remain fail-closed. (**#11029**)
- **Core - malformed URL error message:** The `ERR_INVALID_URL` error thrown for `http:`/`https:` URLs missing the `//` after the protocol (added in the malformed-URL SSRF hardening, #11000) now includes the offending URL, e.g. `Invalid URL "https:example.com": missing "//" after protocol`. This makes the rejection self-diagnosable; the control-character-normalized form of the URL is reported, with userinfo (credentials), query parameter values, and fragment contents redacted (parameter names, host and path are kept) so secrets are not leaked into the always-serialized `AxiosError.message`. (closes **#11008**)
- **FormData:** Removed browser-reachable `Buffer` fallback code from `toFormData` ArrayBuffer/TypedArray handling, avoiding unnecessary browser `buffer` polyfills while preserving Node.js `Buffer` conversion for non-spec FormData implementations. (**#11018**, closes **#10990**)
- **FormData:** `formDataToJSON`/`formToJSON` no longer split field names on `-`, spaces, `+`, `*`, or `&`; only bracket and dot notation create nested keys, so a key like `user-name` stays literal. (**#11006**, closes **#5402**)

## Documentation

- **Request data defaults:** Clarified that `data` is request-specific and is not inherited or deep-merged from global or instance defaults. Shared body fields should be added with a request interceptor or `transformRequest`, scoped carefully to avoid sending sensitive values to unintended endpoints.

## Release Tracking

- **Proxy Agent Streams:** Guarded Node HTTP adapter TCP keep-alive setup so proxy agents that return generic Duplex streams do not throw when `setKeepAlive` is unavailable. (**#10917**, closes **#10908**)
