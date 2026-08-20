# Codebase change log

> Newest entries appear first. This log records durable source and knowledge-base outcomes plus honest recovery context; it is not a raw commit log.

## 2026-08-20T11:06:37+02:00 — Correct Plan 001 to repository-native validation

- **Status:** Corrective
- **Source change:** Revision remains `4943cc2749393d55f0c8de28a5c57aca403aaeb7`; the dirty implementation snapshot is unchanged, while the active plan now records the repository-wide no-E2E directive and the corrected validation mode.
- **Plan:** [Active Plan 001](../plans/001-node-20-runtime-baseline.md) — blocked and not archived
- **Affected areas:** Plan completion policy, acceptance evidence, compatibility status, and knowledge-base validation guidance.

### What changed

- Recorded the maintainer's 2026-08-20 directive, “in this repo we will never have e2e tests,” as authoritative repository-wide policy.
- Selected repository-native validation for Plan 001. The absence of `docs/e2e/` is intentional and no longer blocks completion; native unit, browser, module, packed-package smoke, packaging, lockfile, Bun/Deno, and Node matrix evidence remains mandatory.
- Corrected the current status without rewriting the earlier partial history. Plan 001 remains blocked solely because the branch has not been pushed and required Node 20/22/26 plus Deno GitHub Actions results do not exist.

### Knowledge-base impact

Updated `SUMMARY.md`, `architecture/standards.md`, and `context/north-star.md` to describe Axios's repository-native validation policy and the remaining CI-only blocker. Updated the active plan's follow-up, progress, deviation, and final-outcome records.

### Validation

- Repository-native mode uses the previously recorded passing local evidence: scripts-disabled installs, formatting, source lint, production build, 1,062 unit tests, 615 headless browser tests, packed CJS/ESM module and smoke suites, package metadata, TypeScript 4.9 with Node 20 definitions, docs search, Bun smoke, and lockfile-lint on Node 24.18.0.
- Remote inspection found no `feat/node-20-runtime-baseline` branch and `gh pr list` returned no pull request, so no GitHub Actions evidence exists for Node 20/22/26 or Deno. Completion remains blocked on those native checks, not on E2E.

### Recovery notes

- **Reversal:** Revert this plan/KB documentation correction to restore the prior validation interpretation; no runtime implementation changed during this corrective audit.
- **Data or migration:** None. This correction changes documentation and completion policy only.
- **Feature flags or configuration:** None. The no-E2E directive selects validation evidence and does not alter Axios runtime behavior.

### Follow-ups

- Commit and push the implementation branch through the normal contributor workflow, obtain the required Node 20/22/24/26 and Deno checks, record their results in Plan 001, and rerun `complete-plan`.
- No `create-test-plan` or `docs/e2e/` artifact is required for Axios.

## 2026-08-20T08:53:54+02:00 — Stage the Axios v2 Node 20+ runtime baseline

- **Status:** Partial
- **Source change:** `84a9f3b9a4f3244b8c8e818f557d64c7b964fb25..4943cc2749393d55f0c8de28a5c57aca403aaeb7`, with a dirty worktree containing 19 modified tracked files and 2 untracked implementation/plan files.
- **Plan:** [Active Plan 001](../plans/001-node-20-runtime-baseline.md) — blocked and not archived
- **Affected areas:** Package/runtime metadata, Node build target, TypeScript fixtures, installed-package smoke coverage, pull-request and release-validation matrices, contributor guidance, pre-release records, and compatibility documentation.

### What changed

- Added an exact Node `>=20.0.0` engine contract to the packed package and Node-executed private packages, plus an installed-package smoke assertion.
- Retargeted the temporary Node CommonJS build and its TypeScript fixture to Node 20 while retaining TypeScript 4.9 and every current module/artifact format.
- Replaced pre-20 CommonJS workflow lanes with the same Node 20/22/24/26 matrix used for ESM, and staged the v2 breaking-change and migration documentation without changing release-owned public docs.
- The implementation remains uncommitted. Plan 001 is blocked because no matching validated Gherkin plan exists under `docs/e2e/` and remote Node 20/22/26 plus Deno results are unavailable.

### Knowledge-base impact

Updated `SUMMARY.md`, `architecture/tech-stack.md`, `architecture/standards.md`, `architecture/patterns.md`, and `context/north-star.md` to distinguish the implemented-but-uncommitted Node floor from the still-future ESM-only migration. This entry records a partial snapshot; it does not claim plan completion.

### Validation

- Local scripts-disabled installs, formatting, source lint, production build, 1,062 unit tests, 615 headless browser tests, packed CJS/ESM module and smoke suites, package metadata inspection, TypeScript 4.9 with Node 20 definitions, docs search, Bun smoke, and lockfile-lint passed on Node 24.18.0.
- GitHub Actions has not yet supplied Node 20/22/26 or Deno results, and no validated `docs/e2e/` test plan with manual evidence or waiver exists. Those are explicit completion blockers.

### Recovery notes

- **Reversal:** Before commit or publication, discard the 19 tracked source edits and 2 untracked implementation/plan files through an explicitly reviewed Git operation; this documentation does not perform that destructive action. After a commit but before v2 publication, revert the baseline commit(s).
- **Data or migration:** None. The change affects runtime compatibility metadata, build/test targets, and documentation; Axios owns no durable application data.
- **Feature flags or configuration:** No feature flag exists. Older-Node consumers remain on v1.x or upgrade Node; ESM-only removal has not occurred.

### Follow-ups

- Run `create-test-plan` for Plan 001 and validate its automated scenarios plus manual evidence or an explicit waiver.
- Commit/push the branch through the normal contributor workflow so GitHub Actions can provide Node 20/22/24/26 and Deno evidence, record those results in the active plan, then rerun `complete-plan`.
- Plan and approve ESM-only package-shape removal separately.

## 2026-08-19T18:43:28+02:00 — Initial knowledge-base baseline

- **Status:** Initial
- **Source change:** Documented the latest `v2.x` base at `84a9f3b9a4f3244b8c8e818f557d64c7b964fb25` on branch `docs/codebase-knowledge-base`; no runtime source changes are included.
- **Plan:** N/A — initial documentation baseline
- **Affected areas:** Public package/types, core request lifecycle, adapters/platforms, security boundaries, build/test/release processes, documentation, and product context.

### What changed

- Created a repository-wide agent knowledge base under `docs/codebase-knowledge-base/` without changing runtime source.
- Captured the callable-client architecture, config/interceptor/transform pipeline, capability-selected adapters, environment substitution, error/cancellation contracts, and package delivery model.
- Recorded core business logic and representative browser, Node, custom-runtime, authentication, upload, cancellation, retry, and operational use cases.
- Distinguished current v1-shaped package behavior from the stakeholder-supplied v2 direction of ESM-only and Node 20+ support.
- Catalogued important documentation/configuration drift instead of silently choosing one conflicting source.

### Knowledge-base impact

All required architecture and context pages now have evidence-backed content, explicit confidence, and actionable gaps. `SUMMARY.md` is the navigation and freshness entry point; architecture pages explain system design and contributor constraints; context pages describe value, runtime rules, use cases, and the limited available product direction.

### Validation

- Performed static, read-only discovery over repository instructions, manifests, public entries, representative core/adapters/helpers, tests, CI/release workflows, public docs, security policy, threat model, and recent history.
- Cross-checked independent architecture, runtime/domain, and product/security evidence ledgers.
- Final validation compared the recorded source snapshot, verified the required KB layout, metadata, local links, and placeholder removal, and checked the Markdown diff for whitespace errors.
- No runtime build or test suite was required because this change is documentation-only; the validation above covers the repository content introduced here.

### Recovery notes

- **Reversal:** Remove `docs/codebase-knowledge-base/` to revert the documentation baseline; no application/runtime source depends on it.
- **Data or migration:** None. The repository has no knowledge-base-backed runtime data or schema migration.
- **Feature flags or configuration:** None. The recorded freshness fields in `SUMMARY.md` are documentation metadata and have no runtime effect.

### Follow-ups

- Encode the v2 Node 20+/ESM-only decision in a repository roadmap or migration record before treating it as current package behavior.
- Reconcile stale contributor, threat-model, security, retry, release-gating, dependency-count, and documentation-domain statements listed in `SUMMARY.md`.
- Refresh this knowledge base and its recorded source metadata whenever source outside `docs/codebase-knowledge-base/` changes.
