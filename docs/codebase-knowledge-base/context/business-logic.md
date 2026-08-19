# Context: Business logic

## Domain vocabulary and model

| Term or concept | Meaning in this system | Authoritative source |
| --- | --- | --- |
| Client defaults | Library or instance configuration inherited by later requests | `lib/defaults/index.js`; `lib/axios.js:28-43` |
| Per-request config | Highest-precedence input for one dispatch | `lib/core/Axios.js:83-162`; `lib/core/mergeConfig.js` |
| Header set | Case-insensitive normalized HTTP metadata | `lib/core/AxiosHeaders.js` |
| Request/response interceptor | Ordered caller hook before or after adapter dispatch | `lib/core/InterceptorManager.js`; `lib/core/Axios.js:164-253` |
| Request/response transform | Ordered body conversion with normalized headers | `lib/core/transformData.js`; `lib/defaults/index.js` |
| Adapter | Runtime-compatible implementation that returns an Axios response promise | `lib/adapters/adapters.js`; `docs/pages/advanced/adapters.md` |
| Settlement | Decision to resolve or reject based on response status | `lib/core/settle.js` |
| Cancellation | Explicit termination via AbortSignal or legacy CancelToken | `lib/core/dispatchRequest.js`; `lib/cancel/CancelToken.js` |

## Core invariants

- Later config layers override earlier layers, but merge behavior is field-specific. `url`, `method`, and `data` come only from the per-request layer; headers merge case-insensitively.
- Merged configs are new null-prototype objects. Unsafe materialization keys are excluded, and inherited shared-prototype fields cannot become network behavior.
- Method defaults to `get`, is normalized to lowercase, and method-specific headers are flattened into one `AxiosHeaders` value before interceptors dispatch.
- Request transformers run before adapter selection; response transformers run for both fulfilled responses and errors that carry a response.
- The first supported adapter in the configured preference list handles the request; unknown names or no viable adapter produce `AxiosError`.
- Default status validation resolves 2xx and rejects other HTTP responses, while a missing status or validator resolves.
- Response interceptors run FIFO. Request interceptors use the current legacy LIFO default, with an opt-in transitional FIFO ordering.
- Cancellation is checked at the dispatch boundary and after adapter completion; adapters must clean up listeners and I/O.
- Axios-originated failures use the stable `AxiosError` contract and codes.
- `withXSRFToken === true` is the only value that explicitly forces cross-origin XSRF header attachment.

## State transitions and lifecycle

```text
raw call
  -> merged/validated request config
  -> interceptor-adjusted config
  -> safe dispatch config with normalized headers/body
  -> pending adapter I/O
  -> settled raw response or transport failure
  -> transformed response/error
  -> response interceptor chain
  -> fulfilled AxiosResponse or rejected AxiosError/CanceledError
```

Cancellation can move a request to rejected before dispatch, during I/O/body streaming, or immediately after adapter completion. An interceptor may also reject before I/O or recover later promise-chain failures. `response.config` identifies the normalized config that reached the adapter; Axios has no durable record after the caller releases the response/error.

## Decisions and calculations

| Rule | Inputs or preconditions | Outcome | Evidence |
| --- | --- | --- | --- |
| Config precedence | Library defaults, instance defaults, request config | Later values win according to field merge policy | `README.md:1333-1351`; `lib/core/mergeConfig.js` |
| HTTP method default | No safe own method in request/instance config | Lowercase `get` | `lib/core/Axios.js:147-152` |
| Adapter choice | Configured adapter/function list and runtime capabilities | First supported adapter or `ERR_NOT_SUPPORT` | `lib/adapters/adapters.js:65-115` |
| Request serialization | Body type, Content-Type, environment FormData | Preserve binary/stream or serialize URL-encoded, multipart, or JSON | `lib/defaults/index.js:42-108` |
| Response parsing | Body type, `responseType`, transitional JSON flags | Parse JSON or preserve raw data; strict parse errors become `ERR_BAD_RESPONSE` | `lib/defaults/index.js:110-143` |
| HTTP success | Response status and `validateStatus` | Resolve when no status/validator or predicate passes; otherwise reject | `lib/core/settle.js:14-26` |
| XSRF attachment | Standard browser environment, origin, callback/boolean config, cookie names | Same-origin by default; cross-origin only when exactly `true` | `lib/helpers/resolveConfig.js:80-104` |
| Redirect secret handling | Origin change and standard/custom sensitive headers | Strip credentials and configured sensitive headers before cross-origin redirect | `lib/adapters/http.js:1064-1118` |
| Socket eligibility | `socketPath` and optional allowlist | Resolve path; reject mismatch with `ERR_BAD_OPTION_VALUE` | `lib/adapters/http.js:973-1008` |
| Size limit | Known/streamed request or decompressed response bytes and configured limit | Reject when byte count exceeds cap | `lib/adapters/http.js:729-748,857-866,1224-1319,1425-1484`; `lib/adapters/fetch.js` |
| Timeout error code | Timeout plus transitional clarification setting | `ECONNABORTED` by default or `ETIMEDOUT` when clarified | Adapter timeout paths |

## Authorization and eligibility

Axios has no user/role authorization model. The caller is trusted to decide whether a request is allowed and to provide credentials. HTTP Basic auth, cookies, bearer/custom headers, proxy auth, and XSRF tokens are transport inputs, not application authorization decisions. Custom hooks execute with the caller process's full privileges.

## Persistence and consistency

There is no durable application persistence or transaction boundary. Instance defaults and interceptor registrations live in memory. Adapters hold request-local resources; the Node adapter also maintains reusable proxy agents and HTTP/2 sessions. Consistency means preserving one normalized config/response/error contract through asynchronous execution and cleaning up resources on every terminal path.

## Time, retries, and idempotency

The default timeout is `0` (no Axios-created timeout). Callers should set production timeouts. Axios has no automatic retry engine; official docs build bounded retries, backoff, rate-limit handling, and token refresh with response interceptors. Retry safety and idempotency belong to caller policy. Axios supports safe/idempotent `QUERY` semantics in this snapshot, but network retries are never inferred from the method.

## Edge cases and failure behavior

- Malformed `http:`/`https:` strings missing `//` reject with `ERR_INVALID_URL`; sensitive URL portions are redacted in the message.
- Unsupported protocols/adapters/options reject with Axios error codes rather than silently dispatching.
- URL `baseURL` composition is not an SSRF allowlist and relative `..` segments can escape an intended path prefix after parsing.
- Navigation-cancelled XHR status-0 responses, Fetch runtime-specific failures, Node aggregate connection errors, and stream aborts have adapter-specific normalization paths.
- Decompression limits apply after decompression; defaults remain unlimited and are a documented availability risk.
- Live `AxiosError` objects can retain sensitive config/request data even when `toJSON()` redaction is enabled.
- HTTP/2 cannot apply Axios's HTTP/1 proxy configuration; explicit proxy config rejects and environment proxy state is ignored.
- Caller-supplied adapters/transports/interceptors can violate normal assumptions and are intentionally not sandboxed.

## Evidence and gaps

| Claim or area | Evidence | Confidence | Gap or conflict |
| --- | --- | --- | --- |
| Lifecycle and invariants | `lib/core/Axios.js`; `lib/core/dispatchRequest.js`; `lib/core/mergeConfig.js` | Confirmed | Contributor lifecycle prose reverses transform/adapter-selection order |
| Adapter behavior | `lib/adapters/`; `lib/defaults/index.js:39-43` | Confirmed | Runtime-specific Fetch/browser behavior may vary by platform implementation |
| Security rules | `lib/utils.js`; `lib/helpers/resolveConfig.js`; `lib/core/buildFullPath.js`; `THREATMODEL.md` | Confirmed | Some threat-model mechanisms/defaults are stale |
| Retry/idempotency | `docs/pages/advanced/retry.md`; source search | Confirmed no built-in retry | Retry-delay cancellation example in docs is not signal-aware |
| Authorization/persistence | Architecture and source inventory | Confirmed not owned by Axios | Consumer-specific business rules are intentionally unknown |
