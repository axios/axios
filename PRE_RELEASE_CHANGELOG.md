# Pre-Release Changelog

## Unreleased

## Features

## Bug Fixes

- **Node form-data typed arrays:** Preserve the raw bytes and view boundaries of typed arrays during Buffer conversion, matching Blob serialization. Wider numeric arrays no longer lose bytes, and BigInt arrays no longer throw during conversion. (**[#11264](https://github.com/axios/axios/pull/11264)**)

## Documentation

- **v1.21.0 release notes and docs:** Added the published v1.21.0 release notes to `CHANGELOG.md`. Applied the 13 pending `PRE_RELEASE_DOCS.md` entries from v1.20.0 and v1.21.0 to the English, Spanish, French, and Chinese docs site, including upgrade-guide sections for both releases. Cleared the released entries from `PRE_RELEASE_CHANGELOG.md`, and reduced `PRE_RELEASE_DOCS.md` to the README updates that remain pending for those entries. No runtime, public API, or type compatibility changes.

## Maintenance

<!-- Record test-only changes, internal refactors, tooling, dependency updates, and CI changes without a user-visible behavior change here. -->
