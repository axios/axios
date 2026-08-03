# Pre-Release Changelog

## Unreleased

## Features

- **HTTP status code names:** Added the RFC 9110 names `HttpStatusCode.ContentTooLarge` for 413 and `HttpStatusCode.UnprocessableContent` for 422 across the runtime API and ESM/CommonJS declarations. The existing `PayloadTooLarge` and `UnprocessableEntity` names remain as deprecated aliases, and numeric reverse lookups retain their existing v1.x names for compatibility. (**#11082**, closes **#11066**)

## Bug Fixes

- **Node HTTP adapter - keep-alive memory retention:** Reused a module-scoped socket error listener so pooled keep-alive sockets no longer retain the adapter context, response body, and buffers from the request that first used each socket. Socket errors continue to destroy only the currently active request. (**#11091**)
- **XHR Adapter - final progress delivery:** `onDownloadProgress` and `onUploadProgress` now always receive a final delivery once the transfer reaches its `loadend` handler, made while that event is still dispatching, so listeners reading incremental data from `event.currentTarget` observe the complete response. Previously the final delivery happened only when a throttled progress event was still pending, and it replayed an event whose dispatch had already finished — `event.currentTarget` was `null` — so text-streaming consumers could lose every chunk after the first in browsers whose progress cadence kept deliveries inside the throttle window. Flushes triggered by stream errors or abort reasons are unaffected and still replay the last pending progress event. (closes **#6796**)
- **XHR Adapter - navigation-canceled requests:** A response that reaches `loadend` with status 0 is now rejected as an `ECONNABORTED` error instead of resolving as a success with an empty body. Firefox 152 stopped firing `error` and `abort` for requests canceled by a document navigation, leaving `loadend` as the only handler that runs, so those requests were settling as successful responses. Rejecting with `ECONNABORTED` matches what `onabort` raised on Firefox 151, so the outcome an application sees is unchanged by that update. Reads over `file:`, which some environments report as status 0 on success, still resolve, whether the scheme appears on the request URL, is inherited from a `file:` page origin by a relative request URL, or appears only on `responseURL`. Because no response was received, the rejection is not suppressed by `validateStatus`, matching how `onerror` and `onabort` already behave. (**#11094**, closes **#11093**)
- **Request error stacks:** Preserved original request failures when custom `Error` stack instrumentation returns non-string data or throws during optional stack decoration. (**#11109**, closes **#11108**)
- **Interceptor storage:** Removed trailing interceptor tombstones after ejection so repeated register-then-eject cycles no longer grow the handlers array, while preserving its public array shape, interceptor iteration behavior, and interceptor ID identity across registrations. (**#11070**)

## Documentation

- **Global search:** Added localized, private, in-browser full-text search for the active documentation language, with fuzzy and prefix matching.
