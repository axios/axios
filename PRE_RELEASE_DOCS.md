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

### Interceptor handlers replaced with a nullish value

- **Change:** Document that interceptor IDs are opaque and that `interceptors.request.handlers` / `interceptors.response.handlers` is internal state, alongside the restored tolerance for a nullish handlers array.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, closes #11114.
- **Status:** Pending.
- **Docs targets:** `README.md` Interceptors section; interceptor API reference; translated docs after the English documentation is finalized.
- **Required content:** Explain that the value returned by `use()` is an opaque interceptor ID that must be passed back to `eject()` unchanged, and that it is not an index into the handlers array. State that `handlers` is internal bookkeeping rather than a supported API: replacing it with a nullish value makes axios skip that interceptor chain instead of throwing, but registering new interceptors afterwards requires restoring an array. Note that `eject()` with an unknown ID, or with the same ID twice, is a no-op.
- **Examples:** None required; the existing `eject(myInterceptor)` snippet already covers the supported flow.
- **Notes:** Index-like string IDs continue to work for `eject()` for backward compatibility, but the documentation should not present them as supported. Nothing here changes the documented interceptor execution order.

### RFC 9110 HTTP status code names

- **Change:** Document the additive RFC 9110 names for HTTP statuses 413 and 422.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Features, #11082, closes #11066.
- **Status:** Pending.
- **Docs targets:** `README.md` and `docs/pages/advanced/api-reference.md` `HttpStatusCode` guidance; migration or upgrade notes; translated docs after the English documentation is finalized.
- **Required content:** Introduce `HttpStatusCode.ContentTooLarge` for 413 and `HttpStatusCode.UnprocessableContent` for 422 as the preferred RFC 9110 names. Explain that `PayloadTooLarge` and `UnprocessableEntity` remain available as deprecated aliases throughout v1.x, and that numeric reverse lookups continue returning those legacy names for backward compatibility.
- **Examples:** Show forward comparisons using `HttpStatusCode.ContentTooLarge` and `HttpStatusCode.UnprocessableContent`.
- **Notes:** Removing the deprecated aliases or changing the numeric reverse-lookup strings is reserved for a future major release. Keep ESM and CommonJS examples aligned and update translated documentation after the English wording is finalized.

### Typed request params

- **Change:** Document the additive request-params generic across axios's public TypeScript declarations.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Features, #11081, closes #4954.
- **Status:** Applied.
- **Docs targets:** TypeScript usage guidance; request config reference for `params` and `paramsSerializer`; API reference for request methods, `AxiosResponse`, `AxiosPromise`, `AxiosError`, `CanceledError`, `isCancel`, and adapters; cancellation guidance; translated docs after the English documentation is finalized.
- **Required content:** Explain that `AxiosRequestConfig<D = any, P = any>` uses `D` for request data and `P` for query params, and that custom params serializers receive the same `P`. Cover propagation through `RawAxiosRequestConfig`, `InternalAxiosRequestConfig`, defaults, default response shapes, `AxiosResponse`, `AxiosPromise<T, D, P>`, `AxiosError`, `CanceledError`, the `isCancel<T, D, P>` type guard, request aliases, `request()`, callable instances, adapters, and `mergeConfig()`. State that default request results and explicitly typed `AxiosPromise` values preserve `D` and `P` on `response.config.data` and `response.config.params`, including when request methods infer those types from request config. Note that request methods add `P` as the final generic so the existing `T`, custom response `R`, and `D` positions remain unchanged, and explicitly supplied custom response types continue to control the resolved value.
- **Examples:** Show a `SearchParams` interface used with `AxiosRequestConfig<RequestBody, SearchParams>`, including a serializer callback that receives `SearchParams`, an invalid params object rejected by TypeScript, and an inferred default response whose `response.config.params` remains `SearchParams`. Include an `AxiosPromise<ResponseBody, RequestBody, SearchParams>` adapter/promise example and cancellation narrowing from `unknown` with `isCancel<ResponseBody, RequestBody, SearchParams>()`, demonstrating that both preserve request data and params on the config.
- **Notes:** README, English docs, and Spanish, French, and Chinese translations now cover the request-data and params generics, serializer typing, default response propagation, promises/adapters, error and cancellation narrowing, request method order, and config merging. The `any` default is documented for backward compatibility; the internal default-response marker remains undocumented.

### Synchronous request interceptor error handling

- **Change:** Document how synchronous request interceptor errors are handled without changing the existing paired-handler contract.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, #11071.
- **Status:** Applied.
- **Docs targets:** `README.md` Interceptors section; interceptor API reference; migration/upgrade notes; translated docs after the English documentation is finalized.
- **Required content:** Explain that when a synchronous request interceptor throws, axios calls that interceptor's paired `onRejected` handler and stops running the remaining request interceptors. If the handler returns normally, including returning `undefined` or a fulfilled Promise, axios treats the error as handled and dispatches with the last valid config; a value returned by the handler does not replace that config. If there is no rejection handler, or the handler throws or returns a rejected Promise, axios does not dispatch the request. Terminal errors continue through response rejection interceptors.
- **Examples:** Show a synchronous validation interceptor whose rejection handler returns `Promise.reject(error)` to block dispatch, and a logging-only rejection handler that returns normally to preserve the existing request-continuation behavior.
- **Notes:** README, interceptor docs, upgrade guidance, and Spanish, French, and Chinese translations now document blocking and continuation examples while preserving axios's synchronous paired-handler semantics.

### Opt-in AxiosHeaders parameter parsing

- **Change:** Document the additive `AxiosHeaders.parseParameters()` parser for normalized HTTP parameter values.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Features, #11051, closes #11050.
- **Status:** Applied.
- **Docs targets:** `README.md` `AxiosHeaders#get` section; `docs/pages/advanced/api-reference.md` and `docs/pages/advanced/header-methods.md`; translated docs after English docs are finalized.
- **Required content:** Explain that callers can pass `AxiosHeaders.parseParameters` to `AxiosHeaders#get()` to produce a null-prototype map with case-insensitive parameter names, remove surrounding quoted-string delimiters, decode quoted-pair DQUOTE/backslash escapes, keep commas and semicolons inside quoted values, and remove only RFC optional whitespace around unquoted values. Note that unsafe object-materialization keys (`__proto__`, `constructor`, and `prototype`) are omitted. State explicitly that `get(name, true)` remains the legacy tokenizer and keeps its existing output for backward compatibility.
- **Examples:** Show `headers.get('content-type', AxiosHeaders.parseParameters)` returning `{ boundary: 'a,b' }` for `multipart/form-data; boundary="a,b"`.
- **Notes:** README, API/header-method docs, and Spanish, French, and Chinese translations now document the additive parser, its hardened output, quoted-value behavior, and the unchanged legacy `true` tokenizer.

### Malformed `http(s):` URL rejection

- **Change:** Document that axios rejects `http:`/`https:` URLs that omit `//` after the protocol, and that the error now names the offending URL.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, #11000 (rejection) and #11008 (improved message).
- **Status:** Applied.
- **Docs targets:** `README.md` errors / handling-errors section; migration/upgrade notes; `docs/pages/advanced/request-config.md` `url`/`baseURL` description; translated docs after English docs are finalized.
- **Required content:** Explain that since this release a request `url` or `baseURL` of the form `https:example.com` or `https:/example.com` (scheme present, `//` missing) is rejected with an `AxiosError` whose code is `ERR_INVALID_URL`, instead of being silently normalized by the browser/Node URL parser. This is a security fix preventing `baseURL`/allowlist (SSRF) bypasses. Callers must pass a well-formed URL such as `https://example.com`. The error message now includes the offending URL: `Invalid URL "https:example.com": missing "//" after protocol`. The reported URL is the control-character-normalized form with userinfo (credentials), query parameter values, and fragment contents redacted (parameter names, host and path are preserved), because `AxiosError.message` is always serialized by `toJSON()` and the opt-in `config.redact` model cannot clean it.
- **Examples:** None required.
- **Notes:** README, request-config, error-handling, upgrade guidance, and Spanish, French, and Chinese translations now frame the rejection as an intentional security behavior change and describe the safely redacted error message.

### Symbol-keyed custom request config

- **Change:** Document that custom request config fields can use own enumerable symbol keys and survive axios config merging.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, #11043, closes #11042.
- **Status:** Applied.
- **Docs targets:** TypeScript/custom client docs; request config reference; interceptor examples if custom config fields are documented there; translated docs after English docs are finalized.
- **Required content:** Explain that applications can module-augment `AxiosRequestConfig` with a specific symbol key and pass that symbol-keyed option in request config; axios preserves the own enumerable symbol property when merging defaults with request config so request interceptors and adapters can read it from `InternalAxiosRequestConfig`.
- **Examples:** Include a short TypeScript example with `export const someFlag = Symbol('some flag used in request interceptor')`, `declare module 'axios' { interface AxiosRequestConfig { [someFlag]?: boolean } }`, and a request interceptor reading `config[someFlag]`.
- **Notes:** README, TypeScript/request-config docs, and Spanish, French, and Chinese translations now show module augmentation and an interceptor example, limited explicitly to own enumerable symbol properties.

### FormData literal key parsing

- **Change:** Document that `formToJSON`/`formDataToJSON` only split FormData field names on dot notation and bracket notation.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, #11006, closes #5402.
- **Status:** Applied.
- **Docs targets:** `README.md` FormData serializer/formToJSON sections; `docs/pages/advanced/api-reference.md` `formToJSON`; generated docs pages for multipart/urlencoded form serialization; translated docs after English docs are finalized.
- **Required content:** Explain that `.`, `[`, and `]` are structural path separators when converting FormData back to JSON, while other characters such as `-`, spaces, `+`, `*`, and `&` remain literal key characters. Mention that `foo[bar]`, `foo.bar`, and `foo[]` continue to create nested object/array paths.
- **Examples:** Include a short example showing `form.append('user-name', 'johndoe')` converting to `{ 'user-name': 'johndoe' }`, and `form.append('user.name', 'john')` or `form.append('user[name]', 'john')` converting to `{ user: { name: 'john' } }`.
- **Notes:** README, API/multipart/HTML-form docs, and Spanish, French, and Chinese translations now document dot/bracket path parsing and literal punctuation keys without presenting the previous splitting behavior as supported.
