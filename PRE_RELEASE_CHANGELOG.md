# Pre-Release Changelog

## Unreleased

## Bug Fixes

- **Proxy Agent Streams:** Guarded Node HTTP adapter TCP keep-alive setup so proxy agents that return generic Duplex streams do not throw when `setKeepAlive` is unavailable. (**#10917**, closes **#10908**)