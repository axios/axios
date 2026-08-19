# Context: Business overview

## Problem and value

Axios gives JavaScript and TypeScript applications one promise-based API for making HTTP requests across browsers and server-side runtimes. It reduces environment-specific transport code by normalizing configuration, serialization, headers, cancellation, progress, responses, and errors while delegating actual I/O to XHR, Fetch, Node HTTP/HTTPS/HTTP2, or a caller-supplied adapter.

The value proposition visible in the repository is developer simplicity plus transport control: a request can start with a small `axios.get()` call, then scale to isolated clients, interceptors, typed configs, streaming, proxies, redirects, HTTP/2, and security controls without changing the main response/error model.

## Users, customers, and external actors

- JavaScript/TypeScript frontend developers calling APIs from browser applications.
- Node.js backend, CLI, SSR, automation, proxy, and integration developers.
- Developers on Fetch-compatible or adjacent runtimes such as workers, Bun, and Deno.
- Library/framework authors using custom adapters, transports, or Axios's typed response contracts.
- Maintainers, contributors, security researchers, package consumers, and sponsors participating in the open-source project.
- Remote origin servers, redirects, proxies, and the network are external runtime actors; they are untrusted in the general threat model.

## Primary capabilities

| Capability | User or business outcome | System boundary | Evidence |
| --- | --- | --- | --- |
| Make HTTP requests | Use one promise/async API across environments | Public client into selected adapter | `README.md:431-515`; `index.js` |
| Configure reusable clients | Isolate base URLs, headers, auth, timeout, and other defaults per service | `axios.create()` and config merge | `lib/axios.js:28-43`; `README.md:761-777,1305-1351` |
| Intercept lifecycle | Add auth, tracing, validation, recovery, and response shaping | Request/response interceptor chains | `lib/core/Axios.js:164-253`; `README.md:1354-1537` |
| Serialize/transform data | Send JSON, forms, files, URL-encoded data, buffers, blobs, and streams | Default/custom transforms and adapters | `lib/defaults/index.js:42-143` |
| Normalize responses/errors | Receive a stable response shape and actionable error codes/context | `settle`, transforms, `AxiosError` | `lib/core/settle.js`; `lib/core/AxiosError.js` |
| Cancel and time-bound work | Stop unwanted or stalled operations | AbortSignal, legacy CancelToken, adapter timeouts | `lib/core/dispatchRequest.js:18-25`; adapter cleanup paths |
| Observe transfer progress | Drive UI/telemetry for uploads and downloads | XHR/Fetch/Node progress callbacks | `README.md:2144-2211`; adapters |
| Control Node networking | Use agents, redirects, proxies, sockets, HTTP/2, limits, compression, and custom transports | Node HTTP adapter | `lib/adapters/http.js` |
| Protect browser XSRF flow | Attach configured token headers under explicit origin rules | Browser config resolution | `lib/helpers/resolveConfig.js:80-104` |
| Extend transport behavior | Support tests or nonstandard environments | Custom adapter/custom Fetch hooks | `docs/pages/advanced/adapters.md`; `lib/adapters/adapters.js` |

## System boundary

Axios starts at the call/config object and ends at a resolved response or rejected error. It owns request preparation, adapter dispatch, response transformation, and cleanup. It does not own the caller's URL allowlist, business authorization, credential lifecycle, retry/idempotency policy, persistence, server behavior, browser security model, proxy trust, TLS policy, or the safety of caller-supplied hooks.

The project boundary also includes source, build/test automation, npm packaging, documentation, vulnerability handling, and release provenance. npm, GitHub, runtime dependencies, maintainers, contributors, and downstream consumers sit across supply-chain trust boundaries documented in `THREATMODEL.md`.

## Operational or commercial model

Axios is MIT-licensed and community maintained. Repository funding metadata points to GitHub Sponsors and Open Collective. There is no checked-in commercial pricing, hosted API, account system, revenue model, customer tier, or service-level objective. npm packages and public documentation are the main delivery channels evidenced in the repository.

## Domain glossary

| Term | Meaning | Notes or ambiguity |
| --- | --- | --- |
| Axios instance | Callable client with its own defaults and request/response interceptors | Default export is also an instance |
| Request config | Options controlling URL, method, headers, body, adapter, transport, cancellation, and transforms | Merged through field-specific policy |
| Adapter | Function that turns normalized config into an Axios response promise | Built-ins: XHR, HTTP, Fetch; custom functions allowed |
| Transport | Lower-level Node dispatcher exposing `request(options, callback)` | Distinct from the cross-runtime Axios adapter |
| Interceptor | Caller hook in the request or response promise chain | Request ordering has a transitional mode |
| Transform | Ordered function that converts request or response data | Runs inside the core dispatch boundary |
| AxiosResponse | Normalized data/status/headers/config/request result | Actual body type depends on `responseType` and adapter |
| AxiosError | Standard error with code and optional config/request/response/status | Live objects may contain sensitive data |
| CancelToken | Deprecated Axios cancellation mechanism | Retained for compatibility; prefer AbortSignal |
| `validateStatus` | Caller predicate deciding whether an HTTP response resolves or rejects | Default accepts 2xx |
| XSRF | Browser cookie-to-header protection mechanism | Cross-origin attachment must be explicitly forced |

## Explicit non-goals

- Sandboxing malicious caller code, interceptors, transforms, custom adapters, or monkey-patched runtimes.
- Deciding which destination URLs, hosts, proxies, Unix sockets, or redirects are permitted for an application.
- Owning application authentication/authorization, persistence, retry safety, idempotency, or business workflows.
- Warning whenever a caller intentionally disables TLS verification.
- Providing a hosted HTTP service, database, message broker, or operations platform.
- Defending an application after its process/runtime or environment variables are fully compromised.

## Evidence and gaps

| Claim or area | Evidence | Confidence | Gap or conflict |
| --- | --- | --- | --- |
| Problem/value | `README.md:431-515`; `docs/pages/getting-started/features.md:3-23`; `docs/index.md:21-27` | Confirmed | No formal product positioning document |
| Users and actors | Public docs, package keywords, `THREATMODEL.md:65-80` | Confirmed/inferred | No repository personas or customer research |
| Open-source model | `package.json:64-101`; `CONTRIBUTING.md`; `.github/FUNDING.yml` | Confirmed | No commercial metrics or service commitments |
| System boundary/non-goals | `THREATMODEL.md:9-20,65-70,233-242` | Confirmed | Caller-specific policy remains outside Axios |
| Runtime scope | `package.json:12-63`; `.github/workflows/run-ci.yml` | Confirmed current state | Planned v2 scope differs and is not yet implemented |
