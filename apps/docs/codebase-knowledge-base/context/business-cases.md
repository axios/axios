# Context: Business cases

## Case map

| Business case | Primary actor | Trigger | Outcome or value | Implementation anchors |
| --- | --- | --- | --- | --- |
| Call an HTTP API | Application developer | Code needs remote data or action | Promise resolves with normalized response or rejects with structured error | `index.js`; `lib/core/Axios.js`; adapters |
| Create a service-specific client | Application/team | Multiple services need isolated policy | Shared defaults/interceptors without cross-service leakage | `lib/axios.js:28-43`; `README.md:761-777` |
| Add authentication or lifecycle policy | Application developer | Requests/responses need enrichment, validation, refresh, tracing, or recovery | Hooked request/response chain | `lib/core/InterceptorManager.js`; `docs/pages/advanced/interceptors.md` |
| Upload forms/files/streams | Browser or Node application | Submit multipart, URL-encoded, binary, or streamed data | Correct serialization, headers, limits, and progress | `lib/defaults/index.js:42-108`; adapters |
| Cancel or time out work | User/application | Navigation, superseded work, shutdown, or latency budget | I/O stops and rejects predictably | `lib/core/dispatchRequest.js`; `lib/cancel/`; adapters |
| Route Node traffic | Backend/CLI/operator | Network requires proxy, agent, redirect, socket, custom transport, or HTTP/2 | Request uses selected network path and safeguards | `lib/adapters/http.js` |
| Protect browser session requests | Browser application | Cookie-authenticated request needs XSRF header/credential control | Token is attached under explicit origin policy | `lib/helpers/resolveConfig.js:80-104` |
| Support nonstandard runtimes/testing | Framework/library/test author | Built-in transport is unavailable or insufficient | Custom adapter or injected Fetch implements I/O | `lib/adapters/adapters.js`; `lib/adapters/fetch.js`; adapter docs |
| Recover transient/auth failures | Application developer | 429/5xx/network/auth failure | Caller-owned bounded retry, backoff, or token refresh | `docs/pages/advanced/retry.md`; `docs/pages/advanced/authentication.md` |

## Call an HTTP API

- **Actor:** JavaScript/TypeScript application developer.
- **Trigger:** Application code calls `axios(config)`, a method alias, or an instance method.
- **Preconditions:** A supported adapter or custom adapter exists; caller provides a usable URL and any required credentials/config.
- **Main flow:** Axios merges defaults, validates config, executes request interceptors, transforms the body, selects an adapter, performs I/O, settles status, transforms the response, and executes response interceptors.
- **Outcome and value:** The caller receives a consistent promise, response shape, headers object, and error model across supported environments.
- **Business rules:** Request config has highest precedence; default method is GET; default success is 2xx; adapter selection is capability-driven.
- **Alternate and failure paths:** Invalid config/URL, unsupported adapter/protocol, cancellation, timeout, network errors, size limits, transform failures, or rejected status produce `AxiosError`/`CanceledError` with available context.
- **Implementation anchors:** `lib/core/Axios.js:83-255`, `lib/core/dispatchRequest.js:35-94`, `lib/adapters/adapters.js:65-115`.
- **Confidence:** Confirmed.

## Create a service-specific client

- **Actor:** Application team integrating one or more remote services.
- **Trigger:** A service needs its own base URL, auth header, timeout, serialization, adapter, or interceptors.
- **Preconditions:** Caller defines instance defaults and avoids treating `baseURL` as a security allowlist.
- **Main flow:** `axios.create()` merges the supplied defaults, creates an isolated `Axios` context, binds the callable request method, and exposes instance methods/interceptors.
- **Outcome and value:** Reusable configuration with fewer call-site details and reduced accidental credential sharing across domains.
- **Business rules:** Library defaults feed instance defaults, then per-request config overrides them; request `data` is not inherited/deep-merged from defaults.
- **Alternate and failure paths:** Global defaults can leak credentials across domains; caller should prefer scoped instances and validate destinations.
- **Implementation anchors:** `lib/axios.js:28-43`, `lib/core/mergeConfig.js`, `README.md:1305-1351`.
- **Confidence:** Confirmed.

## Add authentication or lifecycle policy

- **Actor:** Application developer or framework author.
- **Trigger:** Requests need tokens, headers, validation, logging, refresh, retries, or response normalization.
- **Preconditions:** Hooks are trusted in-process code and obey config/response contracts.
- **Main flow:** Register request and/or response handlers; request hooks run according to the transitional order and response hooks run FIFO as a promise chain.
- **Outcome and value:** Cross-cutting policy is centralized outside individual call sites.
- **Business rules:** `runWhen` skips only on exact `false`; synchronous rejection handling has special continuation/blocking rules; retry/idempotency remains caller-owned.
- **Alternate and failure paths:** Thrown/rejected handlers move through the rejection chain; a malicious or malformed hook can alter request behavior and is not sandboxed.
- **Implementation anchors:** `lib/core/InterceptorManager.js`, `lib/core/Axios.js:164-253`, `README.md:1354-1537`.
- **Confidence:** Confirmed.

## Route and constrain Node traffic

- **Actor:** Backend/CLI developer or operator.
- **Trigger:** Workload needs proxying, redirects, TLS agents, Unix sockets, compression, streaming, bandwidth/size limits, custom transport, or HTTP/2.
- **Preconditions:** Node HTTP adapter is available; caller config/environment expresses a valid route and security policy.
- **Main flow:** Adapter safely reads config, validates protocol/version, constructs URL/headers/body, applies socket/proxy/agent rules, selects a transport, streams I/O, decompresses and enforces limits, then settles.
- **Outcome and value:** Rich Node networking behavior behind the same Axios response/error interface.
- **Business rules:** `socketPath` wins over host/port; `allowedSocketPaths` can constrain it; cross-origin redirects strip secrets; HTTP/2 rejects explicit Axios proxy config; size limits must be explicitly set.
- **Alternate and failure paths:** Invalid agents/options/paths, unsupported HTTP version/protocol, proxy/TLS failures, redirect loops, stream aborts, or exceeded limits reject with contextual errors.
- **Implementation anchors:** `lib/adapters/http.js`, `docs/pages/advanced/request-config.md`.
- **Confidence:** Confirmed.

## Operational and system-to-system cases

- CI builds and packs the library, then installs the tarball in runtime/module fixtures to verify what consumers actually receive.
- Maintainers prepare and publish v1 releases through GitHub Actions with OIDC provenance; vulnerability reports use private advisories and the documented incident runbook.
- Documentation is built separately with VitePress and includes English plus Spanish, French, and Chinese trees.
- Example and sandbox servers support manual validation; they are not production services.

## Evidence and gaps

| Claim or area | Evidence | Confidence | Gap or conflict |
| --- | --- | --- | --- |
| Consumer cases | `README.md:609-689,761-810,1305-1745,2054-2211`; runtime source | Confirmed | Repository has no formal persona/business-process model |
| Node routing cases | `lib/adapters/http.js`; request-config docs; `THREATMODEL.md` | Confirmed | Caller deployment policy remains external |
| Retry/token refresh | `docs/pages/advanced/retry.md`; `docs/pages/advanced/authentication.md` | Confirmed as caller patterns | No built-in retry engine; one retry-delay cancellation example is incomplete |
| Delivery/operations | `.github/workflows/run-ci.yml`; release/publish workflows; `SECURITY.md` | Confirmed | 0.x release mechanism and docs hosting are not established |
| Commercial cases | Repository inventory | Unknown/not evidenced | No pricing, hosted service, sales, or KPI model |
