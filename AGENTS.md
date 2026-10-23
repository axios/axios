# AGENTS.md

axios is a promise-based HTTP client for the browser and Node.js. The default instance is exported from `packages/axios/lib/axios.js` via `packages/axios/index.js`. Browser builds use the XHR or Fetch adapter; Node uses the HTTP/HTTPS adapter. Platform selection lives in `packages/axios/lib/platform/`.

This file is the canonical contributor guide for both human and AI agents working in this repo. `.github/copilot-instructions.md` is a thin stub that points back here — keep it in sync with the load-bearing safety rules below if you change them.

## Monorepo layout

- The root manifest is private and pins pnpm 10.34.7. Install it with `npm install --global pnpm@10.34.7 --ignore-scripts`, or use Corepack if available. Keep `.npmrc`'s `ignore-scripts=true` and `pnpm-workspace.yaml`'s `ignoreScripts: true` enabled.
- `packages/axios/` owns the published `axios` manifest, runtime dependencies, source, declarations, build scripts, generated bundles, and unit/browser/build tests. Paths below are repository-relative; forwarded Axios scripts execute in `packages/axios`.
- `apps/docs/` and `apps/sandbox/` are private workspaces consuming `axios` through `workspace:*`. The docs Splide patch is applied by pnpm without lifecycle scripts.
- `tests/` is the private `@axios/e2e` workspace. `pnpm run test:e2e` builds and packs Axios, installs that tarball into an isolated temporary consumer outside the repository, then tests real browsers and Node.js, Bun, and Deno. Install the runtimes and Playwright browsers first. Missing runtimes fail the run rather than silently skipping coverage.
- Focused commands are `pnpm run test:e2e:node`, `pnpm run test:e2e:browser`, `pnpm run test:e2e:bun`, and `pnpm run test:e2e:deno`; each builds and packs freshly by default. Node runs both ESM/CJS consumers and TypeScript 4.9/5.x declaration/application checks. Browsers use Playwright against a bundled installed consumer and the installed UMD artifact. Native runtimes use their own test runners against local HTTP services.
- CI builds one artifact with `pnpm run test:e2e:pack`; e2e jobs use `-- --artifact-dir artifacts/e2e` to install that same tarball after verifying its SHA-256 manifest. This option deliberately reuses an artifact; omit it for fresh local validation. Never use workspace links or library-source imports in e2e scenarios. See [tests/README.md](tests/README.md) and [tests/COVERAGE.md](tests/COVERAGE.md).
- Repository policy and prerelease tracking stay at the root. Release history and migration guidance live in `packages/axios/`; the package owns its usage README, and its LICENSE must stay synchronized with the root LICENSE.

## Repository skills

The repository maintains its OSS workflows in [`.agents/skills/`](.agents/skills/): `oss-pr-review`, `oss-ghsa-review`, `oss-ghsa-fix`, `oss-vulnerability-impact-assessment`, and `oss-release-notes`. Read the matching `SKILL.md` when using a workflow; see [CONTRIBUTING.md](CONTRIBUTING.md#ai-assisted-workflows) for invocation examples and prerequisites. Use these repository copies when a global skill has the same name.

Skills supplement this guide; they do not override repository security, prerelease, validation, or AI-labeling requirements, or authorize posting reviews, publishing releases, or disclosing confidential advisory material. Keep unpublished advisory work private and retain the remediation skill's plan-approval step. Complete this guide's submission requirements before opening or updating a public PR.

## Setup And Safety

- Use Node.js 20.19 or newer for v2 development and validation. Rolldown currently requires `^20.19.0 || >=22.12.0`; the published Axios runtime floor remains Node.js 20.0.
- Use `pnpm install --frozen-lockfile --ignore-scripts`; repo `.npmrc` sets `ignore-scripts=true`, and CI also uses `pnpm install --frozen-lockfile --ignore-scripts`.
- Do not remove `ignore-scripts=true`; if git hooks are needed after a fresh install, run `pnpm exec husky` once.
- Adding or updating dependencies is security-sensitive; review new package names and dependency sources, require HTTPS npm-registry URLs for explicit registry tarballs, and inspect missing or changed integrity hashes for registry packages. Check any new Git, file, or link sources against the intended first-party workspace links.
- Package, lockfile, and GitHub Actions update PRs are maintainer/bot-only; close these PRs from outside collaborators. Keep the 7-day Dependabot delay unless a critical vulnerability requires a maintainer-led manual update.
- Build/test/lint tools still execute dependency code despite `ignore-scripts`; run the validation required by the PR submission checklist below and avoid unrelated runtime checks for documentation-only changes.
- Do not add new runtime dependencies without discussion; the dependency surface is intentionally tiny.

## Pull Requests

- Apply the existing `ai-assisted` repository label to pull requests created or updated with AI assistance, including AI-generated descriptions. Use `gh pr create --label ai-assisted` when opening a PR or `gh pr edit <number-or-url> --add-label ai-assisted` for an existing PR.
- Do not add a surfer emoji to PR titles or bodies to indicate AI assistance. If you cannot apply labels, report that a maintainer needs to apply `ai-assisted`.

## Commands

- Build published artifacts: `pnpm run build` (the project-owned Node cleanup script deletes `packages/axios/dist/`, then Rolldown writes browser ESM/UMD/CJS and Node CJS bundles).
- For a local version bump with release hooks enabled, use `pnpm run version:axios patch --ignore-scripts=false` (or `minor`/`major`). The post-bump `version` hook prepares metadata from the updated manifest, builds, and stages the package manifest and generated version file. Run `pnpm install --lockfile-only --offline --ignore-scripts` after changing package versions. The root command explicitly disables automatic Git commits and tags because Axios is nested inside the repository. Commit the staged changes and create release tags separately after review. CI also bumps without creating a Git tag. CI keeps automatic hooks disabled and explicitly runs `pnpm run prepare:version` after bumping, then builds and validates artifacts.
- Contributor refresh during `prepare:version` is optional, with a 10-second timeout per GitHub request. A failed refresh warns and keeps the existing manifest contributor list. Release file write failures remain fatal and roll back prior replacements; if rollback fails, the error reports a retained recovery path.
- Validate generated package contracts after a build: `pnpm run test:build:artifacts` (file inventory, ES2018 browser syntax, UMD global/AMD loaders, ESM/CJS export shapes, source maps, and platform separation).
- Lint source only: `pnpm run lint`; focused lint: `pnpm --filter axios exec eslint lib/path/to/file.js`.
- Unit tests: `pnpm run test:vitest:unit`; focused unit test: `pnpm --filter axios run test:vitest:unit tests/unit/path.test.js`.
- Browser tests need Playwright installed first (`pnpm --filter axios exec playwright install` locally; CI uses `pnpm --filter axios exec playwright install --with-deps`); run `pnpm run test:vitest:browser:headless` for CI parity.
- E2e suites test the packed release: run `pnpm run test:e2e`, or the focused runtime/browser commands above. They manage building, packing, installation, local services, and cleanup.
- The `build-and-run-vitest` job runs install -> lint (pull-request CI only) -> build -> artifact validation -> Playwright install -> unit -> browser headless -> pack. After that job succeeds, the reusable e2e workflow tests the same tarball on Node 20/22/24/26, Bun, Deno, and Chromium/Firefox/WebKit. Release preparation depends on every e2e job.

## Package Shape

- Source is ESM (`type: module`); public ESM entry is `packages/axios/index.js`, which re-exports the default instance from `packages/axios/lib/axios.js`.
- Do not edit `packages/axios/dist/` by hand; it is ignored and generated from `packages/axios/lib/` by Rolldown.
- Browser ESM, UMD, and CJS outputs target ES2018. The UMD files remain classic-script/AMD compatible and expose the `axios` global, but v2 does not promise ES5 syntax or runtime polyfills.
- Runtime package exports are split by environment: browser/react-native map Node HTTP/platform files to browser/null replacements, while Node CJS ships as `packages/axios/dist/node/axios.cjs`.
- Keep public runtime exports, `packages/axios/index.d.ts` (ESM types), and `packages/axios/index.d.cts` (CJS `export = axios` types) in sync for API changes.
- `packages/axios/lib/env/data.js` is generated by `pnpm run prepare:version` after the manifest version is bumped; do not edit it for normal feature work.

## Pre-Release Notes

- Every PR MUST add or update an entry in `PRE_RELEASE_CHANGELOG.md`, except for the automated release-preparation PRs described below. This includes runtime fixes, features, internal refactors, tests, documentation, tooling, and CI changes. An unchanged public API or a documentation-only diff is not a reason to omit the entry.
- Use **Features** for new capabilities, **Bug Fixes** for behavior corrections, **Documentation** for documentation changes, and **Maintenance** for test-only changes, internal refactors, tooling, dependency updates, and CI changes without a user-visible behavior change. Explain the final change, why it matters, and any compatibility implications. Update the existing entry when revising the same PR instead of adding duplicates. Link the issue and PR when their numbers are known; never invent a reference.
- **Automated release-preparation exception:** PRs created by [the release-branch workflow](.github/workflows/release-branch.yml) that contain only generated version, package metadata, lockfile, and build changes may omit a new prerelease entry. They prepare changes already recorded by the contributing PRs. If additional fixes, features, or maintenance changes are added, those changes still require an entry. This exception only covers the prerelease-entry requirement; maintainers must complete the other applicable submission requirements and release documentation before merge.
- `packages/axios/CHANGELOG.md` is release-owned and should only be updated as part of preparing an actual release. A PR body, commit message, or planned release note does not replace the committed prerelease entry.
- Track deferred README, docs site, examples, migration guide, and translated docs updates in `PRE_RELEASE_DOCS.md`. Use enough context for release preparation; do not store brittle diffs or line-number-only notes.
- Do not update `packages/axios/README.md` or the docs site for unreleased runtime/API changes unless the task is explicitly release preparation. During feature/fix work, record what docs need to say in `PRE_RELEASE_DOCS.md` so it can be applied during release work.

## Before Opening Or Updating A Pull Request

These requirements apply to human contributors and AI agents. Complete the applicable work before submitting a PR for maintainer review; a checked box must describe verified work, not an intention. Use `.github/PULL_REQUEST_TEMPLATE.md` and keep its answers accurate when the implementation changes.

1. **Confirm scope and base.** Read this guide, `CONTRIBUTING.md`, and `SECURITY.md`; consult `THREATMODEL.md` for security-sensitive changes. Target the intended supported release branch, link the issue or explain the problem, and review the complete diff against that base. Keep unrelated changes out of the PR.
2. **Commit the prerelease entry.** Follow the mandatory Pre-Release Notes rules above. Confirm that the entry describes the final implementation, including any limitations. Only the automated release-preparation exception above may be marked not applicable; explain why it applies in the PR description.
3. **Prove the behavior.** Bug fixes need a regression test that fails before the fix and passes afterward. Cover relevant negative cases and preserve existing defensive tests. For adapter or platform changes, consider Node, browser, custom-environment, and affected-runtime behavior; a mock should reflect the capability being fixed. Use a safe local runtime reproduction when the ordinary suites cannot establish compatibility.
4. **Run the required local checks.** Install with `pnpm install --frozen-lockfile --ignore-scripts`. For runtime changes, run `pnpm run lint`, `pnpm run build`, and `pnpm run test:vitest:unit`; adapter or browser changes also need `pnpm run test:vitest:browser:headless`. Public type changes require `pnpm run test:e2e:node`, including both CJS/ESM declaration checks. Packaging, exports, or build changes require the affected packaged e2e suites. Follow the supported runtimes in `.github/workflows/run-ci.yml`. For changes limited to documentation or contributor instructions, check formatting, links, and consistency; explain why runtime checks are not applicable instead of running unrelated suites.
5. **Check compatibility and documentation.** State the semver impact and call out intentional breaking behavior. Keep runtime exports, `packages/axios/index.d.ts`, `packages/axios/index.d.cts`, and their tests aligned when the public API changes. Record deferred release documentation in `PRE_RELEASE_DOCS.md`, or explain why no docs/types update is needed. A bug fix without an API change still requires its prerelease changelog entry.
6. **Review security and hygiene.** Preserve the guards and architecture boundaries below. Inspect the final diff for unrelated dependency or workflow changes, generated bundles, version churn, secrets, debug code, focused tests (`.only`, `fit`, `fdescribe`), and unexplained lint suppressions. Respect the maintainer-only dependency/workflow policy and never edit generated artifacts by hand.
7. **Write an accurate submission.** Use Conventional Commits for the title and commits. Explain the concrete problem, resulting behavior, issue/rationale, and validation. List the commands actually run, their results, and relevant runtime versions. Give a specific reason for each genuinely inapplicable check; distinguish failed or blocked checks from checks that do not apply. Fill in the PR description yourself rather than relying on a bot to reconstruct it.

CI runs after a PR is opened. Inspect the actual GitHub Actions checks for the latest commit before reporting the PR ready to merge; review/security bot approvals are not build, test, packaging, or runtime-matrix evidence. Resolve relevant failures and report pending or approval-required runs accurately. If required local checks are blocked, keep the PR as a draft and describe the blocker and remaining validation. After further code changes, rerun the affected checks and update the PR's evidence.

## Architecture Boundaries

- `packages/axios/lib/core/` is axios domain logic: request dispatch, config merge, interceptors, headers, errors. Key classes: `Axios` (request dispatch + interceptor chains), `AxiosError` (standardized error codes), `AxiosHeaders` (case-insensitive header normalization), `InterceptorManager` (sync/async interceptor registration).
- `packages/axios/lib/adapters/` performs I/O; default adapter preference is `['xhr', 'http', 'fetch']`, with capability selection in `packages/axios/lib/adapters/adapters.js`. Detect by capability, not environment name.
- `packages/axios/lib/platform/` selects Node by default; browser builds rely on package/Rolldown browser-field resolution to `packages/axios/lib/platform/browser`.
- `packages/axios/lib/helpers/` should stay generic and reusable outside axios; do not put axios-specific request lifecycle logic there.
- New `packages/axios/lib/**/*.js` files should match existing source style: ESM imports with explicit `.js` extensions, `'use strict';` where current library files use it, and `AxiosError` for axios-originated failures.

## Naming Conventions

- Classes: PascalCase (`Axios`, `AxiosError`, `InterceptorManager`).
- Functions: camelCase (`buildURL`, `mergeConfig`, `dispatchRequest`).
- Error codes: UPPER_SNAKE_CASE constants on `AxiosError` (`ERR_NETWORK`, `ETIMEDOUT`).
- Internal class slots: `Symbol`-keyed (e.g. `const $internals = Symbol('internals')` in `packages/axios/lib/core/AxiosHeaders.js`) rather than underscore-prefixed properties.

## Error Handling

- Throw `AxiosError` for axios-originated failures; never raw `Error`. Pass `(message, code, config, request, response)` so consumers can introspect.
- Wrap third-party errors with `AxiosError.from(error, code, config, request, response)`.
- Canonical code list lives in `packages/axios/lib/core/AxiosError.js`; current codes include `ERR_BAD_OPTION_VALUE`, `ERR_BAD_OPTION`, `ECONNABORTED`, `ETIMEDOUT`, `ECONNREFUSED`, `ERR_NETWORK`, `ERR_FR_TOO_MANY_REDIRECTS`, `ERR_DEPRECATED`, `ERR_BAD_RESPONSE`, `ERR_BAD_REQUEST`, `ERR_CANCELED`, `ERR_NOT_SUPPORT`, `ERR_INVALID_URL`, `ERR_FORM_DATA_DEPTH_EXCEEDED`.
- Validate config options through the `validator` helper; do not invent ad-hoc validation paths.

## Interceptor Execution Order

- Request interceptors run **last-registered-first** (LIFO) by default. Setting `transitional.legacyInterceptorReqResOrdering: false` switches them to **first-registered-first** (FIFO).
- Response interceptors run **first-registered-first** (FIFO).
- Only request interceptors support `synchronous: true` (avoids Promise wrapping when no async request handler is in the chain) and `runWhen: (config) => boolean` for conditional execution. Response interceptors run through the Promise chain and do not use these options.
- Order matters for both behavior and tests; document it when adding new built-in interceptors.

## Request Lifecycle

1. User calls `axios()` or a method alias.
2. Merge instance defaults with request config via `mergeConfig`.
3. Run request interceptors (LIFO by default; FIFO with `transitional.legacyInterceptorReqResOrdering: false`).
4. Apply `transformRequest` functions.
5. Select adapter via `packages/axios/lib/adapters/adapters.js` capability check.
6. Adapter performs the HTTP request.
7. Apply `transformResponse` functions.
8. Run response interceptors (FIFO).
9. Resolve promise with `AxiosResponse` or reject with `AxiosError`.

## Cancellation

- Both `CancelToken` (legacy) and `AbortSignal` (modern) are supported simultaneously; do not break either path.
- Cancellation must work at any lifecycle stage, including mid-flight body reads.
- Always remove signal listeners on settlement or cancellation to prevent memory leaks.

## Common Pitfalls

- Do not mutate config objects in-place; return new objects from merges/transforms.
- Do not assume browser- or Node-specific globals exist; capability-check first.
- Do not use `Function.prototype.bind` directly — use `packages/axios/lib/helpers/bind.js`, which forwards `arguments` via `apply` and is what the rest of the library relies on.
- Do not throw raw `Error` from library code; use `AxiosError` with an appropriate code (see Error Handling).

## Tests

- Test layout is runtime-first: `packages/axios/tests/unit/**/*.test.js`, `packages/axios/tests/build/**/*.test.js`, `packages/axios/tests/browser/**/*.browser.test.js`, `tests/browser/*.spec.mjs`, and `tests/runtime/*.test.mjs`.
- Use `packages/axios/tests/setup/server.js` for local HTTP servers and cleanup with `try/finally`; leaking servers causes Vitest hangs.
- E2e scenarios run the same network behavior against both ESM and CJS installations; keep their coverage aligned.
- E2e Node consumers compile the retained fixtures in `tests/types/` against installed Axios, with TypeScript 4.9 (CJS), TypeScript 5.x (ESM and DOM-free checks), and Node 20 definitions. They also run compiled applications over real HTTP.
- Node.js 20 is the minimum supported v2 runtime. Installed-package ESM and CJS e2e suites cover Node 20 and newer configured majors until the ESM-only migration removes the transitional CommonJS surface.
- Source-browser tests replace globals such as XHR; restore globals and reset spies in cleanup hooks. Packaged e2e tests use real transports.

## Security-Sensitive Code

- For config reads that affect behavior, do not use prototype-walking reads (`in`, destructuring, or direct `config.foo` on untrusted config); guard with own-property checks as in `utils.hasOwnProp` / local `own()` helpers.
- New merge or object materialization code must continue filtering `__proto__`, `constructor`, and `prototype`; regressions here are security bugs.
- Changes touching URL construction, redirects, proxy/env handling, XSRF, socket paths, decompression limits, or adapters should consult `THREATMODEL.md` and add focused regression tests.
- Keep `withXSRFToken` cross-origin behavior explicit: only `true` forces cross-origin XSRF header attachment.
- Do not weaken `beforeRedirect`, proxy, or `socketPath` safeguards without tests covering credential leakage or SSRF-style cases.
