# Pre-Release Changelog

## Unreleased

## Features

## Bug Fixes

- **Node HTTP adapter - empty Blob/File uploads:** Empty Blob and File bodies now get their declared content type, or the `application/octet-stream` fallback, like nonempty ones, instead of the `application/x-www-form-urlencoded` default. As for nonempty bodies, an explicit string or `null` Content-Type is replaced; `Content-Type: false` still suppresses the header. (**#11277**)

## Documentation

- **v1.21.0 release notes and docs:** Added the published v1.21.0 release notes to `CHANGELOG.md`. Applied the 13 pending `PRE_RELEASE_DOCS.md` entries from v1.20.0 and v1.21.0 to the English, Spanish, French, and Chinese docs site, including upgrade-guide sections for both releases. Cleared the released entries from `PRE_RELEASE_CHANGELOG.md`, and reduced `PRE_RELEASE_DOCS.md` to the README updates that remain pending for those entries. No runtime, public API, or type compatibility changes.

## Maintenance

<!-- Record test-only changes, internal refactors, tooling, dependency updates, and CI changes without a user-visible behavior change here. -->
