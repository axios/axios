# Plan 001: Establish Node.js 20+ as the Axios v2 runtime baseline

> Make every v2 package, build, test, and delivery contract require Node.js 20 or newer without prematurely removing the temporary CommonJS compatibility surface.

| Field           | Value                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plan number     | `001`                                                                                                                                                                                                  |
| Status          | Ready for completion audit                                                                                                                                                                             |
| Created         | 2026-08-20T08:31:37+02:00                                                                                                                                                                              |
| Last updated    | 2026-08-21T11:44:51+02:00                                                                                                                                                                              |
| Source revision | `79e8255671827fb5626287b9104b8b3cd2c133ad`                                                                                                                                                             |
| Scope           | `package.json`, package locks and Node-based private package manifests, `rollup.config.js`, `tests/module/`, `tests/smoke/`, `.github/workflows/`, contributor guidance, and pre-release documentation |
| Approval        | Approved for implementation by the maintainer on 2026-08-20                                                                                                                                            |

## 1. Objective

Establish Node.js `>=20.0.0` as the explicit runtime and contributor-tooling baseline for Axios v2. The published package metadata, generated Node bundle, type fixtures, installed-package tests, continuous-integration matrix, release validation, and staged migration documentation will agree on that floor. Axios v1.x will retain its existing legacy Node and module-format support on its maintenance branch, and the eventual removal of CommonJS and other non-ESM artifacts will remain a separately approved follow-up.

## 2. Success criteria

- [x] The packed Axios v2 package advertises `engines.node: ">=20.0.0"`, and an installed-package smoke test prevents that contract from being removed accidentally.
- [x] Every Node-based private package used to build, document, or test v2 declares the same Node 20+ floor, while Bun- and Deno-native fixtures remain runtime-appropriate.
- [x] The temporary Node CommonJS artifact is transpiled for Node 20, and the CommonJS type fixture uses Node 20 definitions without silently raising Axios's TypeScript 4.9 compatibility contract.
- [x] Pull-request and release-validation workflows contain no Axios test lane below Node 20 and exercise both temporarily supported module formats on Node 20 and the maintained newer majors.
- [x] A clean install, build, packed-package module/smoke suites, unit/browser suites, lockfile checks, and Bun/Deno smoke coverage pass with the new baseline.
- [x] Pre-release records and contributor guidance identify the Node 20+ floor as a v2 breaking change, direct older-Node consumers to v1.x, and stage the public migration documentation required before release.
- [x] This preparatory change does not remove or rename CommonJS, UMD, browser, declaration, or export artifacts; those format removals require the ESM-only follow-up plan.

## 3. Context and evidence

### Current state

The v2 branch still has the multi-format package shape inherited from v1: source is ESM, but Rollup emits browser ESM/UMD/CommonJS plus Node CommonJS, conditional exports serve both `import` and `require`, and separate ESM and CommonJS installed-package suites validate the tarball. Runtime support is inconsistent: ESM jobs run on Node 20, 22, 24, and 26, while CommonJS jobs run on Node 12, 14, 16, and 18. There is no root Node engine declaration, the Node bundle targets Node 12, the CommonJS type fixture uses Node 12 definitions, and public feature documentation claims tested compatibility back to Node 12.

The current worktree was clean before this plan was created. The knowledge base was generated from the v2 base revision and records the Node 20+/ESM-only direction; all plan-critical claims below were rechecked against current source at revision `79e8255671827fb5626287b9104b8b3cd2c133ad`.

### Evidence

- `package.json:5-63,102-117` — the package has no `engines` field and currently publishes conditional ESM/CommonJS entry points and both generated formats.
- `rollup.config.js:83-140` — Rollup emits ESM, UMD, browser CommonJS, and a Node CommonJS bundle explicitly transpiled for Node 12.
- `.github/workflows/run-ci.yml:cjs-smoke-tests,cjs-module-tests` — pull-request validation tests CommonJS on Node 12, 14, 16, and 18; the ESM equivalents already test Node 20 through 26.
- `.github/workflows/release-branch.yml:cjs-smoke-tests,cjs-module-tests` — release validation repeats the pre-20 CommonJS matrices even though its build and release jobs use Node 26.
- `tests/module/cjs/package.json` — the CommonJS declaration fixture pins TypeScript 4.9.5 and `@types/node` 12.20.55.
- `tests/module/esm/package.json` — the ESM declaration fixture already uses Node 20 definitions and TypeScript 5.9.3.
- `docs/pages/getting-started/features.md:Node.js support` and translations — public documentation currently promises tested Node 12 compatibility.
- `AGENTS.md:Pre-Release Notes` — breaking unreleased changes belong in `PRE_RELEASE_CHANGELOG.md`, while README, migration-guide, docs-site, and translation work must be staged in `PRE_RELEASE_DOCS.md` until release preparation.
- Maintainer direction supplied on 2026-08-20 — v2 may require Node 20+ and become ESM-only, while v1.x keeps legacy Node and non-ESM support; this task is the Node-baseline preparation for that later format migration.

### Motivation

The current package makes four different places tell conflicting compatibility stories. Raising the v2 floor first creates one enforceable baseline for package consumers and contributors, removes obsolete runtime lanes and transpilation targets, and gives the later ESM-only migration a smaller, well-tested starting point. Keeping the module-format removal separate limits regression scope and preserves a clear rollback boundary for each breaking change.

## 4. Scope

### In scope

- Declare `>=20.0.0` in the published root manifest and synchronize its lockfile metadata.
- Apply the same floor to Node-executed private docs, module-test, and smoke-test packages and synchronize only their affected lockfiles.
- Add packed-package coverage for the published Node engine contract.
- Retarget the temporary Node CommonJS build from Node 12 to Node 20.
- Move the CommonJS type fixture from Node 12 definitions to a Node 20 definitions release compatible with TypeScript 4.9.
- Replace pre-20 Node matrices in pull-request and release-validation workflows with Node 20, 22, 24, and 26 while leaving existing supported cross-runtime jobs intact.
- Update canonical contributor guidance and staged pre-release change/migration notes for the v2 breaking change.
- Audit project-owned compatibility claims and configuration so no active v2 contract promises or tests Node below 20.

### Out of scope

- Removing CommonJS or UMD builds, `require` export conditions, `index.d.cts`, CommonJS tests/examples, or browser CommonJS artifacts; that is the subsequent ESM-only migration.
- Removing legacy source branches, fallbacks, or polyfills solely because older Node versions no longer need them unless a separate evidence-backed change demonstrates they are Node-only and safe to delete.
- Changing browser, Bun, Deno, or React Native support policy beyond verifying that the Node engine metadata does not break their current smoke paths.
- Updating dependency or GitHub Action versions other than the necessary Node type-definition fixture; unrelated package/action churn remains subject to the repository's maintainer and delay policy.
- Repointing v1 release branches, tag filters, publish workflows, bundle-size release streams, or documentation links to v2; v2 release automation needs its own coordinated plan.
- Editing the v1.x branch or dropping any of its current Node/CommonJS guarantees.
- Applying README, docs-site, migration-guide, example, or translated-document changes before explicit v2 release preparation; this plan stages those changes in `PRE_RELEASE_DOCS.md` as repository policy requires.

### Constraints

- This is a breaking compatibility change and must land only on v2.x after maintainer approval; it must not be backported to v1.x.
- `engines.node` communicates the supported runtime range but is advisory in some package managers; repository CI and installed-package tests remain the enforcement and regression controls.
- The exact range must include all future Node majors (`>=20.0.0`), not restrict consumers to Node 20 alone.
- Root `.npmrc` must retain `ignore-scripts=true`; all lockfile regeneration and installs use scripts-disabled commands and must avoid unrelated dependency churn.
- No new runtime dependency is permitted. The `@types/node` change is test-only, pinned, lockfile-reviewed, and must retain npm HTTPS/integrity guarantees.
- Generated `dist/` files are never edited by hand; verification regenerates them through `npm run build`.
- The current dual-format public API and paired ESM/CommonJS declarations remain synchronized until the separately approved ESM-only removal.

## 5. Assumptions and unknowns

| Item                                                                                                                  | Classification | Impact if incorrect                                                                                                       | Resolution                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The Node-floor migration should precede, rather than include, removal of non-ESM outputs.                             | Assumption     | Combining them would expand package exports, declarations, build, tests, documentation, and recovery scope substantially. | Treat approval of this plan as confirmation; otherwise supersede it with one coordinated Node/ESM migration plan before implementation.                                                                                      |
| The canonical published range is `>=20.0.0`, including Node 20 and every newer major.                                 | Assumption     | A narrower range could incorrectly reject supported newer runtimes; a looser spelling could make the minimum ambiguous.   | Confirm through plan approval and assert the exact value in the packed-package test.                                                                                                                                         |
| A Node 20 `@types/node` release can compile the existing CommonJS fixture under TypeScript 4.9.5.                     | Unknown        | An incompatible definitions release could create an unrequested TypeScript minimum-version increase.                      | Test a pinned Node 20 definitions release with the existing fixture; select a compatible Node 20 patch if needed. Escalate any TypeScript floor increase as a separate approval decision rather than hiding it in this work. |
| The current Node 20, 22, 24, and 26 matrix remains the intended set of supported majors at implementation time.       | Assumption     | A changed active-major policy could leave CI testing an obsolete or incomplete set.                                       | Recheck the v2 workflows and maintainer-supported major list immediately before implementation; preserve Node 20 as the mandatory minimum even if newer lanes change.                                                        |
| Exact v2 tag, release-branch, and documentation deployment mechanics are not required to establish the runtime floor. | Unknown        | The Node change can merge safely, but a v2 release could still use v1-specific automation or publish stale documentation. | Record this as an approval-gated follow-up and resolve it before v2 release preparation or publication.                                                                                                                      |

## 6. Proposed approach

Treat Node 20+ as one compatibility contract propagated outward from the packed package. The root manifest is the consumer-facing source of truth; a smoke test verifies that the built tarball retains it. Build and type fixtures then align with the minimum, and both CI workflows validate every temporarily shipped module format across the same modern Node matrix. Contributor guidance and pre-release records make the branch and migration boundaries explicit without prematurely rewriting release-owned public documentation.

This staged approach deliberately retains CommonJS while changing its runtime target to Node 20. That proves the Node-floor change independently, leaves v1.x untouched, and allows the later ESM-only plan to remove format-specific exports, artifacts, types, tests, docs, and automation as a coherent second change.

### Key decisions

| Decision                               | Choice                                                                                               | Rationale                                                                                                                                                                       | Alternatives considered                                                                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime range                          | Publish `engines.node: ">=20.0.0"`.                                                                  | It exactly expresses “no Node below 20” while admitting later majors.                                                                                                           | `^20` or `20.x` would wrongly exclude newer Node; omitting `engines` would leave the contract implicit.                                      |
| Migration sequencing                   | Raise the Node floor first and retain current module formats temporarily.                            | It isolates two breaking changes, keeps verification attributable, and provides a smaller rollback unit.                                                                        | Removing CommonJS simultaneously would be faster in one PR but would couple unrelated failures and recovery.                                 |
| CommonJS CI coverage during transition | Run the same Node 20/22/24/26 matrix as ESM.                                                         | CommonJS remains shipped until the next migration and therefore needs coverage throughout the supported Node range; replacing the four old lanes does not increase matrix size. | Testing CommonJS only on Node 20 would reduce CI work but leave supported newer-major format regressions undetected.                         |
| TypeScript fixture policy              | Keep TypeScript 4.9.5 and replace only Node 12 definitions with a compatible pinned Node 20 release. | The Node runtime floor does not itself authorize a TypeScript compatibility break.                                                                                              | Upgrading TypeScript alongside Node would conflate two consumer contracts.                                                                   |
| Private package engines                | Add the Node floor to docs and Node-native test packages, but not the Bun-native package.            | Direct installs in subdirectories should report the same contributor baseline without mislabeling non-Node fixtures.                                                            | Root-only metadata would leave local fixture/docs installs ambiguous; putting a Node engine on Bun would express the wrong runtime contract. |
| Public documentation timing            | Stage detailed targets in `PRE_RELEASE_DOCS.md`; apply them during v2 release preparation.           | This follows the repository's explicit pre-release documentation policy while preventing release without a migration guide.                                                     | Editing README/docs immediately would make unreleased v2 behavior appear to be the current v1 contract.                                      |

## 7. Work plan

| Step | Outcome                                                                              | Dependencies | Parallelism                              | Status      |
| ---- | ------------------------------------------------------------------------------------ | ------------ | ---------------------------------------- | ----------- |
| 1    | Published and private package metadata consistently declares Node 20+                | None         | Can run with steps 3–4                   | Complete    |
| 2    | Build and type compatibility surfaces target Node 20 without changing module formats | Step 1       | Can run alongside steps 3–4 after step 1 | Complete    |
| 3    | Pull-request and release validation use only the supported Node matrix               | None         | Can run with steps 1, 2, and 4           | Complete    |
| 4    | Contributor and release-staging documentation records the breaking boundary          | None         | Can run with steps 1–3                   | Complete    |
| 5    | The packed v2 artifact and every affected compatibility path are verified            | Steps 1–4    | Sequential                               | In progress |

### Step 1 — Publish one Node 20+ package contract

**Goal:** Make Node 20+ visible and regression-tested wherever Node-based v2 packages are installed.

**Changes:**

- Add `engines.node: ">=20.0.0"` to the published root manifest and synchronize the root lockfile's package metadata without changing dependency resolutions.
- Add the same engine constraint to `docs/package.json` and the Node-based ESM/CommonJS module and smoke fixture manifests; update their lockfile root metadata with scripts disabled.
- Leave `tests/smoke/bun/package.json` without a Node engine because it is a Bun-native fixture, and retain the Deno-native setup.
- Add an ESM installed-package smoke assertion that imports the packed Axios package metadata through its public `./package.json` export and checks the exact Node range.

**Likely areas:**

- `package.json`
- `package-lock.json`
- `docs/package.json`
- `docs/package-lock.json`
- `tests/module/cjs/package.json`
- `tests/module/cjs/package-lock.json`
- `tests/module/esm/package.json`
- `tests/module/esm/package-lock.json`
- `tests/smoke/cjs/package.json`
- `tests/smoke/cjs/package-lock.json`
- `tests/smoke/esm/package.json`
- `tests/smoke/esm/package-lock.json`
- `tests/smoke/esm/tests/` (new package-metadata smoke case)

**Validation:**

- Parse each changed manifest and its lockfile root entry and confirm the exact `>=20.0.0` value with no unrelated dependency-resolution diff.
- Install each affected private package with its lockfile and lifecycle scripts disabled; every install succeeds on a supported Node runtime.
- Run the new assertion against the installed packed tarball; it reads `axios/package.json` and observes `engines.node` as `>=20.0.0`.

**Exit criteria:**

- The published artifact and every Node-executed private package state one consistent floor, and the packed-package suite fails if that root contract disappears or changes unexpectedly.

### Step 2 — Align build and type fixtures with the minimum runtime

**Goal:** Stop producing or type-checking v2 artifacts against Node releases below the supported floor while retaining temporary CommonJS behavior.

**Changes:**

- Change the Node CommonJS Babel target and its explanatory comment from Node 12 to Node 20; do not alter Rollup output paths, formats, externalization, or export behavior.
- Replace `@types/node` 12.20.55 in the CommonJS module fixture with a pinned Node 20 release that compiles under TypeScript 4.9.5.
- Regenerate only the CommonJS fixture lockfile entries required by that definitions change, using scripts-disabled npm commands and reviewing registry hosts/integrity metadata.
- Preserve TypeScript 4.9.5, `index.d.cts`, all CommonJS tests, and all current generated format definitions until the ESM-only follow-up.

**Likely areas:**

- `rollup.config.js`
- `tests/module/cjs/package.json`
- `tests/module/cjs/package-lock.json`

**Validation:**

- `npm run build` completes and still emits the existing Node CommonJS path along with all other current artifacts.
- The CommonJS module fixture compiles and executes its existing `require("axios")`, `require("axios").default`, and declaration cases using TypeScript 4.9.5 plus Node 20 definitions.
- The dependency diff contains only the intended test-definition and lock metadata changes and continues to use npm HTTPS URLs with integrity hashes.

**Exit criteria:**

- No build/type fixture targets Node below 20, the temporary CommonJS artifact remains loadable, and the TypeScript minimum has not changed.

### Step 3 — Make Actions validate only supported Node releases

**Goal:** Ensure pull-request and release gates represent the v2 Node 20+ contract consistently.

**Changes:**

- Replace the Node 12/14/16/18 CommonJS smoke and module matrices in the continuous-integration workflow with Node 20/22/24/26.
- Apply the same matrix change to the release-branch validation workflow so its pre-release artifact tests match pull-request CI.
- Retain the ESM 20/22/24/26 matrices, Node 26 build/publish tooling jobs, Bun/Deno jobs, action SHA pins, scripts-disabled installs, and artifact handoff structure.
- Audit all checked-in `actions/setup-node` inputs and other project-controlled runtime selectors; change only selectors below Node 20 and leave already-compliant versions alone.
- Do not repoint the workflow's v1-specific release branch/tag behavior in this change.

**Likely areas:**

- `.github/workflows/run-ci.yml`
- `.github/workflows/release-branch.yml`
- `.github/workflows/` (read-only audit of the remaining workflows)

**Validation:**

- Format-check the changed YAML and inspect every resulting Node matrix and fixed `setup-node` value.
- GitHub pull-request checks fan out CommonJS and ESM module/smoke jobs for Node 20, 22, 24, and 26 with no pre-20 job.
- A dry-run or maintainer-dispatched release-validation workflow, when appropriate, uses the same supported matrix before any release PR creation.

**Exit criteria:**

- No v2 workflow advertises or exercises Axios support on Node below 20, and both still-shipped module formats pass on every configured supported Node major.

### Step 4 — Record the breaking boundary and ESM-only handoff

**Goal:** Make the compatibility decision durable for contributors and release preparation without publishing unreleased v2 guidance as current v1 documentation.

**Changes:**

- Add a breaking-change entry to `PRE_RELEASE_CHANGELOG.md` stating that Axios v2 requires Node 20+ and that Node 12–18 consumers should remain on v1.x or upgrade Node.
- Add a structured `PRE_RELEASE_DOCS.md` entry covering the v2 upgrade guide, README support statement, Node feature page and translations, old-Node/querystring examples, version-specific Node API notes, and the relationship to the later ESM-only migration.
- Update `AGENTS.md` to require Node 20+ for v2 contribution/testing and describe the modern matrices and Node 20 type baseline while CommonJS remains transitional.
- Mirror the load-bearing Node baseline in `.github/copilot-instructions.md` so the canonical and Copilot-facing contributor rules remain aligned.
- Audit active project-owned documentation/configuration for statements that promise pre-20 support; distinguish obsolete support promises from legitimate historical API notes and source comments.

**Likely areas:**

- `PRE_RELEASE_CHANGELOG.md`
- `PRE_RELEASE_DOCS.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `README.md` and `docs/**` (audit now; edits deferred to release preparation)

**Validation:**

- Review the staged notes against the pre-release entry format and confirm they identify stable document sections, required migration wording, v1 fallback, translations, and release timing.
- Search project-owned manifests, workflows, build configuration, contributor guides, and active compatibility documentation for pre-20 support claims; every remaining older-version mention is historical, implementation-specific, or explicitly scoped to v1.x.
- Confirm README and docs-site files have not been prematurely edited in this implementation PR.

**Exit criteria:**

- Contributors see the correct v2 runtime rule, release maintainers have a complete public-doc checklist, and no active v2 guidance promises support below Node 20.

### Step 5 — Verify the distributable compatibility boundary

**Goal:** Demonstrate that the Node floor change is complete at source, generated-artifact, installed-package, and cross-runtime boundaries.

**Changes:**

- Resolve only defects exposed by the agreed validation; do not absorb ESM-only removal, unrelated dependency upgrades, or release-automation redesign.
- Record all commands and CI results in this plan's execution notes during implementation.

**Likely areas:**

- Root build and Vitest projects
- Packed package installed into `tests/module/cjs`, `tests/module/esm`, `tests/smoke/cjs`, and `tests/smoke/esm`
- `.github/workflows/run-ci.yml` job results
- Bun and Deno smoke fixtures

**Validation:**

- Run a clean root install with scripts disabled, source lint, the production build, unit tests, and headless browser tests.
- Pack Axios, inspect the tarball manifest, install that exact tarball into every CJS/ESM module and smoke fixture, and run each fixture suite rather than resolving the source tree.
- Run root and affected fixture lockfile installs plus the repository lockfile-lint policy; verify no unexpected package/action update entered the diff.
- Require green Node 20/22/24/26 package jobs and green Bun/Deno smoke jobs in pull-request CI.
- Repeat the project-owned pre-20 selector/support-claim audit after all changes.

**Exit criteria:**

- All success criteria have recorded evidence, the complete supported matrix is green, and the diff contains only the approved Node-baseline preparation.

## 8. Verification strategy

| Success criterion                                                    | Verification                                                                                                                        | Expected evidence                                                                                             |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Packed package advertises and tests `>=20.0.0`                       | Build and pack Axios, inspect `package/package.json`, then run the new ESM installed-package smoke case                             | Tarball manifest and runtime assertion both report the exact range                                            |
| Node-based private packages use the same floor                       | Parse manifests/lockfile roots and run scripts-disabled locked installs in root, docs, module, and Node smoke packages              | Every Node-native package reports `>=20.0.0`; Bun/Deno fixtures remain unchanged and pass                     |
| Build and CJS typing target Node 20 while TS 4.9 remains             | Run the production build and packed CommonJS module suite                                                                           | Existing outputs are generated; TypeScript 4.9.5 compiles Node 20 definitions and all require cases execute   |
| Workflows contain no pre-20 support lane and cover maintained majors | Inspect formatted workflow YAML and require all matrix checks in pull-request CI                                                    | CJS and ESM jobs run only on 20/22/24/26 and are green                                                        |
| Clean build and all compatibility suites pass                        | Run root lint/unit/browser/build/pack flow, all installed CJS/ESM module/smoke suites, lockfile validation, and Bun/Deno smoke jobs | Local/CI command records show no failure and test the tarball rather than source shortcuts                    |
| Breaking change and migration are staged accurately                  | Review contributor files, changelog entry, documentation note, and compatibility-claim search                                       | v2 Node floor and v1 fallback are explicit; release targets are complete; no active v2 pre-20 promise remains |
| No format removal is bundled into this change                        | Compare package exports/files, Rollup output list, declaration files, scripts, and smoke/module fixtures before and after           | All current ESM, UMD, browser CJS, Node CJS, and declaration surfaces remain present                          |

### Regression coverage

- CommonJS `require("axios")`, `require("axios").default`, and TypeScript declaration paths continue working on every supported Node lane until the ESM-only change lands.
- ESM imports and Node HTTP behavior continue working from the installed tarball on Node 20 and newer configured majors.
- Browser ESM, browser CommonJS, and UMD artifacts still build, and browser Vitest coverage remains green.
- Bun and Deno smoke paths continue to consume the package despite the Node engine declaration.
- Lockfiles retain scripts-disabled, HTTPS/integrity-valid dependency provenance without unrelated version churn.
- v1.x is not modified or backported and remains the documented fallback for consumers unable to use Node 20+.

## 9. Risks and mitigations

| Risk                                                                                      | Likelihood | Impact | Mitigation or detection                                                                                                                                                     |
| ----------------------------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The Node floor is added to v1.x accidentally                                              | Low        | High   | Implement and review only against v2.x; name the breaking change explicitly and prohibit backporting in delivery notes.                                                     |
| `engines.node` is treated as hard enforcement even though some package managers only warn | Medium     | Medium | Describe it as the support contract, assert it in the packed package, and use CI matrices as the behavioral enforcement; do not claim all package managers reject old Node. |
| Updating Node definitions implicitly breaks TypeScript 4.9                                | Medium     | High   | Pin and compile-test a compatible Node 20 definitions release; require separate approval for any TypeScript floor increase.                                                 |
| Retargeting Babel changes the temporary CommonJS output unexpectedly                      | Low        | Medium | Preserve Rollup format/externalization settings and run the full packed CommonJS module/smoke suite across the supported matrix.                                            |
| Adding a Node engine affects Bun or Deno package consumption                              | Medium     | Medium | Keep their native fixture manifests unchanged and require both cross-runtime smoke jobs before merge.                                                                       |
| Public docs still mention Node 12 between merge and release preparation                   | High       | Medium | Stage every target in `PRE_RELEASE_DOCS.md`, label the source change as unreleased v2 work, and block v2 release until release documentation is applied.                    |
| A broad lockfile refresh introduces unrelated dependency/action changes                   | Medium     | High   | Use package-local, scripts-disabled lockfile updates; inspect diffs; run lockfile validation; reject unrelated churn.                                                       |
| Combining this work with ESM-only cleanup obscures failures and recovery                  | Medium     | High   | Enforce the explicit non-goal and create a separate approved plan for exports, artifacts, declarations, tests, docs, and release automation removal.                        |

## 10. Delivery and recovery

- **Delivery sequence:** Approve this breaking contract; implement it on a fresh branch from the latest v2.x; obtain green packed-package and full CI evidence; merge only to v2.x; then create and approve the ESM-only migration plan; apply staged public documentation and v2 release automation during release preparation before publishing v2.
- **Compatibility:** v2 accepts Node 20 and newer. Node 12–18 consumers remain on the maintained v1.x line or upgrade their runtime. CommonJS remains temporarily available on Node 20+ in this step; browser, Bun, Deno, and React Native contracts change only if separately approved.
- **Migration or backfill:** There is no data migration. Consumers must update their Node runtime or pin Axios v1.x. Maintainers must apply the staged README/docs/upgrade-guide/translation changes before v2 release.
- **Observability:** The packed manifest assertion, Node 20/22/24/26 CJS/ESM matrices, build/package checks, and Bun/Deno smoke jobs are the compatibility signals. Release review checks the pre-release changelog/docs entries and final package metadata.
- **Rollback/recovery:** Before v2 publication, revert the Node-baseline commit(s) to restore the prior manifest, build target, fixtures, workflows, and staged notes. After v2 publication, older-Node users recover by remaining on v1.x; any decision to broaden v2 support again requires a tested follow-up release rather than weakening metadata without restoring CI coverage.
- **Approval gates:** Maintainer approval is required for the Node 20 breaking floor and v2-only branch targeting. A TypeScript minimum increase, ESM/CommonJS artifact removal, v2 release-workflow redesign, public docs deployment, tag creation, and npm publication each require separate approval or their dedicated project process.

## 11. Documentation and follow-ups

- Add the v2 Node 20+ breaking change to `PRE_RELEASE_CHANGELOG.md` during implementation.
- Add a `PRE_RELEASE_DOCS.md` entry that names the README Node support and older-Node examples, `docs/pages/getting-started/features.md`, the v2 upgrade guide, relevant request-config/form/file-posting notes, and Spanish/French/Chinese translations; apply it only during release preparation.
- Update `AGENTS.md` and `.github/copilot-instructions.md` together so Node 20+ is a load-bearing contributor rule for v2.
- Create the next approved implementation plan for the ESM-only package shape: remove `require` export conditions, CommonJS/UMD artifacts as decided, `index.d.cts`, CJS fixtures/scripts, CommonJS examples, and related bundle/release checks as one coordinated migration.
- Create a separate v2 release-automation plan covering branch targets, tag filters, publish workflow, bundle-size stream, changelog generation, documentation version links, and release gates; include the existing release workflow's missing module-test dependencies in that review rather than silently fixing it here.
- After implementation, use `complete-plan` in repository-native validation mode. Per the maintainer's repository-wide directive on 2026-08-20, Axios does not use E2E test plans; completion instead requires the native automated, package, compatibility, cross-runtime, and CI evidence specified above.

## 12. Execution notes

### Progress

- 2026-08-20T08:39:53+02:00 — Created `feat/node-20-runtime-baseline` from the latest `origin/v2.x` revision `4943cc2749393d55f0c8de28a5c57aca403aaeb7` and carried this plan onto the branch.
- 2026-08-20T08:39:53+02:00 — Applied the Node 20+ manifest, build target, test fixture, workflow matrix, contributor guidance, and pre-release documentation changes; validation and lockfile synchronization remain in progress.
- 2026-08-20T08:49:47+02:00 — Synchronized all six affected lockfiles with scripts disabled. The only dependency graph change is the pinned CommonJS fixture update from `@types/node` 12.20.55 to 20.19.39 plus `undici-types` 6.21.0; root lockfile-lint reported no issues.
- 2026-08-20T08:49:47+02:00 — Verified formatting, source lint, the production build, 1,062 unit tests, 615 headless browser tests, four packed-package CJS/ESM suites, the exact packed `engines.node` metadata, TypeScript 4.9.5 with Node 20 definitions, four docs search tests, and 22 Bun smoke tests.
- 2026-08-20T08:49:47+02:00 — Local Node is 24.18.0 and Deno is unavailable. Node 20/22/26 matrix execution and Deno smoke validation remain pending in GitHub Actions; no result is claimed for those environments.
- 2026-08-20T08:53:36+02:00 — `complete-plan` audited revision `4943cc2749393d55f0c8de28a5c57aca403aaeb7` on `feat/node-20-runtime-baseline` with a dirty worktree containing 19 modified tracked files and 2 untracked implementation/plan files. Completion is blocked because no matching validated Gherkin test plan exists under `docs/e2e/`, and the required Node 20/22/26 plus Deno GitHub Actions evidence remains unavailable. Step 5 and the two unchecked success criteria remain open; the plan was not archived.
- 2026-08-20T11:06:37+02:00 — The maintainer supplied the repository-wide directive, “in this repo we will never have e2e tests.” `complete-plan` therefore selected repository-native validation mode and superseded the earlier Gherkin-artifact blocker. No manual validation is required by this plan; the recorded unit, browser, module, packed-package smoke, metadata, documentation, Bun, and lockfile evidence is the applicable native acceptance evidence.
- 2026-08-20T11:06:37+02:00 — Remote inspection found no `feat/node-20-runtime-baseline` branch and no pull request on GitHub. Consequently there are no Node 20/22/26 or Deno check results, so step 5 and the two unchecked success criteria remain blocked. Revision `4943cc2749393d55f0c8de28a5c57aca403aaeb7` and the dirty source state are unchanged; the plan was not archived.
- 2026-08-21T11:24:33+02:00 — Opened PR #11161 at `fd443c050e88a5445fb55155712d1dc8cc4f2e47`. Its initial CI passed build, lockfile, reproducibility, bundle, Bun/Deno, every ESM module/smoke lane, every CJS smoke lane, and CJS module lanes on Node 20, 22, and 24. The Node 26 CJS module job failed before tests because Mocha 9.2.2 loads the `yargs` 16 CommonJS bridge as ESM under Node 26 (`ReferenceError: require is not defined`).
- 2026-08-21T11:32:18+02:00 — Updated the isolated CJS module fixture to the already-used Mocha 11.8.0 baseline and removed its pre-Node-20 `fs.rmdirSync({recursive: true})` fallback, which Node 26 no longer supports. All six tests pass against the packed Axios artifact on Node 20.20.2, 24.18.0, and 26.7.0; the Node 26 CJS smoke suite passes all 71 tests, including paired engine-metadata coverage. The fixture lockfile passes HTTPS, npm-registry-host, and integrity validation. Corrected four KB review findings. The remote rerun remains the only completion evidence still pending.
- 2026-08-21T11:44:51+02:00 — Corrected-fixture CI run `32468769721` passed CJS module jobs on Node 20, 22, 24, and 26, including Node 22 job `96731529782` and the previously failing Node 26 job `96731529797`. The same run passed every ESM/CJS smoke and module lane, build, lint, unit/browser, dependency review, Bun, and Deno job; the accompanying lockfile, reproducibility, bundle-size, workflow-security, and package-security checks also passed. Both remaining success criteria are satisfied.

### Deviations

- Acceptance close-out uses repository-native validation rather than the originally planned `create-test-plan` Gherkin artifact. This follows the maintainer's repository-wide no-E2E policy and does not waive any native automated, package, compatibility, cross-runtime, or CI requirement.
- The CJS module fixture's Mocha version moved from 9.2.2 to 11.8.0 after Node 26 exposed an incompatibility in Mocha's transitive `yargs` runner. This test-only dependency change is required to execute the approved Node matrix and does not affect Axios runtime dependencies or its TypeScript 4.9 compatibility floor.
- The fixture cleanup helper now uses the Node 20+ `fs.rmSync` API directly. Its obsolete recursive `fs.rmdirSync` fallback and the test that simulated a pre-Node-14 runtime were removed after Node 26 dropped that legacy option.
- Review added a CommonJS counterpart to the planned ESM package-metadata assertion. The published engine contract is shared, but paired coverage keeps the retained ESM/CJS installed-package suites aligned during the transition.

### Final outcome

Implementation and repository-native acceptance evidence are complete on PR #11161. Corrected-fixture CI is green across Node 20/22/24/26 plus Bun and Deno, and no E2E artifact is required. The plan remains active and unarchived until the completion audit records this final evidence and performs its normal close-out.
