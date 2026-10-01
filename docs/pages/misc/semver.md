# Semantic versioning

Semantic versioning is a versioning scheme that is used to communicate the nature of changes in a software package. It is a simple set of rules and requirements that dictate how version numbers are assigned and incremented.

## axios versioning

axios follows the semantic versioning scheme. This means that each version of axios is assigned a version number that consists of three parts: major, minor, and patch. The version number is incremented based on the nature of the changes in the release.

In the past axios may have at times not strictly followed semantic versioning, however going forward there will be a much stricter adherence to the semantic versioning scheme to ensure that users can rely on the version numbers to communicate the nature of changes in the library.

A brief overview of the versioning scheme is provided below.

## Version format

A semantic version number consists of three parts:

1. Major version
2. Minor version
3. Patch version

The version number is written as `MAJOR.MINOR.PATCH`. Each part of the version number has a specific meaning:

- **Major version**: Incremented when you make incompatible API changes.
- **Minor version**: Incremented when you add functionality in a backwards-compatible manner.
- **Patch version**: Incremented when you make backwards-compatible bug fixes.

## Pre-release versions

In addition to the three parts of the version number, you can append a pre-release version. This is done by adding a hyphen and a series of dot-separated identifiers immediately following the patch version. For example, `1.0.0-alpha.1`.

Pre-release versions are used to indicate that a version is unstable and might not satisfy the intended compatibility requirements as denoted by the version number. Pre-release versions are ordered based on the order of the identifiers. For example, `1.0.0-alpha.1` comes before `1.0.0-alpha.2`.

## Version ranges

When you specify a version range for a package, you can use a variety of operators to specify the range of versions that are acceptable. The following operators are available:

- `>`: Greater than
- `<`: Less than
- `>=`: Greater than or equal to
- `<=`: Less than or equal to
- `~`: Approximately equal to
- `^`: Compatible with

For example, `^1.0.0` means that any version greater than or equal to `1.0.0` and less than `2.0.0` is acceptable.
