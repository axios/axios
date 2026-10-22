# Test Contribution Guide

This guide covers Axios source tests and independent packed-package consumer suites.

## Tests Directory Layout

```text
packages/axios/tests/
  browser/   # browser runtime tests
  build/     # generated artifact contracts
  setup/     # shared source-test helpers
  unit/      # focused unit and behavior tests

tests/compatibility/
  module/    # packed CJS/ESM imports and TypeScript declarations
  setup/     # consumer-test helpers
  smoke/     # packed CJS/ESM, Bun, and Deno behavior
```

- Put browser behavior in `packages/axios/tests/browser` and Node behavior in `packages/axios/tests/unit`.
- Put generated artifact checks in `packages/axios/tests/build`.
- Put packed consumer tests in `tests/compatibility/smoke` or `tests/compatibility/module`.
- Reuse source-test helpers from `packages/axios/tests/setup` and keep consumer helpers independent of library source.
- Run `pnpm run test:vitest:unit`, `pnpm run test:vitest:browser:headless`, or the matching `pnpm run test:smoke:cjs` / `pnpm run test:smoke:esm` command from the root. Consumer fixtures must install the tarball first; see [AGENTS.md](../AGENTS.md#monorepo-layout) for CJS, ESM, Bun, and Deno setup.

## File Naming Conventions

Follow the existing file patterns:

- Unit tests: `*.test.js`
- Browser tests: `*.browser.test.js`
- ESM smoke tests: `*.smoke.test.js`
- CJS smoke tests: `*.smoke.test.cjs`

When adding a new test, match the nearest existing file name pattern in the same subdirectory.

## Suite-Specific Authoring Patterns

### Unit (`packages/axios/tests/unit`)

- Keep tests focused on one behavior or API surface.
- For adapter/network behavior, prefer local test servers using utilities from `packages/axios/tests/setup/server.js`.
- Ensure server cleanup with `try/finally` so tests do not leak resources.
- Keep fixtures close to the tests that use them (see `packages/axios/tests/unit/adapters` for examples).

Representative files:

- `packages/axios/tests/unit/adapters/http.test.js`
- `packages/axios/tests/unit/adapters/fetch.test.js`
- `packages/axios/tests/unit/axios.test.js`

### Browser (`packages/axios/tests/browser`)

- Use local in-file `MockXMLHttpRequest` style mocks when testing request behavior.
- Replace global XHR in `beforeEach` and restore it in `afterEach`.
- Reset spies/mocks in cleanup hooks to keep tests isolated.
- Keep assertions centered on observable request/response behavior.

Representative files:

- `packages/axios/tests/browser/requests.browser.test.js`
- `packages/axios/tests/browser/adapter.browser.test.js`
- `packages/axios/tests/browser/defaults.browser.test.js`

### Smoke (`tests/compatibility/smoke`)

- Keep ESM and CJS smoke coverage aligned for compatibility-sensitive behavior.
- If you add a new smoke scenario in one format, add the equivalent in the other format.
- Keep smoke tests small and focused on import/runtime behavior and critical request flows.

Representative files:

- `tests/compatibility/smoke/esm/tests/fetch.smoke.test.js`
- `tests/compatibility/smoke/cjs/tests/fetch.smoke.test.cjs`
- `tests/compatibility/smoke/esm/tests/basic.smoke.test.js`
- `tests/compatibility/smoke/cjs/tests/basic.smoke.test.cjs`

## Shared Setup Utilities (`packages/axios/tests/setup`)

Use shared helpers before introducing new setup code:

- `packages/axios/tests/setup/server.js`
  - Server lifecycle helpers: `startHTTPServer`, `stopHTTPServer`, `stopAllTrackedHTTPServers`
  - Timing helpers: `setTimeoutAsync`
  - Data/stream helpers used by adapter tests
- `packages/axios/tests/setup/browser.setup.js`
  - Browser cleanup hook (`afterEach`) for clearing test DOM state

General expectation: if a helper can be reused by multiple tests in this directory, add or extend it in `packages/axios/tests/setup` instead of copying setup code between test files.

## Fixtures and Test Data

- Prefer colocated fixtures near the test files that need them.
- Keep fixture names explicit and stable.
- For matrix-like scenarios, prefer concise table-driven cases inside the test file when practical.

Examples of colocated fixtures:

- `packages/axios/tests/unit/adapters/cert.pem`
- `packages/axios/tests/unit/adapters/key.pem`
- `packages/axios/tests/unit/adapters/axios.png`

## Contributor Checklist

Before opening a PR for tests in this directory:

- File is placed in the correct package or consumer suite (`unit`, `browser`, `build`, `module`, or `smoke`).
- File name matches the local pattern (`*.test.js`, `*.browser.test.js`, `*.smoke.test.js`, `*.smoke.test.cjs`).
- Test setup/teardown is explicit and leaves no global/server state behind.
- Shared setup logic uses `packages/axios/tests/setup` helpers where possible.
- Smoke tests remain ESM/CJS consistent when behavior is format-sensitive.
- Fixtures are colocated and minimal.
- Assertions are deterministic and avoid unnecessary timing/network flakiness.
