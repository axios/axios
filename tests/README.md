# Test Contribution Guide

This guide explains how to contribute tests inside the `tests` directory.
It is intentionally scoped to this directory only.

## Tests Directory Layout

```text
tests/
  browser/   # browser runtime tests
  setup/     # shared test setup utilities
  smoke/     # package-compat smoke suites (esm + cjs)
  unit/      # focused unit/behavior tests
```

Use the runtime-first layout already present in this directory:

- Put browser-runtime behavior in `tests/browser`.
- Put non-browser focused tests in `tests/unit`.
- Put packaging/compatibility smoke checks in `tests/smoke/esm/tests` and `tests/smoke/cjs/tests`.
- Reuse helpers from `tests/setup` instead of duplicating setup logic.

## File Naming Conventions

Follow the existing file patterns:

- Unit tests: `*.test.js`
- Browser tests: `*.browser.test.js`
- ESM smoke tests: `*.smoke.test.js`
- CJS smoke tests: `*.smoke.test.cjs`

When adding a new test, match the nearest existing file name pattern in the same subdirectory.

## Suite-Specific Authoring Patterns

### Unit (`tests/unit`)

- Keep tests focused on one behavior or API surface.
- For adapter/network behavior, prefer local test servers using utilities from `tests/setup/server.js`.
- Ensure server cleanup with `try/finally` so tests do not leak resources.
- Keep fixtures close to the tests that use them (see `tests/unit/adapters` for examples).

Representative files:

- `tests/unit/adapters/http.test.js`
- `tests/unit/adapters/fetch.test.js`
- `tests/unit/regression.test.js`

### Browser (`tests/browser`)

- Use local in-file `MockXMLHttpRequest` style mocks when testing request behavior.
- Replace global XHR in `beforeEach` and restore it in `afterEach`.
- Reset spies/mocks in cleanup hooks to keep tests isolated.
- Keep assertions centered on observable request/response behavior.

Representative files:

- `tests/browser/requests.browser.test.js`
- `tests/browser/adapter.browser.test.js`
- `tests/browser/defaults.browser.test.js`

### Smoke (`tests/smoke`)

- Keep ESM and CJS smoke coverage aligned for compatibility-sensitive behavior.
- If you add a new smoke scenario in one format, add the equivalent in the other format.
- Keep smoke tests small and focused on import/runtime behavior and critical request flows.

Representative files:

- `tests/smoke/esm/tests/fetch.smoke.test.js`
- `tests/smoke/cjs/tests/fetch.smoke.test.cjs`
- `tests/smoke/esm/tests/basic.smoke.test.js`
- `tests/smoke/cjs/tests/basic.smoke.test.cjs`

## Shared Setup Utilities (`tests/setup`)

Use shared helpers before introducing new setup code:

- `tests/setup/server.js`
  - Server lifecycle helpers: `startHTTPServer`, `stopHTTPServer`, `stopAllTrackedHTTPServers`
  - Timing helpers: `setTimeoutAsync`
  - Data/stream helpers used by adapter tests
- `tests/setup/browser.setup.js`
  - Browser cleanup hook (`afterEach`) for clearing test DOM state

General expectation: if a helper can be reused by multiple tests in this directory, add or extend it in `tests/setup` instead of copying setup code between test files.

## Fixtures and Test Data

- Prefer colocated fixtures near the test files that need them.
- Keep fixture names explicit and stable.
- For matrix-like scenarios, prefer concise table-driven cases inside the test file when practical.

Examples of colocated fixtures:

- `tests/unit/adapters/cert.pem`
- `tests/unit/adapters/key.pem`
- `tests/unit/adapters/axios.png`

## Contributor Checklist

Before opening a PR for tests in this directory:

- File is placed in the correct suite directory (`unit`, `browser`, or `smoke`).
- File name matches the local pattern (`*.test.js`, `*.browser.test.js`, `*.smoke.test.js`, `*.smoke.test.cjs`).
- Test setup/teardown is explicit and leaves no global/server state behind.
- Shared setup logic uses `tests/setup` helpers where possible.
- Smoke tests remain ESM/CJS consistent when behavior is format-sensitive.
- Fixtures are colocated and minimal.
- Assertions are deterministic and avoid unnecessary timing/network flakiness.
