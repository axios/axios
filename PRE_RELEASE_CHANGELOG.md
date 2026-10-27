# Pre-Release Changelog

## Unreleased

## Features

## Bug Fixes

- **Fetch adapter - native FormData Content-Type in Node.js:** Native `FormData` bodies sent through the fetch adapter in Node.js now use the fetch-generated `multipart/form-data; boundary=...` header. Previously the request kept the `application/x-www-form-urlencoded` default (or any other non-multipart `Content-Type`) while fetch serialized a multipart body, so servers could not parse it. This matches the Node HTTP adapter and axios in browsers. A `multipart/form-data` type that already includes a boundary, such as one from the `form-data` package's `getHeaders()`, is preserved. No public API or type changes. (**[#11351](https://github.com/axios/axios/pull/11351)**, related to **[#6993](https://github.com/axios/axios/issues/6993)**)

## Documentation

- **README sponsor name:** Corrected sponsor name typo `BSAP SE` → `SAP SE` in the README sponsor listing. This updates sponsor recognition only, with no runtime, public API, or type compatibility changes. ([#11373](https://github.com/axios/axios/pull/11373))
- **Error identification:** Corrected the error `name` description in the README and English, French, Spanish, and Chinese error-handling guides. Cancellation errors use `CanceledError`, and wrapped errors may retain their original name, so the guides now recommend `axios.isAxiosError(error)` for identifying Axios errors and `axios.isCancel(error)` for detecting cancellations instead of comparing `name`. Documentation only; no runtime, public API, or type changes. ([#11374](https://github.com/axios/axios/pull/11374))
- **v1.21.0 release notes and docs:** Added the published v1.21.0 release notes to `CHANGELOG.md`. Applied the 13 pending `PRE_RELEASE_DOCS.md` entries from v1.20.0 and v1.21.0 to the English, Spanish, French, and Chinese docs site, including upgrade-guide sections for both releases. Cleared the released entries from `PRE_RELEASE_CHANGELOG.md`, and reduced `PRE_RELEASE_DOCS.md` to the README updates that remain pending for those entries. No runtime, public API, or type compatibility changes.

## Maintenance

<!-- Record test-only changes, internal refactors, tooling, dependency updates, and CI changes without a user-visible behavior change here. -->

- **CI runners:** Switched GitHub Actions jobs from GitHub-hosted `ubuntu-latest` runners to the `namespace-profile-axios` Namespace runner profile. The npm publish job stays on `ubuntu-latest` because npm provenance and trusted publishing require GitHub-hosted runners. CI only; no runtime, public API, or type compatibility changes.
