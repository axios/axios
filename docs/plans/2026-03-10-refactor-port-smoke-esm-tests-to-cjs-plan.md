---
title: refactor: Port smoke ESM tests to CJS for Mocha 9 and Node 12
type: refactor
status: active
date: 2026-03-10
---

# refactor: Port smoke ESM tests to CJS for Mocha 9 and Node 12

## Overview

Port all smoke scenarios from `tests/smoke/esm/tests` into a CJS suite at `tests/smoke/cjs/tests`, executed with Mocha v9 and validated on Node v12. This work closes the current migration gap where the CJS smoke package advertises Mocha but still invokes Vitest.

## Problem Statement / Motivation

- `tests/smoke/cjs/package.json` currently defines `test:smoke:cjs:mocha` but runs a Vitest command.
- CJS smoke coverage is currently missing despite existing ESM scenario coverage.
- Existing CJS lockfile/dependency shape appears Vitest-oriented and risks Node 12 incompatibility.
- Axios ships both ESM and CJS usage patterns; smoke parity across module formats should be actively validated.

## Proposed Solution

- Create a one-to-one CJS smoke test suite under `tests/smoke/cjs/tests`.
- Port all scenario files from ESM smoke tests while preserving behavioral assertions and scenario intent.
- Standardize CJS smoke execution on Mocha v9 and remove Vitest coupling from the CJS smoke package.
- Define and enforce Node 12 compatibility for install + run in CI.
- Keep ESM smoke suite behavior unchanged while adding CJS parity coverage.

## Technical Considerations

- **Runner correctness**: Ensure CJS scripts execute Mocha v9 command paths only.
- **Node 12 support**: Dependencies and generated lockfile in `tests/smoke/cjs` must resolve under Node 12.
- **Module system conversion**: Replace ESM imports and Vitest-specific helpers with CJS/Mocha-compatible patterns.
- **Feature gating**: Runtime-sensitive scenarios (`fetch`, `formData`, `http2`) may need conditional skip logic for Node 12.
- **Deterministic tests**: Preserve local server/custom transport patterns and avoid environment-proxy coupling.

## System-Wide Impact

- **Interaction graph**: Affects smoke subpackages and CI workflow definitions only; core runtime source should not change.
- **Error propagation**: Failures should surface at the package test command level (`tests/smoke/cjs`) and as CI required checks.
- **State lifecycle risks**: No persistent data model changes; primary risk is flaky asynchronous test behavior.
- **API surface parity**: Expected outcome is identical smoke scenario coverage between ESM and CJS suites.
- **Integration test scenarios**: Include request lifecycle, cancellation, timeout, interceptor chains, headers, and encoding parity.

## Implementation Plan

### Phase 1 - CJS Smoke Harness Baseline

- Create `tests/smoke/cjs/tests/` directory and define target file map from `tests/smoke/esm/tests/*.smoke.test.js`.
- Update `tests/smoke/cjs/package.json` scripts to run Mocha v9 directly.
- Add/confirm Mocha config (CLI or config file) for file globs, timeout defaults, and require setup.
- Remove Vitest-specific coupling from CJS smoke package configuration.

### Phase 2 - Scenario Porting (ESM -> CJS)

- Port each smoke scenario file:
  - `auth`, `basic`, `cancel`, `error`, `fetch`, `files`, `formData`, `headers`, `http2`,
  - `instance`, `interceptors`, `progress`, `rateLimit`, `timeout`, `urlencode`.
- Convert module syntax and test APIs while preserving test semantics.
- Keep naming convention as `*.smoke.test.js` unless Mocha tooling requires explicit alternative.

### Phase 3 - Node 12 Compatibility Hardening

- Regenerate `tests/smoke/cjs/package-lock.json` under Node 12 runtime.
- Validate `npm ci` and test execution under Node 12.
- Add compatibility guards/skips for runtime features unavailable in Node 12 where needed.
- Document any intentional Node 12-specific deltas.

### Phase 4 - Verification and CI Enforcement

- Validate suite on modern Node and Node 12.
- Add/adjust CI job(s) to run CJS smoke suite on Node 12 as required status check.
- Ensure ESM smoke suite still runs independently and remains behaviorally unchanged.

## Acceptance Criteria

- [ ] `tests/smoke/cjs/tests` contains complete scenario parity with `tests/smoke/esm/tests`.
- [ ] CJS smoke package executes via Mocha v9 (no Vitest in CJS smoke run path).
- [ ] `npm ci && npm run test:smoke:cjs:mocha` passes on Node 12 for CJS smoke package.
- [ ] CJS lockfile is regenerated and installable on Node 12 without engine incompatibility failures.
- [ ] Runtime-sensitive scenarios have explicit conditional handling where Node 12 lacks capability.
- [ ] ESM smoke test behavior is unchanged by this migration.
- [ ] CI blocks merge when Node 12 CJS smoke tests fail.

## Success Metrics

- 100% expected CJS smoke scenario coverage relative to ESM smoke source set.
- Stable green Node 12 CJS smoke CI for initial rollout window (first 3-5 runs).
- No newly introduced flakes beyond agreed tolerance.

## Dependencies & Risks

- **Dependency risk**: Transitive packages with Node >=14/16/18 constraints may break Node 12 installs.
- **Flake risk**: Timeout/progress/http2 tests can be sensitive on older runtimes.
- **Parity drift risk**: Ports that pass but weaken assertions can create false confidence.
- **CI scope risk**: Without required checks, Node 12 compatibility may regress unnoticed.

## Test Strategy

- Define a scenario manifest and assert one-to-one coverage in CJS suite.
- Run CJS smoke on:
  - modern Node for contributor feedback,
  - Node 12 for compatibility gate.
- Validate negative paths for `cancel`, `error`, and `timeout` assertions explicitly.
- Track and remediate flakes by scenario class instead of broad global retries.

## Open Questions

- Confirm required Node baseline: `12.x` broadly vs pinned `12.22.x`.
- Confirm whether parity requirement is strict assertion parity or scenario-level parity with documented exceptions.
- Confirm whether CJS tests may share helper modules with ESM tests or must be self-contained.
- Confirm Node 12 smoke should run on every PR vs specific branch/event filters.

## References & Research

- Internal references:
  - `tests/smoke/esm/tests`
  - `tests/smoke/esm/package.json`
  - `tests/smoke/esm/vitest.config.js`
  - `tests/smoke/cjs/package.json`
  - `tests/smoke/cjs/package-lock.json`
  - `CONTRIBUTING.md`
  - `.github/workflows/run-ci.yml`
- Related work:
  - Migration context from historical `tests/compatability` paths and current `tests/smoke` movement.
