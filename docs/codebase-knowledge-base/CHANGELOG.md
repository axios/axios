# Codebase change log

> Newest entries appear first. This log records durable source and knowledge-base outcomes plus honest recovery context; it is not a raw commit log.

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
- Planned final validation: source-drift comparison, `kb.py stamp`, `kb.py validate`, `kb.py status`, placeholder scan, and `git diff --check`.
- No runtime build or test suite was required because this change is documentation-only and the knowledge-base validator is the relevant executable check.

### Recovery notes

- **Reversal:** Remove `docs/codebase-knowledge-base/` to revert the documentation baseline; no application/runtime source depends on it.
- **Data or migration:** None. The repository has no knowledge-base-backed runtime data or schema migration.
- **Feature flags or configuration:** None. Freshness metadata is managed only by the document-codebase `kb.py` utility.

### Follow-ups

- Encode the v2 Node 20+/ESM-only decision in a repository roadmap or migration record before treating it as current package behavior.
- Reconcile stale contributor, threat-model, security, retry, release-gating, dependency-count, and documentation-domain statements listed in `SUMMARY.md`.
- Refresh and restamp this knowledge base whenever source outside `docs/codebase-knowledge-base/` changes.
