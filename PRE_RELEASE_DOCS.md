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

### Async `transformRequest` callbacks

- **Change:** Request body transformers may return promises, which Axios resolves in order before sending the request.
- **Source:** [Issue #10713](https://github.com/axios/axios/issues/10713).
- **Status:** Pending.
- **Docs targets:** `README.md` Request Config `transformRequest` and the English, Spanish, French, and Chinese `docs/pages/advanced/request-config.md` sections.
- **Required content:** Clarify that only request transformers may return a Promise; the next request transformer receives the resolved value, and the adapter starts after all transforms complete. Rejected transformations prevent the request from being sent. Existing synchronous callbacks remain synchronous; `transformResponse` behavior is unchanged. Requests cancelled through `AbortSignal` or `CancelToken` while an asynchronous transformer is running reject promptly with `ERR_CANCELED`, without waiting for the transformer to finish. A positive `timeout` also limits this transformation stage using Axios's usual `ECONNABORTED` or `ETIMEDOUT` (with `transitional.clarifyTimeoutError`) error and the configured timeout message. A monotonic deadline is checked before queued transformations and adapter dispatch, including when a blocking transformer delays the timeout callback. Later transformers and the adapter are skipped after cancellation or a timeout; the underlying transformer itself may still continue, so pass cancellation into long-running transformers where possible. The adapter uses its existing timeout independently after successful transformations (not a single end-to-end request deadline).
- **Examples:** A per-request `async (data, headers) => { headers.set('X-Signature', await sign(data)); return data; }` transformer followed by `...axios.defaults.transformRequest` to preserve default serialization.
- **Notes:** TypeScript `AxiosRequestTransformer` already returns `any` in both ESM and CJS declarations, so no public type change is needed.

### Response duration clock

- **Change:** `response.duration` uses `performance.now()` instead of `Date.now()`.
- **Source:** [Issue #11407](https://github.com/axios/axios/issues/11407).
- **Status:** Pending.
- **Docs targets:** `docs/pages/advanced/response-schema.md` (Response duration) and the Spanish, French, and Chinese translations of that section; the README duration note tracked in the entry below.
- **Required content:** Replace the bullet saying the value is approximate wall-clock time measured with `Date.now()`. The value is now measured with the monotonic `performance.now()` and rounded to whole milliseconds, so system clock adjustments no longer affect it. Runtimes without `performance.now()` fall back to `Date.now()`, where backward clock adjustments are clamped to `0` and forward adjustments can inflate the value. Optionally note that this keeps axios compatible with Next.js Cache Components prerendering, which rejects `Date.now()`.
- **Notes:** The README entry below says "approximate wall-clock time"; use the new wording when applying it.

### `getAdapter` request config argument

- **Change:** The `getAdapter` typings accept an optional second `config` argument, which the runtime already forwards to adapter getters.
- **Source:** [Issue #11403](https://github.com/axios/axios/issues/11403), [PR #11404](https://github.com/axios/axios/pull/11404).
- **Status:** Pending.
- **Docs targets:** The `getAdapter` section of `docs/pages/advanced/api-reference.md` and its Spanish, French, and Chinese translations. Optionally cross-link from the custom `fetch` section of `docs/pages/advanced/fetch-adapter.md`.
- **Required content:** Update the signature to `getAdapter(adapters: AxiosAdapterConfig | AxiosAdapterConfig[] | undefined, config?: AxiosRequestConfig): AxiosAdapter`. The current docs signature (`string | string[]`) also omits `undefined` and adapter functions, which the typings have always accepted. Explain that `config` is passed to adapter getters: the built-in `fetch` adapter reads `env.fetch`, `env.Request`, and `env.Response` from it, and without `config` it uses the global implementations. For the built-in `fetch` adapter, other request fields are not used while resolving the adapter; they take effect when the returned adapter is called with a request config. Custom adapter getters may inspect any forwarded config field.
- **Examples:** `const fetchAdapter = getAdapter('fetch', { env: { fetch: customFetch } });`
- **Notes:** Passing a new `fetch` function on every call creates and caches a new adapter each time, so reuse the same `fetch` reference.

### Response duration (README)

- **Change:** Bring `README.md` in line with the released docs site.
- **Source:** [PR #11214](https://github.com/axios/axios/pull/11214); shipped in v1.21.0.
- **Status:** Pending (README only; the English, Spanish, French, and Chinese docs site was applied in [PR #11390](https://github.com/axios/axios/pull/11390)).
- **Docs targets:** `README.md` Response schema and Handling errors sections.
- **Required content:** Add `duration` to the response schema and a short note on reading `error.response.duration` after checking `axios.isAxiosError(error)` and `error.response`. Use the docs-site wording in `docs/pages/advanced/response-schema.md` (Response duration) and `docs/pages/advanced/error-handling.md` (Response duration on errors): timing covers adapter execution only, streamed responses stop when the stream is available, the value is approximate wall-clock time, and errors without a response have no duration.

### Asynchronous XSRF cookie reads in the XHR adapter (README)

- **Change:** Bring `README.md` in line with the released docs site.
- **Source:** PR #11166, issue #10826; shipped in v1.21.0.
- **Status:** Pending (README only; the English, Spanish, French, and Chinese docs site was applied in [PR #11390](https://github.com/axios/axios/pull/11390)).
- **Docs targets:** `README.md` Request config comments for `xsrfCookieName`, `xsrfHeaderName`, and `withXSRFToken`.
- **Required content:** Briefly note that the XHR adapter reads the XSRF cookie through `window.cookieStore` when available and falls back to `document.cookie`, with unchanged decoding, timeout, and cancellation behavior. Keep it scoped to XHR, as in `docs/pages/advanced/request-config.md` after the `withXSRFToken` warning.

### Opt-in UTF-8 Basic auth usernames (README)

- **Change:** Bring `README.md` in line with the released docs site.
- **Source:** [PR #11159](https://github.com/axios/axios/pull/11159); shipped in v1.21.0.
- **Status:** Pending (README only; the English, Spanish, French, and Chinese docs site was applied in [PR #11390](https://github.com/axios/axios/pull/11390)).
- **Docs targets:** `README.md` Request config `auth` comment and `transitional` options.
- **Required content:** Add `encodeBasicAuthUsername: false` to the `transitional` block with a comment, and mention it under `auth`. Follow `docs/pages/advanced/authentication.md` (UTF-8 usernames): defaults are unchanged, it applies to XHR/Fetch only, a request-level `false` overrides an instance opt-in, and manual pre-encoding must be removed when opting in.

### Global TLS options for CONNECT-tunneled origins (README)

- **Change:** Bring `README.md` in line with the released docs site.
- **Source:** PR #11178, related to #11176; shipped in v1.21.0.
- **Status:** Pending (README only; the English, Spanish, French, and Chinese docs site was applied in [PR #11390](https://github.com/axios/axios/pull/11390)).
- **Docs targets:** `README.md` Request config `proxy` comments.
- **Required content:** Note that HTTPS origins reached through a CONNECT proxy use `https.globalAgent` TLS options (such as a custom `ca`) when no `httpsAgent` is set, and that an explicit `httpsAgent` takes precedence. Follow the `proxy` section of `docs/pages/advanced/request-config.md`; do not recommend disabling certificate validation.

### Literal method-named request headers (README)

- **Change:** Bring `README.md` in line with the released docs site.
- **Source:** [PR #11156](https://github.com/axios/axios/pull/11156); shipped in v1.21.0 as a breaking change for custom-class header defaults.
- **Status:** Pending (README only; the English, Spanish, French, and Chinese docs site was applied in [PR #11390](https://github.com/axios/axios/pull/11390)).
- **Docs targets:** `README.md` Config Defaults / Global axios defaults and AxiosHeaders guidance.
- **Required content:** Explain that `headers.common` and lower-case method keys are defaults buckets only for plain objects, null-prototype objects, and `AxiosHeaders`, so literal headers such as `Link` are preserved. Include the migration from `headers: { post: customDefaults }` to `headers: { post: { ...customDefaults } }`. Follow `docs/pages/advanced/headers.md` (Headers named after HTTP methods), `docs/pages/advanced/config-defaults.md` (Method-specific header defaults), and the v1.21.0 upgrade-guide note.

### Interceptor IDs and nullish handler recovery (README)

- **Change:** Bring `README.md` in line with the released docs site.
- **Source:** PR #11139, #11114, and #11118; shipped in v1.21.0.
- **Status:** Pending (README only; the English, Spanish, French, and Chinese docs site was applied in [PR #11390](https://github.com/axios/axios/pull/11390)).
- **Docs targets:** `README.md` Interceptors section.
- **Required content:** State that the ID returned by `use()` is opaque and must be passed unchanged to `eject()`, recommend `eject()`/`clear()` over editing the handlers array, and note that unknown or stale IDs are no-ops. Follow the Removing Interceptors section of `docs/pages/advanced/interceptors.md`.

### RFC 9110 HTTP status code names (README)

- **Change:** Bring `README.md` in line with the released docs site.
- **Source:** #11082, closes #11066; shipped in v1.20.0.
- **Status:** Pending (README only; the English, Spanish, French, and Chinese docs site was applied in [PR #11390](https://github.com/axios/axios/pull/11390)).
- **Docs targets:** `README.md`, wherever `HttpStatusCode` is introduced (currently not documented; add a short mention near Handling errors or the API overview).
- **Required content:** `HttpStatusCode.ContentTooLarge` (413) and `HttpStatusCode.UnprocessableContent` (422) are preferred; `PayloadTooLarge` and `UnprocessableEntity` remain deprecated aliases throughout v1.x, and numeric reverse lookups keep the legacy names. Follow the `HttpStatusCode` section of `docs/pages/advanced/api-reference.md`.

### Streaming reads from download progress events (README)

- **Change:** Bring `README.md` in line with the released docs site.
- **Source:** #11121, closes #6796; shipped in v1.20.0.
- **Status:** Pending (README only; the English, Spanish, French, and Chinese docs site was applied in [PR #11390](https://github.com/axios/axios/pull/11390)).
- **Docs targets:** `README.md` Request config `onDownloadProgress` comment and Progress capturing section.
- **Required content:** Show reading new `responseText` through `progressEvent.event.target` (not `currentTarget`, which can be `null` for throttled deliveries), and note the final delivery on a successful XHR `loadend`. Follow the new final section of `docs/pages/advanced/progress-capturing.md`.

### Wrapped error stacks in `AxiosError` (README)

- **Change:** Bring `README.md` in line with the released docs site.
- **Source:** [PR #11142](https://github.com/axios/axios/pull/11142), related to [issue #6670](https://github.com/axios/axios/issues/6670); shipped in v1.21.0.
- **Status:** Pending (README only; the English, Spanish, French, and Chinese docs site was applied in [PR #11390](https://github.com/axios/axios/pull/11390)).
- **Docs targets:** `README.md` Handling errors section.
- **Required content:** Explain that wrapped errors append the original stack to `error.stack` after `Caused by:`, that `error.cause` remains the programmatic link, and that stacks are not redacted by `config.redact`. Do not present the marker as a parsing contract. Follow the Wrapped error stacks section of `docs/pages/advanced/error-handling.md`.
