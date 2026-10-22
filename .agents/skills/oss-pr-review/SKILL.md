---
name: oss-pr-review
description: Review an open source GitHub PR with maintainer-grade criteria for project fit, adversarial risk, correctness, tests, security, semver, docs, CI, performance, and regression risk. User-invoked via `/oss-pr-review` with a PR number or URL. Always fetches the PR from GitHub via `gh`.
allowed-tools: Bash(gh:*), Bash(git:*), Read, Grep, Glob, WebFetch
---

# OSS PR Review

Run when the user types `/oss-pr-review <PR#>` or `/oss-pr-review <github-pr-url>`. This command reviews a GitHub PR in the current open source repository with a maintainer-grade bar, including whether the change belongs in the package or library at all.

## Quality Bar

Review as a maintainer protecting downstream users. Optimize for avoiding regressions in this order: project fit, correctness, security, compatibility, performance, maintainability, diff size. Do not approve vague "looks fine" changes. A PR either clearly meets the repo's bar or needs specific, actionable feedback.

Adopt an adversarial review posture: actively try to disprove the PR's claims, identify ways the change could be misused or fail under realistic hostile inputs, and surface the strongest argument against merging it. Be fair, but do not act as the PR author's advocate.

Concretely:

- The change belongs in this package or library: it advances the repo's apparent north star, serves a supported user group, and does not push unrelated product surface or policy into the wrong layer.
- No regressions: behavior covered by existing tests should not change unless the PR explicitly intends a breaking change and routes it correctly.
- No untested user-visible behavior: bug fixes need regression tests, and new behavior needs positive and relevant negative coverage.
- No silent compatibility breaks: public APIs, config defaults, generated artifacts, schemas, CLI output, exported types, and documented behavior all count.
- No security drift: changes near parsing, networking, auth, serialization, dependency loading, sandboxing, filesystem access, or command execution get extra scrutiny.
- No sloppiness: commented-out code, debug leftovers, broad lint suppressions, TODOs without tracking, copy-paste drift, and unexplained churn are blockers or clear requests for changes.

## Inputs

The user must supply a PR number or URL. If missing, ask once:

> Which PR should I review? Provide a PR number or GitHub URL.

Do not invent a PR number. Do not review the current branch unless the user explicitly asks for a local branch review instead.

## Step 1 - Fetch Context

Run these via `gh`:

```bash
gh repo view --json nameWithOwner,defaultBranchRef,description,homepageUrl,licenseInfo
gh pr view <PR#> --json number,title,author,baseRefName,headRefName,state,isDraft,labels,body,additions,deletions,changedFiles,commits,files,reviewDecision,statusCheckRollup,url
gh pr diff <PR#>
gh pr checks <PR#>
```

If `gh pr checks` has no checks or fails because checks are unavailable, continue and report that CI signal is unavailable.

Read repo-local maintainer guidance when present:

- `CONTRIBUTING.md`, `.github/CONTRIBUTING.md`
- `SECURITY.md`, `.github/SECURITY.md`
- `README.md`
- `CHANGELOG.md`, `RELEASE.md`, `MIGRATION.md`, `MIGRATION_GUIDE.md`
- PR template under `.github/`
- package/build metadata such as `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`, `Gemfile`, or `Makefile`

Infer and state the repo profile before reviewing:

- Language/runtime and package ecosystem.
- The package or library's apparent north star: its core purpose, target users, and boundaries based on README/docs/API shape.
- Public API surfaces and documented entry points.
- Supported platforms or runtimes.
- Test framework and CI coverage.
- Release/versioning style.
- Any documented security or contribution rules.

If the PR targets a branch that is not the default branch or an obvious supported release branch, flag it and ask the user whether to continue before giving a final verdict.

If the diff is large, say so up front and review in passes rather than pretending every line was reviewed equally.

## Step 2 - Review Checklist

Walk these in order. For each finding, cite `file:line` when possible. Keep adversarial notes evidence-based; do not invent theoretical risks that are not reachable from this PR.

### 1. Project Fit And North Star

- Identify the project or library's north star from README, docs, package metadata, exported API shape, issue labels, roadmap, or maintainer guidance.
- Decide whether the PR's problem is something the package should solve, not merely whether the implementation works.
- List concrete benefits: user value, interoperability, correctness, security, performance, maintainability, ecosystem expectations, or reduction of support burden.
- List tradeoffs: larger API surface, maintenance burden, policy coupling, dependency weight, confusing abstractions, platform/runtime commitments, performance cost, security exposure, semver risk, or precedent for unrelated scope.
- Flag PRs that solve an application-specific problem inside a general library, add niche behavior without a durable abstraction, duplicate ecosystem tooling, or conflict with documented project direction.
- If the right home is a plugin, recipe, downstream wrapper, docs example, optional package, or separate project, say so.

### 2. Adversarial Review

- State the strongest reason not to merge the PR.
- Try to falsify the PR's premise: is the bug/feature real, reachable, sufficiently common, and in scope for supported usage?
- Look for abuse cases and hostile inputs around the changed behavior, not only happy paths.
- Check for ways users could combine this change with existing APIs to bypass validation, authorization, sandboxing, type assumptions, resource limits, or compatibility promises.
- Look for hidden coupling to undocumented behavior, environmental assumptions, implicit ordering, global state, caches, clocks, randomness, locale, filesystem layout, network availability, or package manager behavior.
- If no adversarial concern remains, say what evidence made the concern acceptable.

### 3. PR Hygiene

- PR title follows the repo's convention. If none is documented, prefer Conventional Commits for squash-merge projects.
- PR body explains what changed, why, and how it was tested.
- Linked issue or rationale exists for non-trivial work.
- Commits are coherent if the repo preserves commit history.
- The diff avoids unrelated formatting, drive-by refactors, generated noise, or vendored churn.

### 4. Correctness

- The implementation solves the stated problem without only handling the narrow example.
- Edge cases are covered: empty input, invalid input, large input, concurrency, cancellation/timeouts, encoding, permissions, platform differences, and existing compatibility constraints.
- Error handling preserves useful diagnostics and does not swallow failures.
- State, cache, filesystem, network, database, or process side effects are deliberate and cleaned up.
- Existing behavior changes are intentional, documented, and tested.

### 5. Tests

- Bug fixes include a regression test that would fail without the fix.
- New behavior includes unit/integration/e2e coverage appropriate to the repo.
- Multi-platform or multi-runtime behavior is tested across the relevant supported environments.
- Security-sensitive fixes include focused regression tests.
- Snapshot/golden updates are justified by real behavior changes.
- "Manually tested" is not a substitute for automated tests unless the repo has no practical test harness; if so, call out residual risk.

### 6. Public API, Types, And Compatibility

- Public APIs, CLIs, schemas, config options, generated files, plugin hooks, and documented behavior remain compatible unless the PR is explicitly breaking.
- Type definitions, declarations, bindings, generated clients, docs examples, and runtime exports stay in sync.
- Deprecations keep the old path working when feasible and add clear migration guidance.
- Default values, output formatting, error classes/messages/codes, and enum/string literals are treated as compatibility surfaces when users could depend on them.

### 7. Security

Apply extra scrutiny to changes involving:

- Authentication, authorization, sessions, tokens, cookies, credentials, secrets, or environment variables.
- URL parsing, redirects, proxies, request routing, SSRF boundaries, CORS, headers, TLS, or network calls.
- Deserialization, parsing, templating, path traversal, archive extraction, file writes, symlinks, permissions, or sandbox escapes.
- Command execution, plugins, dynamic imports, dependency resolution, build scripts, CI, or package publishing.
- Prototype/object merging, schema validation, regexes, resource limits, compression, and untrusted input transformations.

Flag missing validation, weakened guards, unsafe defaults, leaked sensitive data, overly broad permissions, dependency risk, and changes that rely on trusted inputs without documenting that trust boundary.

### 8. Semver And Breaking Changes

Classify the PR as exactly one:

- major: breaking public behavior, API removal/rename, incompatible default change, narrowed type/schema, protocol/storage migration, or user-visible output change that existing consumers may rely on.
- minor: additive public API, option, capability, supported platform, or documented behavior.
- patch: bug fix, internal refactor, docs/test/CI/build-only change, or performance fix without public behavior change.

For each breaking change, identify the file/line, user-visible difference, affected users, and recommended route: reject, gate behind an opt-in flag, deprecate first, or target the next major release.

### 9. Documentation

Decide explicitly whether docs are needed. Required docs commonly include:

- `README.md` or docs site updates for public-facing behavior.
- API reference or generated docs for new/changed APIs.
- Migration guide for breaking changes or deprecations.
- Changelog/release note entry for user-visible fixes, features, security fixes, or breaking changes.
- Security docs for changed threat boundaries or vulnerability handling.

If no docs are needed, say why.

### 10. Build, Packaging, And Release Artifacts

- Generated or built artifacts match the repo's contribution rules.
- Package manifests, lockfiles, exports, entry points, schemas, and publish metadata are updated consistently.
- New runtime dependencies are justified, maintained, licensed appropriately, and not excessive for the repo's size or risk tolerance.
- Version bumps are present only if the repo expects them in feature PRs.

### 11. CI Signal

Summarize check status. Do not approve over red CI unless the failure is clearly unrelated and you state why. If important checks are missing for the changed area, call that out.

### 12. Performance And Regression Risk

Identify whether hot paths are touched. Infer hot paths from the repo: request/response loops, parsers, serializers, render loops, database queries, startup, dependency resolution, build pipelines, caches, and tight utility functions.

Flag:

- New allocations, repeated parsing, unnecessary cloning, sync work in async paths, extra network/filesystem calls, unbounded loops, broad invalidation, or N+1 behavior.
- Regex changes with backtracking risk or per-call recompilation.
- Added listeners/timers/resources without cleanup.
- Guard removals that may reintroduce old bugs.
- Platform-specific changes without parity checks.

If performance is plausibly impacted, ask for evidence: benchmark, profiler output, load test, before/after timings, or repo-appropriate measurements.

### 13. Disposition - Continue Or Close

Decide whether the PR should continue in place or be closed/rerouted.

Recommend close when:

- The PR addresses a problem that does not belong in this package or library.
- The approach is fundamentally wrong or in the wrong layer.
- Scope is unsalvageably mixed.
- A design/API decision is needed before code.
- The change is out of scope for the project.
- It is duplicate, superseded, already fixed, or stale beyond practical rescue.
- The base branch is wrong and rebasing would materially change the review.

Before recommending close, search for existing issues or PRs when possible. If a new issue is warranted, include the problem statement, what to preserve from the PR, and a kind close message maintainers can paste.

## Step 3 - Output Format

Use this exact structure:

```markdown
# PR #<num> - <title>

**Repo:** <owner/repo> **Author:** @<login> **Base:** <base> **Files:** <n> **+<add>/-<del>
**CI:** <pass|fail|pending|unavailable summary>

## Repo Profile

<language/runtime, public surfaces, supported platforms, test/CI signal, release style>

## Verdict

<Approve | Approve with nits | Request changes | Block | Close>
<one-sentence rationale>

## Project Fit

**North star:** <repo purpose, target users, and boundary>
**Benefits:** <concrete benefits, or "None demonstrated">
**Tradeoffs:** <maintenance/API/security/performance/precedent tradeoffs, or "None material">
**Fit:** <Strong | Acceptable | Questionable | Poor> - <one-sentence rationale>

## Adversarial Review

**Strongest objection:** <best reason not to merge>
**Abuse/failure modes checked:** <hostile inputs, misuse paths, or assumptions reviewed>
**Result:** <no remaining concern OR concise pointer to Blocking Issues / Non-Blocking Suggestions>

## Disposition

**<Continue | Close + open tracking issue | Close as duplicate/superseded/out-of-scope | Close as stale>**
<one-sentence rationale. If closing, include issue search and a paste-ready close message.>

## Semver

**<major | minor | patch>** - <one-line justification>

## Breaking Changes

<None. OR bullets with file:line, behavior difference, affected users, and route>

## Documentation

<No docs needed - <reason>. OR required docs/changelog/migration updates>

## Performance And Regression Risk

**Hot path touched:** <yes/no - where>
**Performance concern:** <none or specific concern>
**Regression risk:** <low/medium/high with reason>
**Evidence requested:** <none or concrete evidence needed>

## Blocking Issues

- <file:line> - <issue> - <requested change>

## Non-Blocking Suggestions

- <file:line> - <suggestion>

## Looks Good

- <specific positive observations>
```

The Repo Profile, Project Fit, Adversarial Review, Disposition, Semver, Breaking Changes, Documentation, and Performance And Regression Risk sections are mandatory even when clean.

Verdict rules:

- Block: security regression, broken or absent critical tests, unapproved breaking change, clear performance regression, removed defensive check, publish/package breakage, poor project fit with material downside, or serious sloppiness.
- Request changes: missing tests/docs for user-visible behavior, compatibility risk, failing relevant CI, unclear design, type/API drift, questionable project fit without enough benefit/tradeoff analysis, or plausible perf/security concern without evidence.
- Approve with nits: only small non-blocking issues remain.
- Approve: every mandatory section is clean and CI is acceptable.
- Close: the right action is rerouting rather than iterating.

## What This Command Does Not Do

- Does not post the review to GitHub unless the user explicitly asks.
- Does not check out the PR branch unless the user explicitly asks.
- Does not run the test suite unless the user asks or the review cannot be credible without it.
