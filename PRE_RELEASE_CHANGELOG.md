# Pre-Release Changelog

## Unreleased

## Features

## Bug Fixes

- **Node HTTP adapter - negative timeouts:** A negative `timeout`, including fractional values such as `-0.5`, now fails immediately as a timeout (`ECONNABORTED`, or `ETIMEDOUT` with `transitional.clarifyTimeoutError`) before any connection is opened, matching the fetch adapter. Previously Node's `ERR_OUT_OF_RANGE` was thrown from a follow-redirects socket callback as an uncaught exception that crashed the process, or surfaced as a raw `RangeError` with `maxRedirects: 0`, while fractional negatives were truncated to `-0` and disabled the timeout on the native transport. This commonly happens when a timeout is computed from a deadline that has already passed. Valid timeouts keep their existing integer conversion, including exponent-form strings such as `"1e3"`, which still apply their integer prefix. No new API or type changes. (**[#11246](https://github.com/axios/axios/pull/11246)**)

## Documentation

- **README sponsor name:** Corrected sponsor name typo `BSAP SE` → `SAP SE` in the README sponsor listing. This updates sponsor recognition only, with no runtime, public API, or type compatibility changes. ([#11373](https://github.com/axios/axios/pull/11373))
- **Error identification:** Corrected the error `name` description in the README and English, French, Spanish, and Chinese error-handling guides. Cancellation errors use `CanceledError`, and wrapped errors may retain their original name, so the guides now recommend `axios.isAxiosError(error)` for identifying Axios errors and `axios.isCancel(error)` for detecting cancellations instead of comparing `name`. Documentation only; no runtime, public API, or type changes. ([#11374](https://github.com/axios/axios/pull/11374))
- **v1.21.0 release notes and docs:** Added the published v1.21.0 release notes to `CHANGELOG.md`. Applied the 13 pending `PRE_RELEASE_DOCS.md` entries from v1.20.0 and v1.21.0 to the English, Spanish, French, and Chinese docs site, including upgrade-guide sections for both releases. Cleared the released entries from `PRE_RELEASE_CHANGELOG.md`, and reduced `PRE_RELEASE_DOCS.md` to the README updates that remain pending for those entries. No runtime, public API, or type compatibility changes.

## Maintenance

<!-- Record test-only changes, internal refactors, tooling, dependency updates, and CI changes without a user-visible behavior change here. -->

- **CI runners:** Switched GitHub Actions jobs from GitHub-hosted `ubuntu-latest` runners to the `namespace-profile-axios` Namespace runner profile. The npm publish job stays on `ubuntu-latest` because npm provenance and trusted publishing require GitHub-hosted runners. CI only; no runtime, public API, or type compatibility changes.
