# Architecture: Standards

## Sources of truth

`AGENTS.md` is the canonical contributor guide; `.github/copilot-instructions.md` points back to it. The private root manifest pins pnpm and forwards commands to workspaces. `packages/axios/package.json`, its Rolldown/Vitest configuration, shared ESLint configuration in `tooling/eslint`, consumer fixture manifests, and GitHub Actions define the executable workflow. `THREATMODEL.md` and `SECURITY.md` govern security-sensitive changes.

## Working commands

Run these commands from the repository root. Source and artifact scripts execute within `packages/axios`.

| Task                      | Command                                                            | Scope or prerequisite                                                                    |
| ------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Frozen workspace install  | `pnpm install --frozen-lockfile --ignore-scripts`                  | pnpm 10.34.7; install scripts stay disabled                                              |
| Build published artifacts | `pnpm run build`                                                   | Clears and regenerates `packages/axios/dist` with Rolldown                               |
| Validate artifacts        | `pnpm run test:build:artifacts`                                    | Build first                                                                              |
| Lint source               | `pnpm run lint`                                                    | Axios library source                                                                     |
| Focused lint              | `pnpm --filter axios exec eslint lib/path/to/file.js`              | Path is relative to the Axios package                                                    |
| Unit tests                | `pnpm run test:vitest:unit`                                        | `packages/axios/tests/unit`                                                              |
| Focused unit test         | `pnpm --filter axios run test:vitest:unit tests/unit/path.test.js` | Path is relative to the Axios package                                                    |
| Browser tests             | `pnpm run test:vitest:browser:headless`                            | Install browsers with `pnpm --filter axios exec playwright install`                      |
| Pack Axios                | `pnpm run pack:axios`                                              | Build first; writes the tarball to root `artifacts/`                                     |
| ESM module/type tests     | `pnpm run test:module:esm`                                         | Install the tarball into `tests/compatibility/module/esm` first                          |
| CJS module/type tests     | `pnpm run test:module:cjs`                                         | Install the tarball into `tests/compatibility/module/cjs` first                          |
| ESM smoke tests           | `pnpm run test:smoke:esm`                                          | Install the tarball into `tests/compatibility/smoke/esm` first                           |
| CJS smoke tests           | `pnpm run test:smoke:cjs`                                          | Install the tarball into `tests/compatibility/smoke/cjs` first                           |
| Bun smoke tests           | `pnpm run test:smoke:bun`                                          | Install the tarball with Bun in its independent fixture                                  |
| Deno smoke tests          | `pnpm run test:smoke:deno`                                         | Extract the tarball into `artifacts/package` and install Deno fixture dependencies first |
| Documentation development | `pnpm run docs:dev`                                                | Private `apps/docs` workspace                                                            |

See `AGENTS.md` for complete CJS, ESM, Bun, and Deno fixture setup. CJS/ESM fixtures use `--ignore-workspace` to install their tools, then add the packed package while retaining their committed lockfile. Restore fixture manifests and lockfiles after local validation. Consumer tests must exercise the installed artifact rather than workspace links.

## Enforced engineering rules

- Preserve user changes and keep edits focused. Never hand-edit `packages/axios/dist` or version-generated `packages/axios/lib/env/data.js`.
- Source uses ESM imports with explicit `.js` extensions. Match existing `'use strict';` usage.
- Use `packages/axios/lib/helpers/bind.js` rather than direct `Function.prototype.bind`.
- Do not mutate caller configuration during merging or transformation. Dispatch may update its safe merged snapshot during the request lifecycle.
- Detect platform capabilities rather than environment names.
- Use `AxiosError` for library failures, `AxiosError.from` for wrapped errors, and the shared validator for configuration options.
- Preserve both `CancelToken` and `AbortSignal` and remove listeners on settlement or cancellation.
- Keep public exports, ESM/CJS declarations, and their consumer tests aligned for public API changes.
- Use Conventional Commits and complete the contributor checklist before requesting review.

## Security and generated artifacts

Own-property checks protect behavior-affecting configuration reads. Object materialization must filter `__proto__`, `constructor`, and `prototype`. URL, redirect, proxy, socket, XSRF, decompression, and adapter changes require consulting `THREATMODEL.md` and adding regression coverage.

Both `.npmrc` and `pnpm-workspace.yaml` disable install scripts. Build, lint, and test tools still execute dependency code. Docs use pnpm's native Splide patch without a postinstall script and share the root workspace lockfile. Dependency updates require careful review and follow the maintainer/bot policy and seven-day version-update delay.

Rolldown generates browser ESM/UMD/CJS and Node CJS artifacts. Version preparation generates package-local metadata. The package owns its usage README, `CHANGELOG.md`, and `MIGRATION_GUIDE.md`; prerelease notes and deferred release documentation stay at the repository root.

## Compatibility and delivery

The published Axios runtime floor remains Node.js 20.0. Development follows Rolldown's Node 20.19 / 22.12 minimums. Installed-package CJS and ESM module/smoke suites cover Node 20, 22, 24, and 26 in CI, with additional Bun and Deno lanes. The ESM-only migration is separate work; this repository retains and tests both declaration and runtime module formats.

CI installs with scripts disabled, lints, builds, validates artifacts, runs unit/browser tests, packs Axios, and tests the installed artifact in independent consumer projects. Release preparation waits for module and smoke jobs. It targets `v2.x`, requires a major bump from v1, and checks that the resulting version remains on major 2. Publishing triggers on `v2.*.*` tags and uses npm staged publishing with provenance from `packages/axios`. Privileged jobs verify the pnpm download against a committed SHA-512 checksum before running it. The two-pass reproducibility monitor remains non-blocking.

The root version command with explicitly enabled release hooks is a maintainer operation: it bumps the package manifest, prepares metadata, builds, and stages the release files. Commits and tags remain explicit review steps.
