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

### Response duration

- **Change:** Expose elapsed adapter time as the optional numeric `AxiosResponse.duration` property in milliseconds, including on `error.response` when present.
- **Source:** [PR #11214](https://github.com/axios/axios/pull/11214), related to [request/response timing #695](https://github.com/axios/axios/issues/695) and [feature suggestions #6984](https://github.com/axios/axios/issues/6984).
- **Status:** Pending.
- **Docs targets:** README response schema and error-handling examples; docs-site response schema and error handling; corresponding translations.
- **Required content:** Timing starts immediately before adapter invocation, after request interceptors and request transforms. It ends in the adapter's settlement handler, before response transforms and response interceptors. Buffered responses include body reception; HTTP/Fetch streaming responses measure only the time until the stream becomes available, and consuming or failing that stream later does not update the value. This is not a DNS/TCP/TLS/TTFB breakdown or server-processing time. It includes adapter work such as connection queuing and redirects. Errors without a response, including ordinary network errors, timeouts, and cancellations, have no duration. Strict JSON parsing failures retain the duration on their attached response.
- **Examples:** Show `const response = await axios.get('/users'); console.log(response.duration);`. For errors, guard with `axios.isAxiosError(error)` and `error.response` before reading `error.response.duration`; do not imply that every error has a response.
- **Notes:** Values use `Date.now()`, with two clock reads for a response receiving timing metadata. Backward clock adjustments clamp to zero; forward adjustments can inflate the value, so it is approximate wall-clock timing rather than a monotonic measurement. The field is enumerable and overwrites a custom adapter's existing `duration` property. Both declaration formats keep it optional for custom adapters and manually constructed responses. Semver impact is minor; no new option, dependency, or migration for built-in-adapter users. Apply published documentation only during release preparation.

### Stacked content codings in the Node HTTP adapter

- **Change:** The Node HTTP adapter decodes responses whose `Content-Encoding` lists several codings.
- **Source:** [PR #11336](https://github.com/axios/axios/pull/11336); `PRE_RELEASE_CHANGELOG.md` Bug Fixes, "Node HTTP adapter - stacked content codings".
- **Status:** Pending.
- **Docs targets:** README request-config section for `decompress` and `maxContentLength`; docs-site request config and the HTTP adapter's response-decompression notes; translated docs after the English text is final.
- **Required content:** When `decompress` is true (the default), a `Content-Encoding` that lists several codings, such as `gzip, br`, is decoded by undoing them from last to first (RFC 9110, section 8.4), and the header is then removed. Supported codings are `gzip`, `x-gzip`, `compress`, `x-compress`, `deflate`, plus `br` and `zstd` where the Node version supports them. Names are case-insensitive, whitespace around them is ignored, and `identity` entries are skipped. If any listed coding is unsupported, or more than five codings are listed, the body and the header are left as received, as for a single unknown coding today; the five-coding cap matches undici's fetch, which rejects such responses instead. `maxContentLength` applies to the fully decoded body, for buffered responses and for `responseType: 'stream'`, where exceeding it errors and destroys the stream. Set `decompress: false` to receive the bytes as sent.
- **Examples:** None required: no new option. If the README shows `decompress: false`, mention that it also keeps a multi-coding body as sent.
- **Notes:** Node HTTP adapter only. The fetch and XHR adapters rely on the runtime's own decoding and are unchanged. The cap limits the number of decoding stages, not the decoded size; `maxContentLength` is what bounds the decoded size. No API or type changes; semver impact is a bug fix.

### Asynchronous XSRF cookie reads in the XHR adapter

- **Change:** Document the XHR adapter's use of the Cookie Store API for XSRF token reads.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, XHR adapter cookie access; PR #11166 and issue #10826.
- **Status:** Pending.
- **Docs targets:** README and request-config guidance for `xsrfCookieName`, `xsrfHeaderName`, and `withXSRFToken`; browser support notes; translated docs after the English documentation is finalized.
- **Required content:** Explain that the XHR adapter automatically uses `window.cookieStore` when available to avoid synchronous `document.cookie` access while resolving an eligible XSRF token. Browsers without Cookie Store support retain the existing `document.cookie` behavior, and a failed Cookie Store read also falls back to that path. Both read paths preserve Axios's existing URI decoding (once), with malformed escape sequences left unchanged. Cookie lookup and the subsequent XHR share the configured timeout; both cancellation APIs also work during lookup, and late results cannot dispatch a canceled or expired request. The Fetch adapter and the public request-config surface are unchanged; no migration is required.
- **Examples:** None required because capability detection is automatic and adds no configuration.
- **Notes:** Keep the explanation scoped to XHR XSRF reads; do not imply that all cookie operations or the Fetch adapter use Cookie Store. Issue #10826 originally requested raw values; compatibility requires retaining Axios's existing decoding because Cookie Store does not percent-decode stored cookies.

### Opt-in UTF-8 Basic auth usernames

- **Change:** Added `transitional.encodeBasicAuthUsername`, a boolean defaulting to `false`, to opt into UTF-8 encoding of `auth.username` during XHR/Fetch config resolution.
- **Source:** [PR #11159](https://github.com/axios/axios/pull/11159); `PRE_RELEASE_CHANGELOG.md` Features.
- **Status:** Pending.
- **Docs targets:** README request-config `auth` and transitional options; request-config and authentication documentation in the docs site and translations.
- **Required content:** Explain that applications talking to UTF-8 Basic-auth servers can enable this option per request or with `axios.create`. Existing defaults remain compatible: XHR uses legacy single-byte username encoding and UTF-8 passwords, while Fetch already sends UTF-8 but its config resolution rejects usernames above U+00FF unless opted in. Node HTTP and Fetch URL-embedded credentials are unchanged. Setting the option to `false` on a request overrides an instance opt-in; it does not select Latin-1 for Fetch or Node HTTP.
- **Examples:** `axios.get('/account', { auth: { username: 'π', password: 'secret' }, transitional: { encodeBasicAuthUsername: true } })`. Also show an instance opt-in with a request-level `false` override for a legacy XHR endpoint.
- **Compatibility:** No migration is required unless enabling the option. Remove manual UTF-8-to-byte-string username conversion when opting in to avoid double encoding. Do not enable it for XHR servers expecting legacy Latin-1 username bytes. RFC 7617 leaves the default encoding unspecified; this option does not negotiate server challenges or normalize Unicode. ASCII/empty credentials are unchanged and malformed UTF-16 continues to reject with `ERR_BAD_OPTION_VALUE` in XHR/Fetch.
- **Types:** Both `index.d.ts` and `index.d.cts` expose the optional boolean in `TransitionalOptions`.

### Global TLS options for CONNECT-tunneled origins

- **Change:** Apply the current `https.globalAgent.options` to an HTTPS origin reached through an Axios-managed CONNECT tunnel when no per-request `httpsAgent` is configured.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, #11178; related to #11176, whose explicit-agent failure is not established as fixed by this change.
- **Status:** Pending.
- **Docs targets:** README request-config proxy/agent guidance and the Node proxy configuration docs; translated docs after the English documentation is finalized.
- **Required content:** Explain that an explicit `httpsAgent` takes precedence over the global agent, without merging their trust settings. Origin TLS options are read for each request, including after the tunneling agent is cached; changes to either selected agent's options and replacement of `https.globalAgent` are observed by subsequent requests. Global TLS settings apply only to the tunneled origin, not to the HTTPS proxy's TLS connection. Existing explicit-agent handling for the proxy is unchanged.
- **Examples:** Show a process-installed private CA with `https.globalAgent.options.ca = fs.readFileSync('/path/to/corp-ca.pem')` and `axios.get('https://internal-api.example.com/data', { proxy: { protocol: 'http', host: 'proxy.corp.net', port: 3128 } })`, without an explicit `httpsAgent`. Explain that a request-specific agent must carry its own required CA.
- **Notes:** Patch-level behavior correction with no new API, type, or migration requirements. Configured TLS options include `checkServerIdentity` and `rejectUnauthorized`; do not recommend disabling certificate validation. This forwards options, not arbitrary custom agent connection hooks. Browser adapters and HTTP/2 behavior are unchanged.

### Literal method-named request headers

- **Change:** Restore literal headers such as `Link`, including non-plain object values, and distinguish them from common and method-specific header maps.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, Literal method-named headers; #11156 and #11096.
- **Status:** Pending.
- **Docs targets:** README and docs site request-header and configuration-defaults guidance; migration guide for custom class defaults.
- **Required content:** Plain objects, null-prototype maps, and compatible `AxiosHeaders` (including subclasses and instances from other package builds) remain defaults buckets. Compatible foreign instances must provide the header-container interface; application objects exposing only the `AxiosHeaders` tag and `toJSON` remain literal values. Only the matching method bucket applies; these buckets are never transmitted as literal headers. Scalars, arrays, and other objects such as Dates, Buffers, typed arrays, and application class instances use normal header-value serialization. Existing null/undefined/false header omission remains intact. Explain the breaking compatibility change for applications using arbitrary class instances as defaults buckets: convert those instances to plain maps or `AxiosHeaders` before assigning them under `common` or a method name. Otherwise their string representation becomes a literal header, including on nonmatching requests; this can expose contents included by a custom `toString()`.
- **Examples:** Show `headers: { Link: '<https://example.com/resource>; rel="type"' }` and a JavaScript example passing `Buffer.from('literal')` directly. For a custom defaults class, migrate `headers: { post: customDefaults }` to `headers: { post: { ...customDefaults } }` or `headers: { post: new AxiosHeaders({ ...customDefaults }) }`; both retain its own enumerable header entries as method defaults.
- **Notes:** No new options, exports, or type declarations. Document the class-defaults migration prominently; do not describe this as universally nonbreaking. Object-to-string normalization is existing JavaScript runtime behavior and does not expand the declared TypeScript header-value types.

### Interceptor IDs and nullish handler recovery

- **Change:** Restore numeric-string interceptor ID compatibility and clarify interceptor storage behavior.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, #11139 and #11114; nullish handler recovery was implemented in #11118.
- **Status:** Pending.
- **Docs targets:** `README.md` Interceptors section; interceptor API reference; translated docs after the English documentation is finalized.
- **Required content:** Explain that the numeric value returned by `use()` is an opaque interceptor ID that must be passed back to `eject()` unchanged, rather than used as an index into the handlers array. Recommend `clear()` and `eject()` for managing interceptors. If the handlers array is replaced with `null` or `undefined`, the chain is skipped and the next `use()` automatically restores an array. Unknown IDs and repeated ejections are no-ops; stale IDs cannot remove newly registered handlers after compaction or clearing.
- **Examples:** Keep the existing `eject(myInterceptor)` example using the original numeric ID.
- **Notes:** Canonical numeric-string IDs are accepted for historical runtime compatibility; this does not expand the documented numeric-ID API or TypeScript declarations. Interceptor execution order is unchanged.

### Fetch response size errors

- **Change:** Preserve fetch response-limit errors across runtime wrappers and clarify the custom Response constructor's existing stream requirements.
- **Source:** #11179; `PRE_RELEASE_CHANGELOG.md` Bug Fixes, Fetch response size errors.
- **Status:** Pending.
- **Docs targets:** Fetch adapter and `maxContentLength` guidance; TypeScript/custom fetch examples.
- **Required content:** Explain that exceeding `maxContentLength` while consuming a fetch response rejects with `ERR_BAD_RESPONSE`, retaining the current request and config even if the runtime wraps or drops the original stream error. When response-body streaming is supported and the response has a body, custom `env.Response` implementations must accept a tracked `ReadableStream<Uint8Array>` if `maxContentLength` is enabled (a numeric value greater than `-1`), `onDownloadProgress` is set, or `responseType` is `'stream'` or `'response'` with cancellation/timeout tracking. An enabled size limit requires stream support even without a progress callback. The constructor signature retains its legacy body type for compatibility; assignability to `env.Response` alone does not establish support for these runtime stream inputs. Node-only TypeScript imports can keep DOM declarations excluded with declaration checking enabled.
- **Examples:** Show handling `ERR_BAD_RESPONSE` separately from `ERR_NETWORK`, and a custom Response wrapper that forwards tracked streams unchanged when used with `maxContentLength` or `onDownloadProgress`.
- **Notes:** Do not imply the limit, default adapter, genuine network-error behavior, or accepted constructor types change. No migration is required.

### Runtime configuration prototype hardening

- **Change:** Document the shared-prototype filtering applied to request config and interceptor replacements.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, Runtime configuration hardening.
- **Status:** Pending.
- **Docs targets:** Request interceptor and custom adapter guidance; request-config security and migration notes; translated docs after the English documentation is finalized.
- **Required content:** Explain that own request-config fields remain supported, including fields on a root null-prototype config, except that unsafe materialization keys (`__proto__`, `constructor`, and `prototype`) are always excluded. Values inherited only from a realm's shared `Object.prototype` are ignored even if that prototype's `constructor` is changed, deleted, or replaced by an accessor. An interceptor that returns the writable, already-merged null-prototype config preserves object identity through the adapter and `response.config`. A frozen, sealed, accessor-based, otherwise restricted, or unsafe-key-bearing null-prototype replacement is materialized into a writable filtered snapshot because dispatch updates fields such as headers, data, and temporary response state and must retain the dangerous-key filtering invariant. An interceptor replacement with a non-terminal application-defined prototype is likewise converted to a null-prototype normalized snapshot: safe inherited fields are materialized as own fields, but the original identity, prototype, `instanceof` branding, accessor placement, and property descriptor attributes are not preserved. Because a foreign shared `Object.prototype` is structurally indistinguishable from an application-created terminal null-prototype template once mutable properties are altered, inherited fields on terminal null-prototype ancestors are intentionally excluded as a fail-closed security boundary.
- **Examples:** Show an unchanged merged config retaining identity between a request interceptor and custom adapter. Show a request interceptor returning an object with a non-terminal application prototype whose custom adapter field is materialized into the normalized snapshot, and contrast it with a terminal `Object.create(null)` prototype whose inherited behavior fields are ignored.
- **Notes:** Present replacement normalization and the terminal null-prototype restriction as intentional security compatibility changes. Do not imply that mutating `Object.prototype` is supported or safe.

### Proxy bypass CIDR ranges

- **Change:** Document CIDR matching in `NO_PROXY` and `no_proxy`.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Features, Proxy bypass CIDR ranges.
- **Status:** Pending.
- **Docs targets:** Node proxy/environment-variable guidance and request-config proxy documentation; translated docs after the English documentation is finalized.
- **Required content:** Explain that IPv4 and IPv6 CIDR entries are supported, bracketed IPv6 is accepted, IPv4-mapped IPv6 ranges are normalized to IPv4 when their prefix permits it, address families remain distinct, and malformed CIDR entries do not bypass the proxy. State explicitly that `0.0.0.0/0` bypasses the proxy for every IPv4 destination and `::/0` does the same for IPv6.
- **Examples:** Show `NO_PROXY=10.0.0.0/8,2001:db8::/32` bypassing matching HTTP destinations and identify `/0` as the entire-family form.
- **Notes:** Preserve the existing hostname, explicit-port, wildcard, loopback, and non-CIDR matching behavior.

### Fetch and HTTP/2 adapter option consistency

- **Change:** Document adapter-specific redirect, custom fetch, DNS lookup, and proxy behavior.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, Fetch adapter consistency and HTTP/2 adapter consistency.
- **Status:** Pending.
- **Docs targets:** Request-config entries for `fetchOptions`, `maxRedirects`, `lookup`, `httpVersion`, and `proxy`; custom adapter/fetch guidance; translated docs after the English documentation is finalized.
- **Required content:** State that a custom fetch receives the fully resolved `Request` when `Request` is supported and continues to receive a second `fetchOptions` argument containing safe own custom fields; Axios-managed fields such as method, headers, body, signal, duplex, and credentials are represented by the `Request` and omitted from that second argument. Custom fetch implementations that previously inspected those fields on the second argument must migrate to the `Request`; identify this as an intentional compatibility change that prevents the second argument from overriding the authoritative request. Explain that `maxRedirects: 0` requests manual redirect handling in the Fetch adapter, but response visibility follows the Fetch runtime: Node may expose the 3xx status and `Location`, while browsers return an opaque redirect with status 0 and inaccessible headers. Custom DNS lookup applies to HTTP/2 connections and participates in session reuse. HTTP/2 ignores process-environment and HTTP/1-agent `proxyEnv` settings because `http2.connect()` cannot apply them, `proxy: false` remains direct, and an explicit Axios proxy object rejects with `ERR_NOT_SUPPORT`.
- **Examples:** Include focused Fetch `maxRedirects: 0` and Node `httpVersion: 2` plus `lookup` examples.
- **Notes:** Present the filtered custom-Fetch second argument, Fetch manual redirects, and explicit HTTP/2 proxy rejection as intentional compatibility changes. Do not imply that positive Fetch `maxRedirects` values enforce a redirect count; only zero maps to the platform's manual redirect mode. Do not present the Node-visible 3xx response as portable browser behavior. Keep the HTTP/2 environment-proxy direct-egress residual prominent for deployments that treat proxying as mandatory policy.

### RFC 9110 HTTP status code names

- **Change:** Document the additive RFC 9110 names for HTTP statuses 413 and 422.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Features, #11082, closes #11066.
- **Status:** Pending.
- **Docs targets:** `README.md` and `docs/pages/advanced/api-reference.md` `HttpStatusCode` guidance; migration or upgrade notes; translated docs after the English documentation is finalized.
- **Required content:** Introduce `HttpStatusCode.ContentTooLarge` for 413 and `HttpStatusCode.UnprocessableContent` for 422 as the preferred RFC 9110 names. Explain that `PayloadTooLarge` and `UnprocessableEntity` remain available as deprecated aliases throughout v1.x, and that numeric reverse lookups continue returning those legacy names for backward compatibility.
- **Examples:** Show forward comparisons using `HttpStatusCode.ContentTooLarge` and `HttpStatusCode.UnprocessableContent`.
- **Notes:** Removing the deprecated aliases or changing the numeric reverse-lookup strings is reserved for a future major release. Keep ESM and CommonJS examples aligned and update translated documentation after the English wording is finalized.

### Streaming reads from download progress events

- **Change:** Document how to read incremental response data from throttled download progress events, and the guaranteed final delivery on successful XHR `loadend`.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, closes #6796.
- **Status:** Pending.
- **Docs targets:** README request config reference for `onDownloadProgress`; any response streaming examples.
- **Required content:** Progress callbacks are throttled, so intermediate deliveries can run after the originating browser event finished dispatching; in that case `event.currentTarget` is `null` per DOM semantics, while `event.target` still references the request. A final download delivery with the complete transfer state is guaranteed when a completed XHR download reaches its successful `loadend` handler and is dispatched live. Upload progress, stream-error or abort-reason flushes, and failed XHR downloads retain their prior pending-event behavior.
- **Examples:** An incremental `responseText` reader that slices new data using `progressEvent.event.target` inside `onDownloadProgress`.

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

### Wrapped error stacks in `AxiosError`

- **Change:** `AxiosError.from()` appends an available wrapped error stack to `error.stack` after a `Caused by:` marker, in addition to the existing non-enumerable `error.cause`. Reconstructed request/caller frames precede that section, including when only one or two frames are available.
- **Source:** [PR #11142](https://github.com/axios/axios/pull/11142), related to [issue #6670](https://github.com/axios/axios/issues/6670); `PRE_RELEASE_CHANGELOG.md` Bug Fixes.
- **Status:** Pending.
- **Docs targets:** `README.md` error-handling section and the API error reference in `docs/pages/` describing `stack`, `cause`, and `toJSON()`.
- **Required content:** Explain that reporters which read only `error.stack` can now see an existing wrapped stack. `error.cause` remains the same original object and the supported programmatic link; cause-aware tooling already has access to it and may display some stack content twice. The wrapper's stack and reconstructed caller frames come first, followed by the wrapped stack verbatim. Marker-like text inside a message or custom stack is preserved as text. Missing, empty, non-string, throwing, or unwritable stacks are skipped defensively. Re-wrapping adds one nested section per call and increases the string size; this is not a bounded or idempotent cause history. Explicit `customProps.stack` continues to override the generated stack.
- **Examples:** Show a trimmed Node socket/DNS failure stack containing the `Caused by:` section, alongside a snippet reading `error.cause`. State that the diagnostic string is also exposed by `toJSON().stack`.
- **Limitations:** Wrapping cannot recover details the platform never supplied. Browser XHR `Network Error` events generally have no underlying Error stack, and this change does not diagnose hidden CORS, DNS, or TLS causes. Only failures routed through `AxiosError.from()` with usable stacks gain a section. Appended stacks are verbatim diagnostics, not redacted metadata; existing `config.redact` rules do not sanitize stack strings.
- **Notes:** Do not present the marker as a stable parsing contract. Preserve the structured cause reference for programmatic consumers; no public types or migration steps are needed.
