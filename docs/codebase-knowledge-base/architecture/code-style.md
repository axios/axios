# Architecture: Code style

## Automated sources of truth

- `.prettierrc` defines two-space indentation, semicolons, single quotes, ES5 trailing commas, and a 100-column print width.
- `eslint.config.js` applies recommended ESLint rules to `lib/**/*.js` as ECMAScript 2018 modules and defines environment-specific globals for shared, Node-only, and browser-only files.
- `package.json:188-202` configures Conventional Commit validation and staged Prettier formatting.
- Existing adjacent source remains the deciding guide where automation does not express an idiom.

## Naming and organization

- Classes use PascalCase: `Axios`, `AxiosError`, `AxiosHeaders`, `InterceptorManager`.
- Functions and methods use camelCase: `buildURL`, `mergeConfig`, `dispatchRequest`.
- Error-code constants use UPPER_SNAKE_CASE on `AxiosError`.
- Internal class state uses Symbol keys, such as `$internals` in `AxiosHeaders` and `InterceptorManager`, rather than new underscore-prefixed slots.
- Source folders express responsibility: domain lifecycle in `lib/core/`, I/O in `lib/adapters/`, generic helpers in `lib/helpers/`, cancellation in `lib/cancel/`, defaults in `lib/defaults/`, and runtime capabilities in `lib/platform/`.
- Tests are runtime-first and use `*.test.js`, `*.browser.test.js`, `*.smoke.test.*`, and `*.module.test.*` conventions under their respective suites.

## Language and type idioms

Runtime source is JavaScript ESM with explicit `.js` import extensions. JSDoc explains public/internal contracts where useful. Prefer plain functions and small classes over framework abstractions. Use `const` by default, local helper functions for repeated boundary logic, and null-prototype objects where untrusted keys or polluted prototypes are relevant.

Public TypeScript contracts live in `index.d.ts` and are mirrored for CommonJS in `index.d.cts` while that surface remains supported. Generics preserve response data, request data, headers, and params through configs, responses, errors, promises, and adapters. Use structural types deliberately: they must model runtime acceptance rather than merely sharing an incidental method or an options-object shape. Node-specific request-agent fields are currently typed as `any` in this snapshot (`index.d.ts:435-436`), so any future narrowing must be checked against the actual Node dispatch contract and third-party compatible agents.

## Imports and module boundaries

- Use relative ESM imports with `.js` extensions in source.
- Keep Axios request lifecycle logic out of `lib/helpers/`; helpers should be reusable and environment-neutral unless their path clearly says otherwise.
- Default source platform imports Node; browser/React Native behavior comes from build/package substitution, so do not add unconditional Node globals to shared paths.
- Avoid direct `Function.prototype.bind`; `lib/helpers/bind.js` forwards arbitrary arguments with `apply` and is part of the callable-instance behavior.
- Public deep imports are limited to the explicit safe/unsafe export map in `package.json`; adding or moving files can affect consumers even if the top-level API is unchanged.

## Errors, results, and control flow

- Throw `AxiosError` for Axios-originated failures, supplying message, code, config, request, and response whenever available.
- Wrap dependency/runtime failures with `AxiosError.from` to preserve a non-enumerable `cause` and Axios context.
- Validate config through `lib/helpers/validator.js` rather than ad hoc error paths.
- Normalize headers with `AxiosHeaders`; do not duplicate case-insensitive header logic.
- Promise chains are intentional. Request interceptor order depends on the transitional setting; response interceptors are FIFO.
- Safe config reads are a correctness rule: own/safe-property access prevents inherited values from changing network behavior.
- Cancellation code must be idempotent and remove event/token listeners on every completion path, including streams.

## Test style

- Put Node/source behavior in `tests/unit/` and real browser behavior in `tests/browser/`.
- Use `tests/setup/server.js` for local servers, bind ephemeral port `0`, and close resources in `try/finally` so Vitest does not hang.
- Package/import behavior requires a built and packed tarball plus the matching smoke or module suite; importing the source tree does not verify exports or generated bundles.
- Keep ESM/CJS coverage aligned for the current v1 package. When v2 actually removes CJS, remove or re-scope those suites as part of the same compatibility change.
- Browser tests that replace globals must restore them and reset spies in cleanup hooks.
- Security-sensitive changes need focused regression tests for the relevant boundary, not only broad happy-path coverage.

## Representative examples

| Practice | Representative source | Notes |
| --- | --- | --- |
| Explicit ESM imports and class naming | `lib/core/Axios.js:1-23` | Typical source module shape |
| Symbol-backed internals | `lib/core/InterceptorManager.js:5,46-55` | Avoids new public-looking underscore slots |
| Safe config reads | `lib/helpers/resolveConfig.js:25-40` | Local `own()` protects behavior from prototype pollution |
| Hardened object materialization | `lib/core/mergeConfig.js:33-46,152-159` | Null-prototype target plus unsafe-key filtering |
| Standard error wrapping | `lib/core/AxiosError.js:98-130` | Preserves cause and context |
| Case-insensitive headers | `lib/core/AxiosHeaders.js:198-388` | Canonical header value object |
| Callable instance binding | `lib/axios.js:28-43`, `lib/helpers/bind.js` | Core public API pattern |
| Shared test server cleanup | `tests/setup/server.js:20-43,99-143` | Prevents leaked handles |

## Evidence and gaps

| Claim or area | Evidence | Confidence | Gap or conflict |
| --- | --- | --- | --- |
| Formatting | `.prettierrc`; `package.json:200-202` | Confirmed | Root format command is only configured through lint-staged |
| Lint scope | `eslint.config.js:4-58`; `package.json:137-138` | Confirmed | Tests/configs are not linted by the root script |
| Naming and error idioms | `AGENTS.md:47-59`; representative `lib/core/` files | Confirmed | None |
| Type synchronization | `AGENTS.md:27-31`; `package.json:12-17`; `index.d.ts`; `index.d.cts` | Confirmed for current package | CJS declarations are planned for removal in v2 but still active now |
| Test conventions | `AGENTS.md:93-99`; `tests/README.md`; `vitest.config.js` | Confirmed | Legacy CONTRIBUTING test prose is stale |
