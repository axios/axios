# Architecture: Patterns

## Current system shape

Axios is a stateless transport library. A callable default client and user-created client instances feed a shared configuration/interceptor/transform pipeline, which delegates I/O to a capability-selected adapter. Node, browser, React Native, Bun, and Deno support is expressed through package export conditions, platform substitutions, and adapter availability rather than separate application layers.

The source defaults to the Node platform. Browser and React Native builds replace Node-only modules through package mappings. The dirty v2 snapshot establishes Node 20+ across package metadata, the Node build target, type fixtures, and configured CI matrices while retaining the current ESM and generated CommonJS/browser bundles. ESM-only remains a separate future migration.

## Components and boundaries

| Component or boundary          | Responsibility                                                                                                    | Entry points                                                           | Dependencies                                                                      | Data ownership                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Public package surface         | Expose the callable client, factories, classes, helpers, and TypeScript contracts                                 | `index.js`, `index.d.ts`, `index.d.cts`                                | `lib/axios.js`, generated `dist/` artifacts                                       | Public API shape only                                                                                                |
| Client factory and instances   | Bind `Axios.request`, attach instance/static helpers, isolate defaults and interceptors                           | `lib/axios.js`, `lib/core/Axios.js`                                    | Core merge, interceptor, dispatch, defaults                                       | Per-instance defaults and interceptor managers                                                                       |
| Core request pipeline          | Merge and validate config, normalize headers, order interceptors, transform payloads, dispatch, transform results | `lib/core/Axios.js`, `lib/core/dispatchRequest.js`                     | `lib/core/`, `lib/defaults/`, adapter registry                                    | Per-request config and response/error lifecycle                                                                      |
| Adapter registry               | Resolve a named/custom adapter using capability checks and ordered fallback                                       | `lib/adapters/adapters.js`                                             | HTTP, XHR, and Fetch adapters                                                     | No persistent state; adapter resolution reasons                                                                      |
| Node HTTP adapter              | Orchestrate HTTP/1, HTTP/2, redirects, proxies, agents, sockets, streams, compression, limits, and progress       | `lib/adapters/http.js`                                                 | Node core, `follow-redirects`, `form-data`, `https-proxy-agent`, `proxy-from-env` | Request/stream/socket lifecycle, CONNECT-agent maps without explicit eviction, and lifecycle-managed HTTP/2 sessions |
| Browser adapters               | Dispatch through XHR or Fetch with credentials, progress, cancellation, and browser response semantics            | `lib/adapters/xhr.js`, `lib/adapters/fetch.js`                         | Browser APIs or injected Fetch classes/functions                                  | Per-request browser objects and a Fetch factory seed map without explicit eviction                                   |
| Platform layer                 | Supply environment capabilities, classes, protocols, and environment detection                                    | `lib/platform/index.js`, `lib/platform/node/`, `lib/platform/browser/` | Native globals and Node core                                                      | Capability metadata only                                                                                             |
| Generic helpers                | URL, form, proxy, stream, signal, and normalization utilities reusable outside the request lifecycle              | `lib/helpers/`, `lib/utils.js`                                         | Core error/header types only where necessary                                      | Mostly function-local state                                                                                          |
| Tests and package verification | Exercise source behavior, real browser behavior, and installed package/module compatibility                       | `tests/unit/`, `tests/browser/`, `tests/smoke/`, `tests/module/`       | Vitest, Playwright, Mocha, TypeScript, runtime CLIs                               | Ephemeral test servers and fixtures                                                                                  |
| Documentation site             | Publish guides, API material, translations, and sponsor content                                                   | `docs/`                                                                | VitePress, Vue, Splide                                                            | Markdown/content and generated site output                                                                           |

## Dependency rules

- `lib/core/` owns Axios domain behavior; adapters perform I/O and must return the response contract expected by the core pipeline.
- `lib/helpers/` should remain generic. Axios-specific lifecycle decisions belong in `lib/core/` or an adapter.
- Platform selection must be capability-based. Source imports the Node platform by default; browser/React Native package mappings substitute browser-safe modules.
- Public runtime exports, `index.d.ts`, and `index.d.cts` must remain aligned while both declaration surfaces exist.
- Generated `dist/` files are build output and are never edited by hand.
- Behavior-affecting config reads must use own/safe-property helpers; config materialization must filter `__proto__`, `constructor`, and `prototype`.
- URL, redirect, proxy, XSRF, socket, decompression, and adapter changes cross explicit security boundaries and require focused tests plus review of `THREATMODEL.md`.

## Primary runtime flows

### Request to response

```text
axios(config) / method alias
  -> merge library, instance, and request config
  -> validate options, normalize method and headers
  -> request interceptors (legacy default LIFO; optional FIFO transition)
  -> safe-flatten any interceptor replacement
  -> cancellation check
  -> transform request data
  -> resolve the first supported adapter
  -> perform network I/O and settle by validateStatus
  -> cancellation check and transform response/error data
  -> response interceptors (FIFO)
  -> resolve AxiosResponse or reject AxiosError
```

Code is authoritative about the transform/selection order: `lib/core/dispatchRequest.js:45-54` transforms request data before it resolves the adapter. The high-level list in `AGENTS.md` currently states those two steps in the opposite order.

### Environment and transport selection

The default adapter preference is `xhr`, then `http`, then `fetch` (`lib/defaults/index.js:39-43`). `lib/adapters/adapters.js:65-115` chooses the first callable/supported candidate, allows a custom adapter function, and raises `ERR_NOT_SUPPORT` if none works. Within the Node adapter, config and protocol determine HTTP/1 versus HTTP/2 and custom versus native versus redirect-following transport (`lib/adapters/http.js:566-625`, `lib/adapters/http.js:1021-1121`).

### Cancellation and cleanup

`dispatchRequest` checks both legacy `CancelToken` and `AbortSignal` before I/O and after adapter settlement. Each built-in adapter subscribes to the applicable signals and removes listeners on completion; streamed responses defer cleanup until the body finishes. `lib/helpers/composeSignals.js` unifies Fetch timeouts and cancellation into one abort signal.

## Patterns actually in use

| Pattern                          | Where it appears                                                   | Why it matters                                                                 | Confidence |
| -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ---------- |
| Callable object/facade           | `lib/axios.js:28-47`, `index.js:1-45`                              | Preserves the familiar `axios(config)` API while exposing methods and classes  | Confirmed  |
| Factory with isolated defaults   | `lib/axios.js:28-43`                                               | `axios.create()` gives services separate defaults and interceptors             | Confirmed  |
| Strategy/adapter registry        | `lib/adapters/adapters.js:16-22,65-115`                            | Decouples request semantics from runtime-specific I/O                          | Confirmed  |
| Chain of responsibility          | `lib/core/InterceptorManager.js`, `lib/core/Axios.js:164-253`      | Lets callers enrich, reject, or recover requests and responses                 | Confirmed  |
| Policy-based merge               | `lib/core/mergeConfig.js:118-159`                                  | Different config fields need replace, default, direct, or deep-merge semantics | Confirmed  |
| Normalized value object          | `lib/core/AxiosHeaders.js`                                         | Gives case-insensitive HTTP header behavior across adapters                    | Confirmed  |
| Standard error envelope          | `lib/core/AxiosError.js`                                           | Carries stable codes plus config/request/response context across runtimes      | Confirmed  |
| Capability substitution          | `package.json:12-63`, `lib/platform/`                              | Allows one API to ship across Node and browser-like environments               | Confirmed  |
| Transitional compatibility flags | `lib/defaults/transitional.js`, `lib/core/Axios.js:97-109,174-182` | Allows behavior changes to be staged without immediately breaking v1 callers   | Confirmed  |

## Cross-cutting concerns

- Security hardening is embedded in config reads/materialization, URL construction, header sanitization, redirect credential stripping, XSRF decisions, size limits, and error redaction.
- Compatibility spans runtime format, adapter behavior, legacy cancellation, transitional options, TypeScript declarations, and installed-package behavior.
- Cancellation and progress touch every adapter and require cleanup to avoid retained listeners or streams.
- Serialization covers JSON, URL-encoded data, FormData, buffers, blobs/files, and streams, with runtime-dependent support.
- There is no central telemetry subsystem. Callers observe through promises, progress callbacks, interceptors, response objects, and `AxiosError`.

## Constraints, exceptions, and debt

- Current package/build/CI still retain CJS as a transitional format, but no configured v2 lane or package contract supports Node below 20. ESM-only removal remains future work and must change exports, outputs, declarations, tests, and documentation together.
- Request interceptors are LIFO under the current legacy default, but `transitional.legacyInterceptorReqResOrdering: false` makes them FIFO. Response interceptors remain FIFO.
- `baseURL` and `allowAbsoluteUrls` are URL-construction controls, not destination allowlists; applications own SSRF policy.
- Decompression and body-length limits default to unlimited, so callers dealing with untrusted servers must opt into caps.
- HTTP/2 bypasses HTTP/1 environment-proxy machinery; explicit proxy objects reject because the transport cannot apply them.
- Build reproducibility is monitored but non-blocking, and the threat model records the absence of independent two-person review for some sensitive paths.

## Evidence and gaps

| Claim or area         | Evidence                                                                                                     | Confidence | Gap or conflict                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| System boundaries     | `AGENTS.md:39-45`; `THREATMODEL.md:26-70`; `lib/core/`; `lib/adapters/`                                      | Confirmed  | None material                                                                                                                           |
| Runtime flow          | `lib/core/Axios.js:83-255`; `lib/core/dispatchRequest.js:35-94`                                              | Confirmed  | `AGENTS.md` lists adapter selection before request transformation, contrary to code                                                     |
| Environment selection | `package.json:12-67`; `lib/platform/index.js`; `lib/adapters/adapters.js:65-115`                             | Confirmed  | Node 20+ is represented; ESM-only package-shape work remains pending                                                                    |
| Interceptor order     | `lib/core/Axios.js:164-253`; `lib/defaults/transitional.js:3-10`                                             | Confirmed  | Canonical contributor prose omits the optional FIFO request ordering                                                                    |
| Stateful resources    | `lib/adapters/fetch.js:669-692`; `lib/adapters/http.js:84-89,136-169`; `lib/helpers/Http2Sessions.js:47-115` | Confirmed  | Fetch/proxy maps have no explicit capacity or eviction; HTTP/2 sessions have idle/close/error cleanup; no durable business state exists |
