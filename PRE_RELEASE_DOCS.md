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
