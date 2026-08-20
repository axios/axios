# Architecture: Standards

## Sources of truth

`AGENTS.md` is the canonical contributor guide; `.github/copilot-instructions.md` intentionally points back to it. Executable truth comes from `package.json`, `eslint.config.js`, `.prettierrc`, `vitest.config.js`, Rollup/Gulp configuration, package-specific test manifests, and GitHub Actions workflows. `THREATMODEL.md` and `SECURITY.md` govern security-sensitive work. `CONTRIBUTING.md` and `COLLABORATOR_GUIDE.md` add human workflow guidance, but stale command text must be checked against manifests and CI.

## Working commands

| Task                      | Command                                               | Defined or verified at                                   | Confidence or caveat                                                                     |
| ------------------------- | ----------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Reproducible root install | `npm ci`                                              | `AGENTS.md:7-14`, `.npmrc:1`                             | Confirmed; lifecycle scripts are disabled                                                |
| Build published artifacts | `npm run build`                                       | `package.json:118-120`, `rollup.config.js`               | Confirmed; clears and regenerates `dist/`                                                |
| Lint source               | `npm run lint`                                        | `package.json:137-138`, `eslint.config.js:4-58`          | Confirmed; only `lib/**/*.js` is covered                                                 |
| Focused lint              | `npx eslint lib/path/to/file.js`                      | `AGENTS.md:18-19`                                        | Confirmed                                                                                |
| Unit tests                | `npm run test:vitest:unit`                            | `package.json:122-127`, `vitest.config.js:8-14`          | Confirmed                                                                                |
| Focused unit test         | `npm run test:vitest:unit -- tests/unit/path.test.js` | `AGENTS.md:19`                                           | Confirmed                                                                                |
| Browser tests             | `npm run test:vitest:browser:headless`                | `package.json:125-126`, `vitest.config.js:28-43`         | Requires Playwright browsers first                                                       |
| ESM module/type tests     | `npm run test:module:esm`                             | `package.json:133`, `tests/module/esm/package.json:7-16` | Tests an installed packed artifact in normal release flow                                |
| CJS module/type tests     | `npm run test:module:cjs`                             | `package.json:136`, `tests/module/cjs/package.json`      | Transitional v2 compatibility surface; still required until the separate ESM-only change |
| ESM smoke tests           | `npm run test:smoke:esm:vitest`                       | `package.json:129`, `tests/smoke/esm/package.json:6-14`  | Install and test the tarball, not source                                                 |
| CJS smoke tests           | `npm run test:smoke:cjs:vitest`                       | `package.json:132`, `tests/smoke/cjs/package.json`       | Transitional v2 compatibility surface on Node 20+                                        |
| Documentation development | `npm run docs:dev`                                    | `package.json:134`, `docs/package.json:8-15`             | Runs the separate VitePress project                                                      |

## Enforced engineering rules

- Preserve user changes and make focused edits. Do not hand-edit `dist/` or version-generated `lib/env/data.js`.
- New source is ESM with explicit `.js` imports. Follow existing use of `'use strict';` rather than applying it indiscriminately.
- Use `lib/helpers/bind.js`, not direct `Function.prototype.bind`, to retain Axios argument-forwarding behavior.
- Do not mutate caller config during merges/transforms; return new normalized values. Dispatch may update its safe merged snapshot as part of the request lifecycle.
- Use capability checks instead of environment-name assumptions.
- Use `AxiosError` for Axios-originated failures and `AxiosError.from` for third-party failures; validate options through the shared validator.
- Preserve both `CancelToken` and `AbortSignal` until a major release removes the legacy surface, and always detach listeners on settlement/cancellation.
- Any public API change must keep runtime exports and active type surfaces synchronized and include tests at the appropriate source/package boundary.
- Use Conventional Commit messages. PRs require tests and green CI; semver classification and branch targeting are maintainer responsibilities.

## Error handling and observability

`lib/core/AxiosError.js` defines the error envelope, stable codes, wrapping behavior, `cause`, request/response/config context, status, serialization, and opt-in recursive config redaction. HTTP status settlement defaults to 2xx success and maps rejected 4xx responses to `ERR_BAD_REQUEST`, with other rejected statuses using `ERR_BAD_RESPONSE` (`lib/core/settle.js:14-26`). Timeouts may surface as `ECONNABORTED` or, under the transitional clarification flag, `ETIMEDOUT`.

Axios has no built-in logger, metrics collector, tracer, or retry engine. Consumers instrument it with interceptors, progress callbacks, custom adapters, and their own logging. Because live errors can retain credentials in config/request objects, callers should use `redact` for serialization and still treat the live error as sensitive.

## Configuration, secrets, and security

- Behavior-affecting config reads must not walk shared prototypes. Use `utils.hasOwnProp`, `utils.getSafeProp`, or a local `own()` helper.
- Materialization and merge paths must filter `__proto__`, `constructor`, and `prototype` and preserve the fail-closed terminal-prototype boundary.
- Caller code and caller-supplied hooks are trusted and run in-process. Network responses, redirects, and servers are untrusted.
- Applications must validate destinations. Axios cannot decide whether a URL, host, Unix socket, proxy, or redirect target is safe for a particular deployment.
- Cross-origin XSRF attachment requires `withXSRFToken === true`; generic truthy values do not bypass the same-origin check.
- Redirect logic must strip standard credentials and configured `sensitiveHeaders` when the origin changes.
- Keep `socketPath` restricted with `allowedSocketPaths` when config can be influenced externally.
- Root installs keep lifecycle scripts disabled. Runtime/development dependency changes require maintainer review, HTTPS/integrity-valid lockfile entries, and the established delay policy.
- Security reports use GitHub private advisories, not public issues. The disclosure backstop is 60 days, with documented exceptions and incident handling in `SECURITY.md`.

## Generated code, schemas, and migrations

`dist/` is generated by Rollup after Gulp clears the directory. `lib/env/data.js` is generated by the version task. Browser ESM/UMD/CJS and Node CJS outputs are current release artifacts, not source. This library has no database schema, durable data migration, or application deployment migration. API/runtime migrations are documented in `MIGRATION_GUIDE.md`, while release-owned notes use `CHANGELOG.md`.

Unreleased user-visible behavior belongs in `PRE_RELEASE_CHANGELOG.md`. Deferred README, docs-site, example, migration, and translation work belongs in `PRE_RELEASE_DOCS.md`; do not prematurely update release-owned documentation unless release preparation is the explicit task.

## Compatibility and delivery expectations

CI installs with scripts disabled, lints, builds, runs Node unit tests and Playwright browser tests, packs the npm tarball, and tests that installed artifact across ESM, CJS, Bun, and Deno. The dirty v2 snapshot configures both ESM and CJS module/smoke matrices for Node 20, 22, 24, and 26, and the published plus Node-based private manifests declare `engines.node: ">=20.0.0"` (`package.json:engines`, `.github/workflows/run-ci.yml`, `.github/workflows/release-branch.yml`).

The Node 20+ half of the v2 direction is implemented but not yet completion-gated: local package/build/module/smoke/browser/Bun checks passed, while Node 20/22/26 and Deno still need GitHub Actions evidence. Per the maintainer's repository-wide directive on 2026-08-20, Axios does not use E2E test plans; plan close-out uses the repository-native checks and CI/runtime evidence defined by the implementation plan. ESM-only is explicitly separate; CJS outputs and declarations remain configured and tested until that coordinated migration updates exports, declarations, build outputs, smoke/module suites, CI, documentation, and release process.

Publishing is tag-driven for v1 tags, runs in GitHub Actions with OIDC and npm provenance, and uses an environment gate. Build reproducibility has a two-pass monitor but is intentionally non-blocking at this snapshot.

## Exceptions and local conventions

- `CONTRIBUTING.md:29` says `npm run test` runs Jasmine and Mocha; the manifest and Vitest config are authoritative and show Vitest, plus separate Mocha-based CJS package suites.
- `CONTRIBUTING.md` generically requests immediate documentation updates, while `AGENTS.md` requires unreleased API changes to be recorded in pre-release staging files instead.
- Tests and configuration files are formatted by staged Prettier rules but are outside the root ESLint script's `lib/**/*.js` scope.
- Documentation has its own manifest, lockfile, dependencies, and `postinstall`; evaluate its commands separately from root-install assumptions.

## Evidence and gaps

| Claim or area         | Evidence                                                                                       | Confidence                                                    | Gap or conflict                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Contributor authority | `AGENTS.md:3-5`; `.github/copilot-instructions.md`                                             | Confirmed                                                     | None                                                                                |
| Build/test commands   | `package.json:118-139`; `vitest.config.js`; `.github/workflows/run-ci.yml`                     | Confirmed                                                     | `CONTRIBUTING.md` test description is stale                                         |
| Security process      | `THREATMODEL.md`; `SECURITY.md`; `.npmrc`; `.github/workflows/lockfile-lint.yml`               | Confirmed                                                     | Threat-model details contain several stale statements catalogued in `SUMMARY.md`    |
| Release delivery      | `.github/workflows/publish.yml`; `.github/workflows/release-branch.yml`                        | Confirmed                                                     | 0.x release mechanism is not documented; release-branch PR gating omits module jobs |
| v2 compatibility      | `docs/plans/001-node-20-runtime-baseline.md`; `package.json`; `rollup.config.js`; CI workflows | Node 20+ implemented in dirty source; ESM-only remains intent | Repository-native completion is blocked only on remaining CI runtime evidence       |
