# Pre-Release Changelog

## Unreleased

## Features

## Bug Fixes

- **Fetch and XHR adapters - param serialization errors:** Failures raised while building the query string, such as a lone surrogate in a param value or a throwing `paramsSerializer`, now reject with an `AxiosError` carrying `ERR_BAD_REQUEST` and the request config instead of a raw `URIError`, matching what the Node HTTP adapter already reported. Failures that are already an `AxiosError`, such as `ERR_FORM_DATA_DEPTH_EXCEEDED`, keep their code, and a `CanceledError` thrown by the serializer is rethrown unchanged so `axios.isCancel` still recognizes it. ([#11253](https://github.com/axios/axios/pull/11253))

## Documentation

- **v1.21.0 release notes and docs:** Added the published v1.21.0 release notes to `CHANGELOG.md`. Applied the 13 pending `PRE_RELEASE_DOCS.md` entries from v1.20.0 and v1.21.0 to the English, Spanish, French, and Chinese docs site, including upgrade-guide sections for both releases. Cleared the released entries from `PRE_RELEASE_CHANGELOG.md`, and reduced `PRE_RELEASE_DOCS.md` to the README updates that remain pending for those entries. No runtime, public API, or type compatibility changes.

## Maintenance

<!-- Record test-only changes, internal refactors, tooling, dependency updates, and CI changes without a user-visible behavior change here. -->
