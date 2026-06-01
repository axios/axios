# Pre-Release Changelog

## Unreleased

## New Features

- **HTTP Adapter - Zstandard:** Added automatic zstd decompression on Node.js versions that support it. `zstd` is only advertised in the default `Accept-Encoding` header when `transitional.advertiseZstdAcceptEncoding: true` is set. (**#6792**)

## Bug Fixes

- **AxiosHeaders:** Silently skip empty response header names emitted by some React Native Android responses instead of throwing. (**#6959**, **#10875**)
- **Config Security:** Ignore inherited `params` and `paramsSerializer` values when resolving request config, preventing prototype-pollution gadgets from changing serialized URLs. (**#10922**)
- **Types:** Add the missing readonly `name: 'CanceledError'` declaration to CommonJS `CanceledError` typings to match the ESM declarations. (**#10922**)
- **Types:** Correct the CommonJS `isCancel` type guard to narrow cancellation errors to `CanceledError<T>`, matching the ESM declaration. (**#10952**)
- **HTTP Adapter - Auth on Redirect:** HTTP Basic credentials supplied via `config.auth` are now restored on same-origin redirects, fixing a regression caused by `follow-redirects` >= 1.15.8 that broke `POST` requests answered with a 303 Location. Cross-origin redirects continue to drop credentials, preserving the existing T-R2 mitigation in `THREATMODEL.md`. (**#6929**)
- **HTTP Adapter - Proxy TLS:** Preserve `httpsAgent` TLS options such as `ca` and `rejectUnauthorized` for HTTPS origins reached through a CONNECT proxy tunnel. (**#10953**)
- **HTTP Adapter - Socket Path:** Ignore inherited `socketPath` and `allowedSocketPaths` config values when building Node.js requests, preventing prototype-pollution SSRF via Unix sockets. (**#10901**)
- **React Native FormData:** Clear the default `Content-Type` header for React Native `FormData` requests so Android can build multipart bodies with the correct boundary. (**#10898**)
- **Request Data:** Preserve enumerable symbol keys when merging plain request data before `transformRequest`. (**#6392**)

## Release Documentation TODO

- Update `README.md` request config docs for `transitional.advertiseZstdAcceptEncoding` and zstd decompression support.
- Update `docs/pages/advanced/request-config.md` for `transitional.advertiseZstdAcceptEncoding` and zstd decompression support.
- Update decompression-bomb security guidance in `README.md` and `docs/pages/misc/security.md` to mention zstd.
