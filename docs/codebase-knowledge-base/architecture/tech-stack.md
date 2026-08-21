# Architecture: Tech stack

## Stack summary

Axios is a framework-free JavaScript/TypeScript-typed library. ESM source is bundled with Rollup and Babel into the current npm package's ESM, UMD, browser CommonJS, and Node CommonJS artifacts. Runtime I/O uses Node core HTTP/HTTPS/HTTP2 or browser-standard XHR/Fetch APIs. Vitest and Playwright cover source/browser behavior; separate installed-package suites cover module formats and runtimes. Public documentation is a separate VitePress/Vue project.

## Languages, runtimes, and frameworks

| Technology              | Version or constraint                                                                                 | Role                                               | Source of truth                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| JavaScript ESM          | ECMAScript 2018 lint target                                                                           | Runtime source                                     | `package.json:7`; `eslint.config.js:11-14`                                                                    |
| TypeScript declarations | Root TypeScript 5.9 tooling; ESM fixture TS 5.9; CJS fixture TS 4.9 with Node 20 definitions          | Public type surface and compile-time compatibility | `index.d.ts`; `index.d.cts`; `package.json`; `tests/module/esm/package.json`; `tests/module/cjs/package.json` |
| Node.js                 | Package and Node-based private packages require `>=20.0.0`; configured ESM and CJS CI: 20, 22, 24, 26 | Build/test runtime and Node HTTP transport         | `package.json:engines`; `.github/workflows/run-ci.yml`; `.github/workflows/release-branch.yml`                |
| Modern browsers         | Chromium, Firefox, WebKit in headless CI                                                              | XHR/Fetch runtime support                          | `vitest.config.js:28-43`; `README.md:517-524`                                                                 |
| Bun and Deno            | Workflow-provided current tool versions                                                               | Cross-runtime smoke compatibility                  | `.github/workflows/run-ci.yml:219-284`                                                                        |
| VitePress               | `^1.6.4`                                                                                              | Documentation site generator                       | `docs/package.json:17-26`                                                                                     |
| Vue                     | `^3.5.32`                                                                                             | Documentation site components                      | `docs/package.json:22-26`                                                                                     |

The v2 Node 20+ portion is implemented on PR #11161: package metadata, the Node bundle target, type fixtures, and workflow matrices agree on that minimum. ESM-only remains future work; this snapshot still publishes and tests CJS.

## Data, messaging, and storage

Axios has no database, durable message broker, cache service, or server-owned persistence. Request/response data exists in caller memory, platform request objects, buffers, blobs, and streams. Module-level state is limited to implementation caches/pools such as Fetch factory seeds, proxy tunneling agents, and HTTP/2 sessions. Consumers own persistence, retries, idempotency, authentication state, and application data consistency.

## Build, test, and development tooling

- Rollup 4 plus alias, Babel, CommonJS, JSON, node-resolve, terser, and bundle-size plugins builds distributable artifacts (`rollup.config.js`, `package.json:147-186`).
- Gulp clears `dist/` and manages version-generated data (`gulpfile.js`).
- ESLint 10 checks `lib/**/*.js`; Prettier 3 formats staged JavaScript, TypeScript, JSON, Markdown, and YAML.
- Vitest 4 runs Node unit and browser projects; Playwright provides Chromium, Firefox, and WebKit.
- Mocha 11.8 remains in the isolated CJS smoke/module compatibility fixtures and supports their Node 20–26 matrix; their cleanup path uses the Node 20+ `fs.rmSync` API.
- TypeScript module fixtures validate ESM and CJS against Node 20 definitions; the CJS fixture deliberately retains TypeScript 4.9 compatibility during the transition.
- Husky, lint-staged, and commitlint support local contribution workflow when explicitly rebuilt after a scripts-disabled install.
- The docs project has its own npm manifest/lockfile, VitePress build, Node test for search tokenization, sponsor-processing script, and `patch-package` postinstall.

## Runtime, infrastructure, and delivery

The npm package exports source ESM and generated bundles through conditional exports. Browser/React Native mappings replace Node-only adapter/platform modules. CI runs on GitHub Actions, builds and packs once, and installs the tarball into compatibility fixtures. npm publishing is triggered by v1 version tags, uses an environment gate, OIDC identity, and provenance attestation (`.github/workflows/publish.yml`).

The library itself does not deploy a service. Example and sandbox servers are local development tools. The documentation site has a build project in `docs/`; its hosting/deployment target is not established by the inspected source files.

## Observability and operations

There is no library-owned logging, metrics, tracing backend, dashboard, or runtime control plane. Operational signals exposed to callers are promise settlement, structured `AxiosError`, response metadata, upload/download progress, cancellation, and interceptor/custom-adapter hooks. Project operations are observed through GitHub Actions checks, bundle-size checks, lockfile validation, security scanning, and a currently non-blocking reproducible-build job.

## External platforms and integrations

| Platform or integration         | Purpose                                                        | Boundary or adapter              | Configuration source                               |
| ------------------------------- | -------------------------------------------------------------- | -------------------------------- | -------------------------------------------------- |
| Node `http`/`https`/`http2`     | Server-side HTTP I/O                                           | `lib/adapters/http.js`           | Axios request config and process proxy environment |
| XMLHttpRequest                  | Browser request transport and progress                         | `lib/adapters/xhr.js`            | Axios request config and browser capabilities      |
| Fetch/Request/Response          | Browser, worker, Node, Bun, Deno, and injected fetch transport | `lib/adapters/fetch.js`          | `config.env`, `fetchOptions`, globals              |
| `follow-redirects`              | HTTP/1 redirect-following transport                            | Node HTTP adapter                | `maxRedirects`, redirect hooks and headers         |
| `form-data`                     | Node multipart body support                                    | Node platform/default transforms | `env.FormData`, form serializer options            |
| `https-proxy-agent`             | HTTPS proxy tunneling                                          | Node HTTP adapter                | Explicit/environment proxy and agent settings      |
| `proxy-from-env`                | Conventional proxy environment lookup                          | Node HTTP adapter                | `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY` variants   |
| npm registry                    | Package distribution                                           | GitHub publish workflow          | version tags and npm environment                   |
| GitHub Actions                  | CI, release, dependency, and security automation               | `.github/workflows/`             | Workflow YAML and repository environments          |
| Open Collective/GitHub Sponsors | Community funding                                              | Repository/docs metadata         | `.github/FUNDING.yml`, sponsor data/docs           |

## Evidence and gaps

| Claim or area              | Evidence                                                                                                     | Confidence                    | Gap or conflict                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------ |
| Runtime dependencies       | `package.json:141-145`                                                                                       | Confirmed: four               | `THREATMODEL.md:393-397` says three while naming four                    |
| Package outputs            | `package.json:5-67,106-121`; `rollup.config.js:83-140`                                                       | Confirmed                     | Future v2 ESM-only output is not implemented; CJS/UMD remain intentional |
| Runtime matrices and floor | `package.json:engines`; `.github/workflows/run-ci.yml`; `.github/workflows/release-branch.yml`; PR #11161 CI | Confirmed and matrix-verified | Corrected CJS/ESM module and smoke lanes pass on Node 20/22/24/26        |
| Documentation stack        | `docs/package.json`; `docs/.vitepress/`                                                                      | Confirmed                     | Hosting/deployment path was not evidenced                                |
| Persistence/operations     | Source inventory and adapter architecture                                                                    | Confirmed absent from library | Consumer infrastructure is intentionally out of scope                    |
