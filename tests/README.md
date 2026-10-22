# Packaged Axios end-to-end tests

This private workspace tests what an application installs. Existing unit, source-browser, and artifact tests remain under `packages/axios/tests/`.

## Run

Use the repository's pinned pnpm and supported development Node version. Install dependencies with `pnpm install --frozen-lockfile --ignore-scripts`, install Bun and Deno, and install browsers with `pnpm --filter @axios/e2e exec playwright install` (`--with-deps` also installs supported Linux system libraries).

```sh
pnpm run test:e2e          # fresh build, pack, isolated install, all runtimes
pnpm run test:e2e:node     # ESM/CJS, HTTP/Fetch, types and compiled applications
pnpm run test:e2e:browser  # Chromium, Firefox, WebKit
pnpm run test:e2e:bun      # actual Bun runner, ESM/CJS, HTTP/Fetch
pnpm run test:e2e:deno     # actual Deno runner, ESM/CJS, HTTP/Fetch
```

Every command builds and packs freshly by default. Missing runtimes fail; coverage is never silently skipped. Optional `AXIOS_E2E_NODE`, `AXIOS_E2E_BUN`, and `AXIOS_E2E_DENO` variables select executable paths for local runtime-matrix checks. They are not required with runtimes on `PATH`.

CI produces a single package artifact and checksum manifest. For explicit artifact reuse:

```sh
pnpm run test:e2e:pack
pnpm run test:e2e:node -- --artifact-dir artifacts/e2e
```

Artifact paths are repository-relative. The manifest selects one exact tarball and verifies its SHA-256; a changed archive fails before installation. The default commands never fall back to a previously generated tarball.

## Layout and isolation

- `run.mjs` builds/packs or verifies a CI artifact, installs it into a temporary consumer outside this repository using pnpm with install scripts disabled, runs the selected suites, and cleans up.
- `fixtures/service.mjs` provides real HTTP origins, HTTPS, HTTP/2, CORS, cookies, redirects, streamed responses, faults, multipart parsing, and a loopback-only forward/CONNECT proxy. `fixtures/tls/` contains public test-only credentials copied from the existing test fixture.
- `runtime/scenarios.mjs` defines shared user workflows. Native `node:test`, `bun:test`, and `Deno.test` entry points execute these inside the installed consumer; they import the bare `axios` package.
- `browser/app/` is a tiny consumer application built with Vite from its installed `axios` dependency. Playwright tests real user interactions and browser requests through XHR and Fetch, plus the installed classic-script UMD bundle.
- `types/` retains the useful declaration fixtures from the old module suites. The Node e2e command checks TypeScript 4.9 CJS, TypeScript 5.x ESM, DOM and Node-only fetch types, emitted declaration consumers, and compiled HTTP applications.
- `COVERAGE.md` records the migration and historical regression audit.

Axios is never a dependency of this workspace. The temporary consumer gets a regular package directory installed from the tarball, not a workspace link. Package-resolution tests assert its real path and version. Browser builds disable repository Vite configuration and resolve from that same isolated consumer. Do not import `packages/axios`, use source-test adapters, replace `fetch`/XHR/HTTP transports, or assert only a fabricated adapter response in e2e tests.

The local services replace remote applications, proxies, and failure conditions. No public test services or real credentials are needed. Requests under test use Axios; fixture-control requests may inspect the local server's records. Proxy forwarding is restricted to fixture destinations.

## Framework choice

Playwright supplies real Chromium, Firefox, and WebKit contexts, user actions, browser isolation, and failure traces. Its API request client would send requests itself, so it cannot establish Axios transport behavior. The native runtime runners execute the same Axios scenarios in actual Node, Bun, and Deno processes; no browser emulator substitutes for a server runtime.

Playwright runs on the browser job's Node host; it does not claim to run server code inside Bun or Deno. This also keeps browser-tooling Node requirements separate from the Node 20 runtime matrix.

References: [Playwright projects](https://playwright.dev/docs/test-projects), [API testing](https://playwright.dev/docs/api-testing), [Node test runner](https://nodejs.org/api/test.html), [Bun test runner](https://bun.sh/docs/test), and [Deno testing](https://docs.deno.com/runtime/test/).

## Adding scenarios

Use real observable requests, payloads, response headers, and resource cleanup. Add common behavior to the runtime scenario list, and browser-specific behavior to Playwright specs. Keep CJS/ESM scenarios aligned. Assert rejection explicitly so an unexpected resolution cannot pass. Restore mutated environment variables and destroy agents/streams in `finally` blocks.

Node-only agent, proxy, DNS, HTTP/2 and stream behavior belongs in the Node section. Bun and Deno still run HTTP and Fetch network tests. Fetch upload progress currently requires a Request implementation exposing the duplex capability used by Axios; HTTP upload progress and all runtimes' Fetch download progress are asserted. Add an explicit matrix expansion when a runtime gains another capability.

CI uses the same packed artifact for Node 20/22/24/26, Bun, Deno, and all three browsers. `release-branch.yml` waits for every e2e lane before preparing a release PR. Playwright reports and failure traces are uploaded from ignored `tests/results/`.
