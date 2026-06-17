# Pre-Release Changelog

## Unreleased

## Bug Fixes

- **HTTP Adapter - socketPath:** Path-only request URLs (e.g. `'/foo'`) now work again with `config.socketPath`, fixing the `TypeError [ERR_INVALID_URL]` regression introduced in 1.7.4 when `new URL()` was added to the dispatch path. A synthetic `http://localhost` base is supplied only when an own `socketPath` is set, so absolute URLs, non-socket requests, and prototype-polluted `socketPath` values are unaffected. (**#6611**)

## Release Tracking

- **Proxy Agent Streams:** Guarded Node HTTP adapter TCP keep-alive setup so proxy agents that return generic Duplex streams do not throw when `setKeepAlive` is unavailable. (**#10917**, closes **#10908**)
