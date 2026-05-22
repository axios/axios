# Pre-Release Changelog

## Unreleased

## New Features

- **HTTP Adapter - Zstandard:** Added automatic zstd decompression on Node.js versions that support it. `zstd` is only advertised in the default `Accept-Encoding` header when `transitional.advertiseZstdAcceptEncoding: true` is set. (**#6792**)

## Bug Fixes

- **Request Data:** Preserve enumerable symbol keys when merging plain request data before `transformRequest`. (**#6392**)

## Release Documentation TODO

- Update `README.md` request config docs for `transitional.advertiseZstdAcceptEncoding` and zstd decompression support.
- Update `docs/pages/advanced/request-config.md` for `transitional.advertiseZstdAcceptEncoding` and zstd decompression support.
- Update decompression-bomb security guidance in `README.md` and `docs/pages/misc/security.md` to mention zstd.
