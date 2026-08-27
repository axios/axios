# Plan 002: Migrate Axios v2 builds to Rolldown while preserving modern UMD

> Replace the Rollup/Babel release pipeline with standalone Rolldown, keep every current package artifact and UMD loading contract, and make ES2018—not ES5—the explicit v2 browser syntax floor.

| Field           | Value                                                                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plan number     | `002`                                                                                                                                                                                            |
| Status          | In progress                                                                                                                                                                                      |
| Created         | 2026-08-22T18:40:30+02:00                                                                                                                                                                        |
| Last updated    | 2026-08-22T19:27:36+02:00                                                                                                                                                                        |
| Source revision | `9e51e031b453d7b766eaa9410b8b338f811e2cbf`                                                                                                                                                       |
| Scope           | `package.json`, `package-lock.json`, the release bundler configuration, generated-artifact contract tests, build-related workflows, contributor/security guidance, and pre-release documentation |
| Approval        | Approved for implementation by the maintainer on 2026-08-22                                                                                                                                      |

## 1. Objective

Build Axios v2's published browser ESM, browser UMD, browser CommonJS, and Node CommonJS artifacts with standalone Rolldown while preserving their existing filenames, package mappings, runtime API, and minified source-map coverage. Keep `dist/axios.js` and `dist/axios.min.js` as classic-script/AMD-compatible UMD bundles that expose the `axios` global, but stop transpiling them to ES5 and instead enforce the repository's existing ES2018 source baseline across browser bundles.

This migration will remove build-only Rollup, Babel, Terser, and compatibility plugins that Rolldown can replace natively. Vite will remain where it already serves the docs and test toolchains, but will not wrap the multi-platform package build. The temporary CommonJS package surfaces remain unchanged; their eventual removal requires a separate approval and migration plan.

## 2. Success criteria

- [x] A scripts-disabled clean install followed by `npm run build` uses standalone Rolldown and emits the same six JavaScript bundles and two minified source maps at the package's current paths.
- [x] `dist/axios.js` and `dist/axios.min.js` remain valid UMD: a classic browser script exposes `globalThis.axios`, and an AMD/RequireJS loader receives the default Axios instance without changing the `jsdelivr` or `unpkg` fields.
- [x] Every generated browser artifact parses at an explicit ES2018 ceiling, with no promise of ES5 syntax or missing-runtime polyfills, and Babel is no longer part of the Axios release build.
- [x] Browser ESM, browser CommonJS, Node CommonJS, and root package imports retain their current default/named export behavior, platform selection, dependency externalization, banners, and public runtime behavior.
- [x] The root manifest and lockfile contain one reviewed direct Rolldown build dependency, no obsolete Rollup/Babel/Terser/Gulp build dependencies, no runtime-dependency changes, and valid npm HTTPS/integrity metadata.
- [ ] Existing unit, headless browser, packed ESM/CJS module and smoke, Bun, and Deno suites pass; dedicated generated-artifact tests detect UMD, syntax-target, export-shape, platform, filename, and source-map regressions.
- [x] Bundle-size comparison and two-pass reproducibility evidence are recorded and reviewed, with no unexplained or unapproved regression caused by the bundler/minifier change.
- [x] Contributor, threat-model, and pre-release records accurately describe Rolldown, its narrower build-time Node engine, the retained modern UMD surface, the ES5 compatibility break, and v1.x as the fallback for legacy consumers.

## 3. Context and evidence

### Current state

Axios source is ESM, and the v2 branch currently uses `gulp clear && rollup -c` to generate six distributable JavaScript bundles: minified and unminified browser ESM, minified and unminified browser UMD, browser CommonJS, and Node CommonJS. Only the UMD pair is lowered to ES5. The Node CommonJS output also runs through Babel with a Node 20 target, even though the source tree is already held to ES2018 syntax.

The UMD files are not incidental legacy aliases. Both CDN metadata fields point to `dist/axios.min.js`, the README documents classic `<script>` loading, repository examples consume the global, and the AMD example loads the same file through RequireJS. A jsDelivr rolling-statistics snapshot reviewed on 2026-08-22 also showed that the minified UMD path dominates downloads for several current and historical Axios versions. The exact traffic mix is volatile and cannot identify pinned versus unpinned URLs, but it makes unannounced path or loader-shape removal too risky for this migration.

Rolldown 1.x provides parallel configuration arrays, ESM/CJS/UMD outputs, browser/Node platform presets, JavaScript lowering, module resolution/interoperability, and minification. Vite 8 uses Rolldown underneath, but Vite's own guidance describes library mode as browser-oriented and recommends direct Rolldown for advanced or non-browser build flows. Axios's mixed browser/Node output matrix and selective Node externalization fit the direct API more closely.

The worktree was clean when planning began. The branch `plan/rolldown-modern-umd` was created directly from refreshed `origin/v2.x` at the recorded source revision. The existing codebase knowledge base is fresh enough for orientation but predates this decision; all plan-critical build claims were rechecked against current source.

### Evidence

- `package.json:scripts.build` — the production build clears `dist/` and invokes the Rollup CLI.
- `package.json:jsdelivr,unpkg,files,exports,browser` — CDN defaults, published filenames, conditional entry points, and browser replacements form consumer-facing package contracts.
- `rollup.config.js:buildConfig,default export` — the current inputs, formats, banners, minification, source maps, browser resolution, ES5-only UMD transform, and selective Node externalization are defined in one six-bundle configuration matrix.
- `tests/unit/syntaxCompat.test.js` — all `lib/**/*.js` source is already required to parse as ES2018.
- `README.md:Browser support,Installing/CDN` — the formal support table names latest browsers, while the CDN section specifically labels the UMD file as ES5.
- `examples/amd/index.html` and `examples/server.js` — RequireJS and classic-script examples consume `dist/axios.min.js` rather than ESM.
- `.github/workflows/run-ci.yml:build-and-run-vitest` and `.github/workflows/release-branch.yml:build-and-run-vitest` — CI builds before unit/browser tests, packs once, and validates the installed tarball across ESM, CommonJS, Bun, and Deno.
- `.github/workflows/bundle-size.yml` — all six generated JavaScript files already have PR-level size comparison coverage.
- `.github/workflows/verify-build-reproducibility.yml` and `THREATMODEL.md:T-S5` — two-pass build comparison and provenance are explicit supply-chain controls for generated code.
- `AGENTS.md:Setup And Safety,Commands,Package Shape` — dependency changes are security-sensitive, builds must use scripts-disabled installs, and `dist/` must never be edited by hand.
- [Rolldown introduction](https://rolldown.rs/guide/introduction) and [getting started](https://rolldown.rs/guide/getting-started) — Rolldown documents standalone Rollup-compatible use, configuration arrays, and reuse of most Rollup plugins while providing common features natively.
- [Rolldown output formats](https://rolldown.rs/reference/OutputOptions.format) — UMD remains a supported output for AMD, CommonJS, and browser globals.
- [Rolldown platform option](https://rolldown.rs/reference/InputOptions.platform) — CommonJS defaults to the Node platform, so Axios's browser CommonJS build must opt into `platform: 'browser'` explicitly.
- [Rolldown transform target](https://rolldown.rs/reference/InputOptions.transform) — the native Oxc transform supports explicit targets down to ES2015; ES5 is not supported.
- [Vite library-mode guidance](https://vite.dev/guide/build.html#library-mode) — Vite describes its preset as browser-oriented and points advanced/non-browser builds to direct Rolldown.
- [jsDelivr Axios package statistics](https://data.jsdelivr.com/v1/stats/packages/npm/axios) and [Axios 1.19.0 file statistics](https://data.jsdelivr.com/v1/stats/packages/npm/axios@1.19.0/files?by=hits&limit=8) — the 2026-08-22 snapshot supports treating the current UMD URL as a material compatibility surface, while not identifying pinned versus unpinned consumers.
- [Rolldown](https://www.npmjs.com/package/rolldown) and [Vite](https://www.npmjs.com/package/vite) registry metadata queried on 2026-08-22 — the latest Rolldown was `1.2.5`, but it was published on 2026-08-19 and did not satisfy the repository's seven-day delay. The implementation therefore pins `1.2.4`, published on 2026-08-12, whose Node engine is `^20.19.0 || >=22.12.0`.

### Motivation

The v2 branch is the appropriate point to modernize the browser syntax contract without breaking the maintained v1.x line. Moving directly to Rolldown aligns the release build with the bundler already underlying Vite 8, should reduce JavaScript plugin execution in a security-sensitive publish path, and avoids adding Vite's application/library conventions around an already explicit multi-target pipeline. Preserving UMD independently avoids turning a build-tool migration into a high-risk CDN and loader migration.

## 4. Scope

### In scope

- Replace the Rollup configuration and CLI invocation with an equivalent standalone Rolldown configuration and build script.
- Replace the remaining Gulp cleanup and release-version orchestration with focused project-owned Node.js scripts, preserving contributor generation and optional version overrides without a general task runner.
- Use Rolldown's native platform, resolver/interoperability, JSON, transform-target, and minification capabilities where parity is demonstrated.
- Set browser ESM, UMD, and CommonJS builds to `platform: 'browser'` and an explicit ES2018 transform target; set the Node CommonJS build to `platform: 'node'` and preserve the Node 20-compatible runtime contract.
- Preserve the current entry points, default/named export shapes, UMD global name, AMD support, filenames, banners, minified-only source maps, browser mappings, and Node externalization rule that bundles `proxy-from-env` while leaving other bare imports external.
- Replace the direct Rollup/Babel/Terser build dependency set with a reviewed, cooldown-compliant Rolldown 1.x release and synchronize only the root lockfile changes required by that decision.
- Add generated-artifact contract tests that run after the build and fail on loader, syntax, path, export, source-map, or browser/Node platform drift.
- Update build-related workflow path filters and terminology, contributor instructions, the thin Copilot safety stub, and threat-model references that become stale.
- Record the ES5 compatibility break and release-time public-documentation work in `PRE_RELEASE_CHANGELOG.md` and `PRE_RELEASE_DOCS.md`.

### Out of scope

- Removing UMD, changing `dist/axios.js` or `dist/axios.min.js`, removing AMD support, changing the `axios` global, or repointing `jsdelivr`/`unpkg` to ESM.
- Removing Node or browser CommonJS, `require` export conditions, `index.d.cts`, CJS fixtures, or CJS examples; that remains a separately approved module-format migration.
- Making Vite the Axios package/release builder or changing its existing docs, Vitest, browser-test, or development-server roles.
- Changing Axios runtime APIs, adapters, declarations, runtime dependencies, package export paths, or the published `engines.node: ">=20.0.0"` consumer contract.
- Promising polyfills for `Promise`, `URL`, `Symbol`, or other runtime APIs; the syntax target and Web API availability remain separate contracts.
- Updating README, docs-site, migration-guide, examples, or translations before explicit v2 release preparation; implementation records that work in `PRE_RELEASE_DOCS.md`.
- Unrelated dependency upgrades, remediation of pre-existing development audit findings, broad Bun-lock refreshes, GitHub Action updates, or v2 release-stream redesign.
- Requiring byte-for-byte equivalence with old Rollup output; semantic/package parity, reviewed size deltas, and reproducibility within the new toolchain are the requirements.

### Constraints

- The change lands only on v2.x. The v1.x maintenance line remains the supported ES5 fallback.
- No runtime dependency may be added or changed. The build-tool replacement is maintainer-controlled, must honor the seven-day dependency delay, and must be reviewed as supply-chain-sensitive work.
- Root `.npmrc` keeps `ignore-scripts=true`; lockfile generation and validation use scripts-disabled npm commands, npm HTTPS hosts, and integrity hashes.
- Rolldown's build-time Node requirement is narrower than Axios's runtime requirement. Contributor/build guidance must require a compatible toolchain (`^20.19.0 || >=22.12.0` for the currently evaluated Rolldown 1.x line) without raising the published Axios runtime floor.
- `dist/` remains generated and ignored. Tests inspect generated files, but no implementation step edits them by hand or commits them.
- Browser CommonJS must specify the browser platform explicitly because Rolldown otherwise defaults CommonJS output to Node resolution behavior.
- The ES2018 target is a maximum generated syntax level, not a guarantee that every ES2018-era browser implements every API Axios may use.
- Any Rolldown incompatibility that cannot preserve package/loader behavior with supported configuration or a small project-owned testable adapter stops the migration for reassessment; it must not be hidden with unreviewed third-party plugins.

## 5. Assumptions and unknowns

| Item                                                                                                                                                      | Classification | Impact if incorrect                                                                                                                    | Resolution                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ES2018 is the intended v2 browser syntax floor because source already has that enforced ceiling and public support names latest browsers.                 | Assumption     | Consumers on older browsers or embedded WebViews may fail to parse v2 even when they use the retained UMD URL.                         | Confirm through plan approval, enforce the target in configuration/tests, and stage an explicit v1.x fallback and migration note.                                                            |
| The exact direct Rolldown version can be selected without violating the seven-day cooldown.                                                               | Resolved       | Selecting a just-published release would violate repository policy; selecting an older incompatible release could miss required fixes. | Pin `1.2.4`, published ten days before implementation; `1.2.5` was only three days old and was rejected by the cooldown.                                                                     |
| Rolldown's built-in resolver, CommonJS interop, JSON handling, UMD wrapper, and minifier preserve Axios's current package behavior without extra plugins. | Resolved       | Browser builds could resolve Node code, or CJS/UMD exports could change shape.                                                         | The unchanged baseline artifact suite, full runtime suites, and packed consumers pass without compatibility plugins.                                                                         |
| Oxc targeting `es2018` produces every generated browser wrapper/helper at or below ES2018, not only transformed source modules.                           | Resolved       | Rolldown-generated runtime code could violate the stated syntax floor.                                                                 | All five complete browser artifacts parse with Acorn at ECMAScript 2018.                                                                                                                     |
| Rolldown minification has an acceptable size/performance result for Axios.                                                                                | Resolved       | CDN users could receive a materially larger or slower bundle even when behavior is correct.                                            | Five of six bundles shrink raw and gzipped; minified browser ESM shrinks 493 raw bytes and grows 50 gzip bytes (+0.27%), an accepted minifier-level variance.                                |
| Only `package-lock.json` needs committed synchronization for the direct build dependency change.                                                          | Assumption     | A fixture lock could become inconsistent with its own manifest or CI install behavior.                                                 | Regenerate only manifest-owned locks, inspect the diff, and run every packed runtime fixture; update another lock only if its package manager proves it is directly affected.                |
| Retaining UMD while deferring CJS removal is compatible with the broader v2 packaging direction.                                                          | Assumption     | A separately approved ESM-only decision could conflict with this retained CDN surface.                                                 | Treat UMD as a browser delivery contract distinct from Node/package-manager CommonJS, and require the future module-format plan to address it explicitly rather than removing it implicitly. |

## 6. Proposed approach

First codify the existing artifact and loader contracts while Rollup still produces the baseline. Then replace the build engine with a `rolldown.config.js` configuration array whose entries correspond directly to the current output matrix. Use explicit `platform` and `transform.target` settings instead of relying on format defaults, and use Rolldown's native minification and module handling to eliminate the old plugin chain.

Keep UMD as a deliberate v2 CDN artifact, not as an accidental side effect of the old tool. Its public filename, classic-script global, and AMD behavior remain regression-tested, while its syntax moves from ES5 to ES2018. Preserve browser and Node CommonJS during this migration so a later package-format change can be reviewed independently.

### Key decisions

| Decision                   | Choice                                                                                                   | Rationale                                                                                                                                                                              | Alternatives considered                                                                                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package build orchestrator | Use standalone Rolldown.                                                                                 | Axios has an advanced mixed browser/Node matrix and needs direct platform, output, and externalization control; Vite itself recommends direct Rolldown for advanced/non-browser flows. | Vite library mode adds a browser-oriented preset and another abstraction; keeping Rollup misses the modernization goal.                                                                 |
| UMD contract               | Retain both minified and unminified UMD at their current paths with global and AMD loading.              | CDN metadata, examples, and observed traffic depend on classic-script behavior; ESM is not a drop-in replacement for `<script>` or `window.axios`.                                     | Dropping UMD or redirecting its path to ESM would create a high-risk parse/global break.                                                                                                |
| Browser syntax floor       | Target and test ES2018; stop ES5 lowering.                                                               | The source tree already enforces ES2018 and public support is modern; Rolldown/Oxc does not target ES5, so Babel can leave the release path.                                           | Keep Babel for ES5 preserves older parsers but retains the plugin surface and legacy cost; ES2015 is broader than the repository's chosen source ceiling without a stated support need. |
| CommonJS scope             | Preserve browser and Node CJS unchanged for this plan.                                                   | It isolates build-engine and browser-syntax risk from package-entry/type/test removal.                                                                                                 | Combining CJS removal would make failures and consumer migration harder to attribute and roll back.                                                                                     |
| Minification               | Use Rolldown's native minifier, gated by size and behavior evidence.                                     | It removes the Terser plugin execution path and keeps one build engine responsible for output.                                                                                         | Retaining Terser is a fallback only if native output cannot meet an explicitly approved requirement; adding another minifier is out of scope.                                           |
| Compatibility proof        | Test observable artifacts and loaders, not byte equivalence to Rollup.                                   | Different bundlers will render code differently, while consumers depend on paths, syntax, exports, environments, and behavior.                                                         | Golden full-file snapshots would be noisy and brittle; relying only on source tests would miss packaging regressions.                                                                   |
| Build dependency version   | Select a reviewed stable Rolldown 1.x release older than the repository cooldown at implementation time. | It respects supply-chain policy while allowing the plan to survive a fast release cadence.                                                                                             | Hard-coding the registry's current latest release could violate the seven-day delay before implementation begins.                                                                       |

## 7. Work plan

| Step | Outcome                                                                                      | Dependencies | Parallelism                                        | Status      |
| ---- | -------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------- | ----------- |
| 1    | The current package artifact and size contracts are executable against the Rollup baseline   | None         | Sequential foundation                              | Complete    |
| 2    | Rolldown produces the preserved package matrix at the ES2018 browser target                  | Step 1       | Sequential                                         | Complete    |
| 3    | The dependency graph and build-time runtime contract are minimal, reviewed, and reproducible | Step 2       | Can run with step 4 after configuration stabilizes | Complete    |
| 4    | Automation and internal guidance describe and watch the Rolldown build                       | Step 2       | Can run with step 3                                | Complete    |
| 5    | The v2 ES5 break and retained UMD migration guidance are staged for release                  | Step 2       | Can run with steps 3–4                             | Complete    |
| 6    | Repository-native and cross-runtime evidence proves the migrated build is releasable         | Steps 1–5    | Sequential final gate                              | In progress |

### Step 1 — Make the generated package contract executable

**Goal:** Establish a bundler-independent baseline that detects accidental consumer-facing drift before the tool replacement.

**Changes:**

- Add a post-build Vitest suite for the exact generated file set, minified source maps, banner, and package metadata references.
- Execute the UMD bundle in isolated classic-script and AMD contexts and assert that each receives the callable default Axios instance with its expected public helpers.
- Parse ESM as modules and UMD/browser CJS as scripts at ECMAScript 2018, while separately exercising current ESM/CJS import shapes through the installed-package suites.
- Add checks that browser artifacts do not resolve Node-only platform/adapters and that Node CommonJS retains the intended bare-dependency externalization.
- Build the source revision with Rollup and record artifact bytes, raw/gzip sizes, current loader results, and two-pass reproducibility as the comparison baseline; do not turn generated files into committed goldens.

**Likely areas:**

- `tests/unit/` (new generated-artifact contract test)
- `package.json`
- `rollup.config.js`
- `.github/workflows/bundle-size.yml`
- `.github/workflows/verify-build-reproducibility.yml`

**Validation:**

- Run the production build and the focused generated-artifact suite against unchanged Rollup output.
- Confirm the suite observes all six JavaScript bundles and two maps, passes both UMD loaders, and intentionally accepts the existing ES5 UMD as valid ES2018 syntax.
- Run two clean builds and capture their hashes plus the existing bundle-size report as baseline evidence.

**Exit criteria:**

- The baseline tests pass before any bundler replacement and would fail if a required file, UMD loader mode, export shape, browser mapping, source map, or ES2018 ceiling were removed.

### Step 2 — Produce the package matrix with standalone Rolldown

**Goal:** Make Rolldown the sole release bundler without changing package paths or observable module behavior.

**Changes:**

- Replace `rollup.config.js` with a new `rolldown.config.js` configuration array that preserves the current entry points and output matrix.
- Configure browser ESM, UMD, and CommonJS explicitly with `platform: 'browser'` and `transform.target: 'es2018'`; configure Node CommonJS with `platform: 'node'` and a Node 20-compatible target.
- Preserve `axios` as the UMD global name, the existing default/named export intent, the banner, minified-only source maps, and the unminified/minified filenames.
- Preserve the Node external predicate, including bundled `proxy-from-env`, and verify browser resolution selects the browser platform replacements.
- Use Rolldown-native minification and built-in resolver, JSON, and CommonJS handling. Introduce no third-party compatibility plugin unless a separately approved reassessment demonstrates it is necessary.
- Change the production build command to invoke a project-owned Node.js cleanup script followed by `rolldown -c`.

**Likely areas:**

- `rolldown.config.js` (new)
- `rollup.config.js` (removed)
- `package.json:scripts.build`
- `tests/unit/` generated-artifact contract coverage

**Validation:**

- Run `npm run build` and the focused artifact-contract suite.
- Inspect the emitted package paths and import/require/UMD/AMD behavior rather than comparing rendered source text.
- Compare all six raw/gzip sizes to the recorded Rollup baseline and investigate every material delta.

**Exit criteria:**

- Rolldown alone produces the complete artifact matrix, every baseline contract passes unchanged, and any size delta is explained and accepted.

### Step 3 — Minimize and verify the build dependency graph

**Goal:** Leave one direct, reviewed bundler dependency and no obsolete build plugins in the release path.

**Changes:**

- Select a stable Rolldown 1.x version that has aged at least seven days and is compatible with the approved configuration.
- Add Rolldown as a direct development dependency; remove Rollup, Rollup plugins, Babel core/preset/plugin, Terser plugin, the local bundle-size plugin, Gulp, and `fs-extra` when repository-wide search proves they are unused.
- Regenerate `package-lock.json` with scripts disabled and avoid unrelated dependency churn; do not update fixture locks unless their own package-manager validation requires it.
- Inspect the chosen package's provenance, maintainers, lifecycle scripts, native optional bindings, advisories, license, engine range, resolved hosts, and integrity entries.
- Keep the published Axios runtime `engines.node` value unchanged, but document and validate the narrower Node version required to build v2.

**Likely areas:**

- `package.json:devDependencies,engines`
- `package-lock.json`
- `.npmrc`
- `scripts/clear-dist.js`
- `scripts/prepare-version.js`
- `gulpfile.js` (removed)
- `AGENTS.md`
- `.github/copilot-instructions.md`

**Validation:**

- Run `npm ci --ignore-scripts` on a supported build Node version.
- Run the repository's pinned `lockfile-lint` command and inspect `git diff -- package.json package-lock.json` for scope, npm HTTPS URLs, integrity hashes, optional native bindings, and unexpected package churn.
- Run production and full dependency audits, recording pre-existing findings separately and requiring no new unresolved production vulnerability or unexplained build-tool advisory.
- Search for stale imports/references to every removed package.

**Exit criteria:**

- A clean scripts-disabled install contains the reviewed direct Rolldown release, no removed build package is referenced, runtime dependencies are byte-for-byte unchanged in the manifest, and lockfile/security checks pass.

### Step 4 — Align build automation and internal safety guidance

**Goal:** Ensure CI, release review, and contributors invoke and monitor the new build correctly.

**Changes:**

- Replace build-workflow path filters that name `rollup.config.js` with `rolldown.config.js` and audit all build/release workflows for stale Rollup assumptions.
- Keep build-before-test, pack-once artifact handoff, bundle-size comparison, two-pass reproducibility, scripts-disabled install, action SHA pins, and Node 20/22/24/26 package matrices intact.
- Update `AGENTS.md` and `.github/copilot-instructions.md` together for the new command/configuration, ES2018 browser target, retained UMD contract, and compatible contributor build runtime.
- Update `THREATMODEL.md` T-S2/T-S5 references so the build-tampering model names Rolldown/native minification and the reduced plugin path accurately without weakening existing provenance or reproducibility controls.

**Likely areas:**

- `.github/workflows/verify-build-reproducibility.yml`
- `.github/workflows/run-ci.yml`
- `.github/workflows/release-branch.yml`
- `.github/workflows/publish.yml`
- `.github/workflows/bundle-size.yml`
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `THREATMODEL.md`

**Validation:**

- Search tracked workflow/guidance files for stale build-critical `rollup.config.js`, Rollup/Babel/Terser, ES5 UMD, and build-runtime claims; retain historical changelog text unchanged.
- Parse/format changed YAML and Markdown and inspect workflow diffs for unchanged permissions, action pins, job dependencies, and artifact handoff.
- Run the local equivalent of the two-pass reproducibility job with the Rolldown build.

**Exit criteria:**

- Every active build path invokes or watches the Rolldown configuration, load-bearing safety guidance is synchronized, and no security or CI control is weakened.

### Step 5 — Stage the v2 compatibility and migration record

**Goal:** Make the intentional ES5 break visible without prematurely editing release-owned public documentation.

**Changes:**

- Add a `PRE_RELEASE_CHANGELOG.md` breaking-change entry stating that v2 UMD remains available at the same URLs but now targets ES2018; direct legacy consumers should remain on v1.x or add their own controlled transpilation/polyfill strategy.
- Add a `PRE_RELEASE_DOCS.md` item for the README CDN label, browser support policy, migration guide, docs site/translations, UMD/global/AMD examples, and the distinction between syntax transforms and Web API polyfills.
- State explicitly that `<script type="module">` is not a transparent replacement for the retained classic UMD script because it has module scope, CORS/loading differences, and no automatic `window.axios` global.
- Record that any future CJS/ESM-only migration must decide package-manager module formats independently from the retained browser CDN artifact.

**Likely areas:**

- `PRE_RELEASE_CHANGELOG.md`
- `PRE_RELEASE_DOCS.md`

**Validation:**

- Review staged notes against the repository pre-release policy and ensure they name stable document sections, the ES2018 floor, unchanged URLs/loaders, v1.x fallback, translations, and release timing.
- Confirm README, docs site, migration guide, examples, and translations remain unchanged during implementation.

**Exit criteria:**

- Release maintainers have an unambiguous checklist for communicating the compatibility boundary, and unreleased public docs still describe only the currently released line.

### Step 6 — Prove release readiness across generated and installed surfaces

**Goal:** Demonstrate that the build migration is correct, secure, reproducible, and compatible everywhere Axios ships.

**Changes:**

- Resolve only defects exposed by the approved validation; do not absorb CJS removal, public release preparation, unrelated dependency updates, or runtime refactors.
- Record local and CI evidence for the generated-artifact contract, bundle sizes, reproducibility, package contents, and every runtime/module suite.
- Review the final diff specifically for package path drift, browser/Node platform leakage, generated export shape, lockfile scope, workflow triggers, and staged compatibility messaging.

**Likely areas:**

- `tests/unit/`
- `tests/browser/`
- `tests/module/`
- `tests/smoke/`
- `.github/workflows/`
- `package.json`
- `package-lock.json`

**Validation:**

- Run a clean root install with scripts disabled, source lint, production build, focused artifact contracts, the full unit suite, and headless browser suite.
- Pack Axios and install the tarball into the CommonJS and ESM module/smoke fixtures; run Bun and Deno smoke suites from the packed/generated package paths.
- Inspect `npm pack --dry-run` or the packed tarball to confirm the current package file list and absence of build-only configuration/dependencies from runtime execution.
- Require green CI across configured Node 20/22/24/26 package lanes, Bun, Deno, lockfile lint, bundle size, and reproducibility review.

**Exit criteria:**

- All success criteria have recorded evidence, all required CI checks are green, size/reproducibility output is reviewed, and no unapproved compatibility or dependency change remains.

## 8. Verification strategy

| Success criterion                                             | Verification                                                                                                | Expected evidence                                                                                                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Rolldown emits the same package file set                      | Clean install, `npm run build`, generated-file inventory, and packed tarball inspection                     | Six JavaScript bundles and two minified maps exist at the current paths and are included exactly as before                                                   |
| UMD global, AMD, and CDN contracts remain                     | Execute both UMD variants in isolated classic-script and `define.amd` contexts; inspect `jsdelivr`/`unpkg`  | Both loaders receive callable Axios with representative helpers; CDN fields still name `dist/axios.min.js`                                                   |
| Browser syntax ceiling is ES2018 and Babel is gone            | Acorn-parse every full browser artifact at ECMAScript 2018; search manifest/lock/config for Babel build use | All files parse; no Babel release transform or ES5 claim remains in active v2 guidance                                                                       |
| ESM/CJS exports, platform mapping, and externalization remain | Focused artifact tests plus packed ESM/CJS module and smoke suites                                          | Default/named/require behavior matches baseline; browser bundles contain browser paths and Node CJS resolves intended externals                              |
| Dependency and lockfile change is minimal and trusted         | Manifest/lock diff, package metadata/provenance review, lockfile-lint, npm audits                           | Runtime deps unchanged; reviewed Rolldown direct dependency present; obsolete build packages absent; HTTPS/integrity valid                                   |
| Repository runtime suites remain green                        | Unit, browser-headless, packed ESM/CJS, Bun, and Deno commands locally/CI                                   | Existing behavior passes against built/packed output on all configured runtimes                                                                              |
| Size and reproducibility are acceptable                       | Existing six-file bundle-size action and two independent clean build/hash passes                            | Deltas are documented and approved; new-tool builds are byte-identical within the same revision/environment or divergence is explained and blocks completion |
| Guidance and pre-release records match the decision           | Diff/search of contributor, threat-model, changelog, and docs-staging files                                 | Rolldown/ES2018/UMD/v1 fallback wording is consistent; release-owned public docs are untouched                                                               |

### Regression coverage

- Browser ESM keeps default and named exports and resolves browser platform replacements.
- Browser CommonJS explicitly behaves as a browser build despite its CJS format.
- Node CommonJS remains loadable as `require('axios')` and `require('axios').default` on every configured Node major during the transition.
- UMD works both with no module loader (`globalThis.axios`) and with `define.amd`; minified and unminified variants agree.
- CDN default paths, package `files`, conditional exports, browser mappings, declaration files, and source-map references do not drift.
- Node built-ins and runtime dependencies do not leak into browser bundles; `proxy-from-env` remains bundled only where intended.
- Cancellation, XHR/Fetch behavior, headers, errors, transforms, and adapters remain covered by the unchanged unit/browser/packed suites.
- Clean builds remain reproducible, and native minification does not introduce an unreviewed bundle-size regression.
- v1.x receives no backport and remains the ES5 compatibility fallback.

## 9. Risks and mitigations

| Risk                                                                    | Likelihood                | Impact   | Mitigation or detection                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------- | ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Rolldown resolves browser CommonJS with Node defaults                   | Medium                    | Critical | Set `platform: 'browser'` explicitly and assert browser platform/adapters in generated and runtime tests.                                                                                                                                                                |
| UMD wrapper or default-export interop changes                           | Medium                    | High     | Establish global and AMD tests on Rollup first, then require the same tests to pass unchanged on Rolldown for both variants.                                                                                                                                             |
| Dropping ES5 breaks older browsers/WebViews using a still-valid CDN URL | High for legacy consumers | High     | Make the ES2018 floor a v2 breaking change, retain URL/global/AMD behavior, direct legacy users to v1.x, and stage prominent migration docs.                                                                                                                             |
| Oxc-generated helpers exceed ES2018 despite source compliance           | Low                       | High     | Parse complete emitted artifacts, not only source modules, with Acorn at the declared ceiling.                                                                                                                                                                           |
| Native minification changes semantics or increases CDN payload          | Medium                    | High     | Run full browser/unit behavior, UMD loader tests, and six-file raw/gzip comparison; require explicit acceptance for regressions.                                                                                                                                         |
| CommonJS export shape differs from Rollup                               | Medium                    | High     | Preserve CJS-specific package/module fixtures on Node 20/22/24/26 and add direct generated-artifact shape assertions.                                                                                                                                                    |
| New native optional bindings enlarge or weaken the supply chain         | Medium                    | High     | Respect the seven-day cooldown; inspect provenance, lifecycle scripts, platform packages, integrity, advisories, and dependency-review output. Rolldown is already present transitively through Vite/Vitest, but direct release use still receives a fresh trust review. |
| Build-tool Node engine is confused with the Axios consumer floor        | Medium                    | Medium   | Keep `engines.node: ">=20.0.0"` unchanged and describe the narrower contributor/build requirement separately in canonical guidance.                                                                                                                                      |
| Lockfile regeneration absorbs unrelated audit/update churn              | Medium                    | High     | Use a targeted scripts-disabled manifest update, inspect the complete lock diff, validate npm hosts/integrity, and reject unrelated resolutions.                                                                                                                         |
| Build reproducibility changes under a new native toolchain              | Medium                    | High     | Run two clean installs/builds and compare hashes on CI; investigate nondeterminism before completion and retain provenance controls.                                                                                                                                     |
| Combining this work with CJS or UMD removal obscures failures           | Medium                    | High     | Enforce explicit non-goals and require a separate approved package-format plan.                                                                                                                                                                                          |

## 10. Delivery and recovery

- **Delivery sequence:** Approve this plan; implement contract tests against Rollup; migrate configuration and dependencies to Rolldown; align automation/internal guidance; stage compatibility notes; obtain local and CI artifact, package, size, reproducibility, and cross-runtime evidence; merge only to v2.x; apply public docs only during v2 release preparation.
- **Compatibility:** v2 keeps every current output path and loader/module contract but raises generated browser syntax to ES2018. v1.x remains the supported ES5 line. The Axios runtime Node floor remains `>=20.0.0`; only contributor/build tooling needs Rolldown's narrower engine.
- **Migration or backfill:** No data migration exists. Legacy browser consumers either remain on v1.x or adopt a controlled transpilation/polyfill strategy; CDN consumers do not need to change URLs when their runtime supports ES2018.
- **Observability:** Generated-artifact contracts, packed runtime matrices, bundle-size reports, two-pass hashes, lockfile/security checks, and npm provenance are the release signals. CDN download statistics remain contextual evidence, not an acceptance metric.
- **Rollback/recovery:** Before v2 publication, revert the bundler/dependency/configuration commit as one unit and restore the Rollup baseline while retaining the contract tests where applicable. After an immutable npm release, publish a normal follow-up version that restores a safe build or syntax target; never overwrite artifacts or mutate CDN files in place.
- **Approval gates:** Maintainer approval is required for this plan, the direct build dependency and lockfile change, and the ES2018 browser break. Any artifact path/loader/export change, unresolved size regression, third-party compatibility plugin, CJS/UMD removal, public docs deployment, tag, or npm publication requires separate explicit approval or its normal release process.

## 11. Documentation and follow-ups

- During implementation, update `AGENTS.md`, `.github/copilot-instructions.md`, and `THREATMODEL.md` because they are internal load-bearing build/safety sources, and record the breaking change in `PRE_RELEASE_CHANGELOG.md` plus deferred public wording in `PRE_RELEASE_DOCS.md`.
- During v2 release preparation, update the README CDN label and browser table, the migration guide, docs feature/support pages and translations, and relevant examples to say “UMD, ES2018” and distinguish syntax from polyfills.
- Keep the classic-script and AMD examples because those contracts remain supported; do not silently convert them to ESM.
- Create a separate approval-ready plan for eventual Node/browser CommonJS export, declaration, fixture, and automation removal. That plan must decide explicitly whether “ESM-only package” excludes or coexists with the browser UMD CDN artifact.
- Use the completion workflow after implementation to refresh `docs/codebase-knowledge-base/` and its recovery-oriented change log with the final build architecture and validation evidence.
- Axios has a recorded repository-wide no-E2E directive; acceptance therefore uses the repository-native automated, packaging, compatibility, size, and reproducibility evidence in this plan rather than creating a Gherkin E2E artifact.

## 12. Execution notes

### Progress

- 2026-08-22T18:48:22+02:00 — The maintainer approved implementation on `plan/rolldown-modern-umd`. A scripts-disabled clean install completed, and the Rollup baseline emitted the expected six JavaScript bundles plus two source maps. Baseline minified sizes are 68,211 bytes UMD and 51,375 bytes ESM (23,442 and 18,820 bytes with gzip `-9`); artifact-contract coverage is in progress.
- 2026-08-22T19:05:55+02:00 — Added a 22-test generated-artifact contract and proved it first against Rollup, then unchanged against Rolldown. It covers the exact eight-file inventory, ES2018 parsing, release banners, minified source maps, UMD global and AMD loading, ESM/CJS exports, browser isolation, and selective Node externalization.
- 2026-08-22T19:05:55+02:00 — Replaced `rollup.config.js` and its plugin/Babel/Terser stack with `rolldown.config.js` and exact `rolldown@1.2.4`. A scripts-disabled clean install now contains 470 packages instead of 629. Rolldown has no lifecycle install scripts, uses exact-version native optional bindings, is MIT licensed, has npm signatures and integrity metadata, and requires Node `^20.19.0 || >=22.12.0`; Axios's published `>=20.0.0` runtime floor is unchanged.
- 2026-08-22T19:05:55+02:00 — The pinned lockfile validator and production audit pass. The full audit retains the baseline's two development-only high findings: `brace-expansion` through ESLint and `nanoid` through Vitest/Vite/PostCSS. The lock diff removes 187 package paths, adds only the nested Rolldown/Vite paths needed by the new exact root pin, changes no runtime dependency, and introduces no install-script entry.
- 2026-08-22T19:05:55+02:00 — Local validation passes: source and changed-file lint, formatting, workflow YAML parsing, 1,062 unit tests, 615 headless-browser tests, 22 artifact tests, 71 packed CJS smoke tests, 75 packed ESM smoke tests, 6 packed CJS/TypeScript module tests, 4 packed ESM module tests, and 22 packed Bun smoke tests. `npm pack` contains the expected artifact paths and produces a 475,668-byte tarball.
- 2026-08-22T19:05:55+02:00 — Two consecutive Rolldown builds produced identical SHA-256 hashes for all eight artifacts. Raw/gzip level-9 comparison against an isolated Rollup build at the source revision is recorded below; the only increase is 50 gzip bytes (+0.27%) for minified browser ESM, while that file is 493 raw bytes smaller.
- 2026-08-22T19:27:36+02:00 — Removed the remaining Gulp task runner and now-unused `fs-extra`. `scripts/clear-dist.js` performs the pre-build cleanup with native Node.js APIs, while `scripts/prepare-version.js` preserves the release-time version file, contributor refresh, GitHub rate-limit error, and optional `--bump` behavior. Three focused script tests cover cleanup plus manifest-derived and overridden versions. The clean install falls again from 470 to 339 packages; the lockfile removes exactly 131 paths with no additions or version changes. The production build, 25 build/script tests, 1,062 unit tests, 615 browser tests, lockfile-lint, production audit, package dry run, and two-pass reproducibility all pass; the same two pre-existing development audit findings remain.

| Artifact                 | Rollup raw/gzip  | Rolldown raw/gzip | Raw delta         | Gzip delta        |
| ------------------------ | ---------------- | ----------------- | ----------------- | ----------------- |
| `dist/axios.js`          | 206,918 / 51,302 | 135,453 / 35,574  | -71,465 (-34.54%) | -15,728 (-30.66%) |
| `dist/axios.min.js`      | 68,211 / 23,442  | 50,515 / 18,751   | -17,696 (-25.94%) | -4,691 (-20.01%)  |
| `dist/browser/axios.cjs` | 161,260 / 43,488 | 131,439 / 35,308  | -29,821 (-18.49%) | -8,180 (-18.81%)  |
| `dist/esm/axios.js`      | 162,238 / 43,740 | 132,160 / 35,432  | -30,078 (-18.54%) | -8,308 (-18.99%)  |
| `dist/esm/axios.min.js`  | 51,375 / 18,820  | 50,882 / 18,870   | -493 (-0.96%)     | +50 (+0.27%)      |
| `dist/node/axios.cjs`    | 231,875 / 63,542 | 189,273 / 50,143  | -42,602 (-18.37%) | -13,399 (-21.09%) |

### Deviations

- None.

### Final outcome

Implementation and local verification are complete. The plan remains active until remote CI supplies the configured Node 20/22/24/26 package lanes, Deno smoke result, dependency review, bundle-size report, and GitHub-hosted reproducibility evidence.
