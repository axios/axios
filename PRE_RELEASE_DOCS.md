# Pre-Release Documentation Notes

## Purpose

Track documentation updates that should be applied during release preparation.

Do not treat this file as final documentation. Each entry should give enough context for a maintainer or LLM to update README, docs pages, examples, migration guides, and translated docs when the release is prepared.

Do not store raw diffs or line-number-only instructions here; prefer stable section names, target files, required concepts, examples, and release-specific notes.

## Entry Format

- **Change:** Short feature/fix name.
- **Source:** PR, issue, or changelog reference.
- **Status:** Pending | Applied | Skipped.
- **Docs targets:** Files or docs sections likely needing updates.
- **Required content:** What the docs must explain.
- **Examples:** Any code snippets or examples that should be included.
- **Notes:** Constraints, release-only wording, translation follow-up, etc.

## Unreleased

### Synchronous request interceptor error handling

- **Change:** Document how synchronous request interceptor errors are handled without changing the existing paired-handler contract.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, #11071.
- **Status:** Pending.
- **Docs targets:** `README.md` Interceptors section; interceptor API reference; migration/upgrade notes; translated docs after the English documentation is finalized.
- **Required content:** Explain that when a synchronous request interceptor throws, axios calls that interceptor's paired `onRejected` handler and stops running the remaining request interceptors. If the handler returns normally, including returning `undefined` or a fulfilled Promise, axios treats the error as handled and dispatches with the last valid config; a value returned by the handler does not replace that config. If there is no rejection handler, or the handler throws or returns a rejected Promise, axios does not dispatch the request. Terminal errors continue through response rejection interceptors.
- **Examples:** Show a synchronous validation interceptor whose rejection handler returns `Promise.reject(error)` to block dispatch, and a logging-only rejection handler that returns normally to preserve the existing request-continuation behavior.
- **Notes:** This deliberately preserves axios's synchronous paired-handler semantics rather than changing them to native `Promise.then(onFulfilled, onRejected)` sibling-handler semantics.

### Malformed `http(s):` URL rejection

- **Change:** Document that axios rejects `http:`/`https:` URLs that omit `//` after the protocol, and that the error now names the offending URL.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, #11000 (rejection) and #11008 (improved message).
- **Status:** Pending.
- **Docs targets:** `README.md` errors / handling-errors section; migration/upgrade notes; `docs/pages/advanced/request-config.md` `url`/`baseURL` description; translated docs after English docs are finalized.
- **Required content:** Explain that since this release a request `url` or `baseURL` of the form `https:example.com` or `https:/example.com` (scheme present, `//` missing) is rejected with an `AxiosError` whose code is `ERR_INVALID_URL`, instead of being silently normalized by the browser/Node URL parser. This is a security fix preventing `baseURL`/allowlist (SSRF) bypasses. Callers must pass a well-formed URL such as `https://example.com`. The error message now includes the offending URL: `Invalid URL "https:example.com": missing "//" after protocol`. The reported URL is the control-character-normalized form with userinfo (credentials), query parameter values, and fragment contents redacted (parameter names, host and path are preserved), because `AxiosError.message` is always serialized by `toJSON()` and the opt-in `config.redact` model cannot clean it.
- **Examples:** None required.
- **Notes:** Frame as a behavior change for upgraders; the previous lenient normalization is intentionally removed. Mention that the reported URL redacts credentials, query parameter values, and fragment contents while keeping the scheme, host, path and parameter names so the request stays identifiable.

### Symbol-keyed custom request config

- **Change:** Document that custom request config fields can use own enumerable symbol keys and survive axios config merging.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, #11043, closes #11042.
- **Status:** Pending.
- **Docs targets:** TypeScript/custom client docs; request config reference; interceptor examples if custom config fields are documented there; translated docs after English docs are finalized.
- **Required content:** Explain that applications can module-augment `AxiosRequestConfig` with a specific symbol key and pass that symbol-keyed option in request config; axios preserves the own enumerable symbol property when merging defaults with request config so request interceptors and adapters can read it from `InternalAxiosRequestConfig`.
- **Examples:** Include a short TypeScript example with `export const someFlag = Symbol('some flag used in request interceptor')`, `declare module 'axios' { interface AxiosRequestConfig { [someFlag]?: boolean } }`, and a request interceptor reading `config[someFlag]`.
- **Notes:** Mention enumerable own symbol properties only; non-enumerable symbol properties and inherited properties are not copied by config merging.

### FormData literal key parsing

- **Change:** Document that `formToJSON`/`formDataToJSON` only split FormData field names on dot notation and bracket notation.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, #11006, closes #5402.
- **Status:** Pending.
- **Docs targets:** `README.md` FormData serializer/formToJSON sections; `docs/pages/advanced/api-reference.md` `formToJSON`; generated docs pages for multipart/urlencoded form serialization; translated docs after English docs are finalized.
- **Required content:** Explain that `.`, `[`, and `]` are structural path separators when converting FormData back to JSON, while other characters such as `-`, spaces, `+`, `*`, and `&` remain literal key characters. Mention that `foo[bar]`, `foo.bar`, and `foo[]` continue to create nested object/array paths.
- **Examples:** Include a short example showing `form.append('user-name', 'johndoe')` converting to `{ 'user-name': 'johndoe' }`, and `form.append('user.name', 'john')` or `form.append('user[name]', 'john')` converting to `{ user: { name: 'john' } }`.
- **Notes:** This is release-preparation tracking for a bug fix; avoid presenting the old hyphen/space splitting behavior as supported.
