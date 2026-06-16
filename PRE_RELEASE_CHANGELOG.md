# Pre-Release Changelog

## Unreleased

## New Features

- **HTTP Adapter - Zstandard:** Added automatic zstd decompression on Node.js versions that support it. `zstd` is only advertised in the default `Accept-Encoding` header when `transitional.advertiseZstdAcceptEncoding: true` is set. (**#6792**)

## Bug Fixes

- **AxiosHeaders:** Silently skip empty response header names emitted by some React Native Android responses instead of throwing. (**#6959**, **#10875**)
- **HTTP Adapter - native env proxy:** Avoid double-applying environment proxy handling when Node.js native HTTP proxy support is active for the selected agent. Axios still resolves env proxies itself when the selected agent is not using Node's `proxyEnv` support. (**#10942**, closes **#7299**)
- **Request Data:** Preserve enumerable symbol keys when merging plain request data before `transformRequest`. (**#6392**)

## Release Documentation TODO

- Update `README.md` request config docs for `transitional.advertiseZstdAcceptEncoding` and zstd decompression support.
- Update `docs/pages/advanced/request-config.md` for `transitional.advertiseZstdAcceptEncoding` and zstd decompression support.
- Update decompression-bomb security guidance in `README.md` and `docs/pages/misc/security.md` to mention zstd.
- Update Node.js proxy docs to describe the interaction between axios env proxy resolution and Node's native `NODE_USE_ENV_PROXY=1`, `--use-env-proxy`, and `NODE_OPTIONS=--use-env-proxy` modes. Note that axios defers to Node only when the selected HTTP/HTTPS agent uses native `proxyEnv` support; explicit `config.proxy` remains handled by axios.
