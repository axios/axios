---
name: Rewrite helper tests
overview: Migrate coverage intent from legacy helper tests into the `tests/unit` Vitest suite, while keeping legacy files untouched and avoiding config/script changes.
todos:
  - id: map-legacy-to-vitest
    content: Create legacy-to-tests/unit parity checklist for all helper test files
    status: completed
  - id: port-missing-cases
    content: Port missing legacy assertions/edge cases into corresponding tests/unit files
    status: completed
  - id: normalize-vitest-style
    content: Align rewritten tests with current repository Vitest conventions
    status: completed
  - id: run-vitest-unit
    content: Run targeted and full unit Vitest tests to validate rewrite
    status: completed
  - id: verify-legacy-untouched
    content: Ensure test/unit/helpers files remain unchanged
    status: completed
isProject: false
---

# Rewrite Helper Tests To Vitest

## Scope And Constraints

- Keep legacy helper tests untouched in `[/Users/jay/Code/OpenSource/axiosV1/test/unit/helpers](file:///Users/jay/Code/OpenSource/axiosV1/test/unit/helpers)`.
- Rewrite/refresh the helper test coverage in `[/Users/jay/Code/OpenSource/axiosV1/tests/unit](file:///Users/jay/Code/OpenSource/axiosV1/tests/unit)` only.
- Make no changes to test config/scripts (Vitest already targets `tests/unit/**/*.test.js` in `[/Users/jay/Code/OpenSource/axiosV1/vitest.config.js](file:///Users/jay/Code/OpenSource/axiosV1/vitest.config.js)`).

## Implementation Plan

1. Build a case-by-case parity matrix from legacy helper files to Vitest files:

- `composeSignals` → `[/Users/jay/Code/OpenSource/axiosV1/tests/unit/composeSignals.test.js](file:///Users/jay/Code/OpenSource/axiosV1/tests/unit/composeSignals.test.js)`
- `estimateDataURLDecodedBytes` → `[/Users/jay/Code/OpenSource/axiosV1/tests/unit/estimateDataURLDecodedBytes.test.js](file:///Users/jay/Code/OpenSource/axiosV1/tests/unit/estimateDataURLDecodedBytes.test.js)`
- `fromDataURI` → `[/Users/jay/Code/OpenSource/axiosV1/tests/unit/fromDataURI.test.js](file:///Users/jay/Code/OpenSource/axiosV1/tests/unit/fromDataURI.test.js)`
- `parseProtocol` → `[/Users/jay/Code/OpenSource/axiosV1/tests/unit/parseProtocol.test.js](file:///Users/jay/Code/OpenSource/axiosV1/tests/unit/parseProtocol.test.js)`
- `toFormData` → `[/Users/jay/Code/OpenSource/axiosV1/tests/unit/toFormData.test.js](file:///Users/jay/Code/OpenSource/axiosV1/tests/unit/toFormData.test.js)`

1. For each mapped file, port any missing assertions/edge cases from legacy tests into the `tests/unit` version without changing runtime behavior under test.
2. Normalize each rewritten file to the repo’s current Vitest style:

- Use `vitest` imports (`describe`/`it` and hooks as needed).
- Keep assertion style aligned with existing repo convention (`assert`-based checks where already standard).
- Replace Mocha-only idioms (e.g., `this.skip`) with Vitest-compatible conditional patterns (`it.skip`/runtime guards).

1. Add brief, targeted comments only where logic is non-obvious (for example, environment-gated abort/controller coverage or React Native FormData spy behavior).
2. Run focused verification on just touched unit tests, then run the full unit Vitest project to ensure no regressions.

## Verification

- Run targeted files first (fast feedback): `npm run test:vitest:unit -- tests/unit/{composeSignals,estimateDataURLDecodedBytes,fromDataURI,parseProtocol,toFormData}.test.js`
- Run full unit suite: `npm run test:vitest:unit`
- Confirm legacy files remain unchanged in `[/Users/jay/Code/OpenSource/axiosV1/test/unit/helpers](file:///Users/jay/Code/OpenSource/axiosV1/test/unit/helpers)`.
