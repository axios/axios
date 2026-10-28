# Pre-Release Changelog

## Unreleased

## Features

## Bug Fixes

- **Typed array and DataView request bodies:** The default `transformRequest` now sends only the bytes a view exposes. A typed array or `DataView` that covers part of its `ArrayBuffer`, such as one created with `subarray()` or with a byte offset, previously had its entire backing buffer used as the request body, so unrelated bytes were transmitted with a larger `Content-Length`. A view on a `SharedArrayBuffer` also failed: the Node HTTP adapter rejected it with `ERR_BAD_REQUEST`, and the fetch adapter sent the text `[object SharedArrayBuffer]` as the body. Partial views and all views on a `SharedArrayBuffer` are now copied into an `ArrayBuffer` of their own length; views that cover their whole `ArrayBuffer` are still passed through without copying. Node `Buffer` bodies were already sent correctly and are unchanged. No API or type changes. (**[#11310](https://github.com/axios/axios/pull/11310)**, relates to **[#2564](https://github.com/axios/axios/issues/2564)**, **[#4068](https://github.com/axios/axios/issues/4068)**)

## Documentation

- **README sponsor name:** Corrected sponsor name typo `BSAP SE` → `SAP SE` in the README sponsor listing. This updates sponsor recognition only, with no runtime, public API, or type compatibility changes. ([#11373](https://github.com/axios/axios/pull/11373))
- **Error identification:** Corrected the error `name` description in the README and English, French, Spanish, and Chinese error-handling guides. Cancellation errors use `CanceledError`, and wrapped errors may retain their original name, so the guides now recommend `axios.isAxiosError(error)` for identifying Axios errors and `axios.isCancel(error)` for detecting cancellations instead of comparing `name`. Documentation only; no runtime, public API, or type changes. ([#11374](https://github.com/axios/axios/pull/11374))
- **v1.21.0 release notes and docs:** Added the published v1.21.0 release notes to `CHANGELOG.md`. Applied the 13 pending `PRE_RELEASE_DOCS.md` entries from v1.20.0 and v1.21.0 to the English, Spanish, French, and Chinese docs site, including upgrade-guide sections for both releases. Cleared the released entries from `PRE_RELEASE_CHANGELOG.md`, and reduced `PRE_RELEASE_DOCS.md` to the README updates that remain pending for those entries. No runtime, public API, or type compatibility changes.

## Maintenance

<!-- Record test-only changes, internal refactors, tooling, dependency updates, and CI changes without a user-visible behavior change here. -->

- **CI runners:** Switched GitHub Actions jobs from GitHub-hosted `ubuntu-latest` runners to the `namespace-profile-axios` Namespace runner profile. The npm publish job stays on `ubuntu-latest` because npm provenance and trusted publishing require GitHub-hosted runners. CI only; no runtime, public API, or type compatibility changes.
