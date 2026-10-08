<!--
Thanks for contributing to axios! A few quick notes:
- For non-trivial changes, please open an issue first so we can discuss the approach.
- Please do not open PRs that only update npm packages, lockfiles, or GitHub Actions versions. Maintainers and approved automated bots handle those after the 7-day delay unless a critical vulnerability requires manual maintainer action.
- Follow Conventional Commits in your commit messages (see CONTRIBUTING.md).
- Complete AGENTS.md's mandatory PR submission requirements and this template before requesting maintainer review.
- Every PR must include a PRE_RELEASE_CHANGELOG.md entry, including docs-only and test-only changes, unless AGENTS.md's narrow automated release-preparation exception applies. Use Maintenance for test-only, internal-refactor, tooling, dependency, and CI changes without a user-visible behavior change.
-->

## Summary

<!-- What does this PR do, and why? -->

## Linked issue

<!-- e.g. Closes #1234 -->

## Changes

<!-- Bullet list of the notable changes. Keep it short. -->

-

## Validation

<!-- List commands actually run, results, and relevant runtime versions. Explain checks that do not apply. Required checks that failed or could not run are blockers, not N/A; keep required-but-blocked local validation in a draft PR. After opening/updating the PR, record the actual GitHub Actions status for the latest commit, including pending/approval-required runs. -->

-

## Compatibility and documentation

<!-- State patch/minor/major impact, affected environments, and any intentional breaking behavior. Identify PRE_RELEASE_DOCS.md and index.d.ts/index.d.cts updates, or explain why they are not needed. -->

#### Checklist

- [ ] Scope, target branch, and linked issue/rationale checked
- [ ] `PRE_RELEASE_CHANGELOG.md` entry added or updated (or AGENTS.md's automated release-preparation exception explained)
- [ ] Regression tests and relevant negative/platform cases covered (or N/A with reason)
- [ ] Applicable local checks completed, with actual commands and results recorded above
- [ ] Deferred release docs and ESM/CJS types/tests updated where needed (or N/A with reason)
- [ ] Semver impact stated and intentional breaking changes explained
- [ ] Final diff reviewed for security, unrelated changes, generated artifacts, and test/debug leftovers
- [ ] Latest GitHub Actions status recorded separately from review/security bot results

<!-- If AI assisted with the changes or this pull request description, apply the existing ai-assisted repository label. Do not add a surfer emoji to the title or body. If you cannot apply labels, state that a maintainer needs to apply ai-assisted. -->
