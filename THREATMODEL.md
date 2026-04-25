# Axios Threat Model

This document describes the threat model for axios - both as a **library consumed at runtime** by millions of applications, and as an **open-source project** with a build pipeline, release infrastructure, and human maintainers.

It is intended for maintainers, security researchers, and downstream consumers performing supply-chain due diligence. It is a living document; if you find a gap, open a security advisory rather than a public issue.

---

## 1. Scope & Methodology

We model two distinct systems:

| System             | What is being protected                     | Who attacks it                                                    |
| ------------------ | ------------------------------------------- | ----------------------------------------------------------------- |
| **Runtime**        | Applications that `import axios`            | Malicious servers, network attackers, malicious application input |
| **Project / SDLC** | The integrity of what gets published to npm | Supply-chain attackers, phishers, malicious contributors          |

For each, we enumerate **assets**, **trust boundaries**, **threat actors**, and **threats** (rated by likelihood × impact). Where mitigations exist in the codebase today, we cite the file. Where they do not, we say so.

The runtime model is general by design - axios is a transport library and cannot know what its callers consider sensitive. The project model is specific and actionable.

---

## 2. Runtime Threat Model

### 2.1 System Overview

```
  ┌─────────────────┐
  │  Application    │  ← trusted: writes the config, owns the secrets
  │  (caller code)  │
  └────────┬────────┘
           │ axios(config)
  ┌────────▼────────┐
  │  Interceptors   │  ← caller-supplied code, runs in-process
  ├─────────────────┤
  │  Config merge   │  ← lib/core/mergeConfig.js
  │  URL build      │  ← lib/core/buildFullPath.js, lib/helpers/buildURL.js
  │  Header build   │  ← lib/core/AxiosHeaders.js
  ├─────────────────┤
  │  Adapter        │  ← http.js / xhr.js / fetch.js
  └────────┬────────┘
           │
  ═════════▼═════════  ← TRUST BOUNDARY (network)
           │
  ┌────────▼────────┐
  │  Proxy (opt.)   │  ← partially trusted (sees plaintext if HTTP)
  └────────┬────────┘
  ┌────────▼────────┐
  │  Origin server  │  ← UNTRUSTED in the general case
  │  + redirects    │
  └─────────────────┘
```

### 2.2 Assets

| Asset                          | Why it matters                                               |
| ------------------------------ | ------------------------------------------------------------ |
| Credentials in transit         | `config.auth`, `Authorization` headers, cookies, XSRF tokens |
| Request/response bodies        | May contain PII, business secrets                            |
| The caller's process integrity | Prototype pollution → RCE in some downstream gadgets         |
| The caller's internal network  | SSRF can pivot through the host running axios                |
| Availability                   | Decompression bombs, redirect loops, slow-loris responses    |

### 2.3 Trust Boundaries

1. **Caller ↔ axios.** The caller is fully trusted. Anything the caller passes in `config` is assumed intentional. axios does **not** defend against a malicious caller - that is a non-goal.
2. **axios ↔ network.** Everything past the socket is untrusted: response status, headers, body, redirect `Location`, proxy responses.
3. **axios ↔ environment variables.** `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` are read by `proxy-from-env`. An attacker who controls the environment can redirect all traffic. This is treated as trusted (same privilege as the process), but is a relevant pivot in container-escape and CI scenarios.
4. **Caller-supplied hooks ↔ axios internals.** Interceptors, `transformRequest`, `transformResponse`, `paramsSerializer`, `beforeRedirect`, custom adapters. These run with full process privilege. axios does not sandbox them.

### 2.4 Threat Actors

| Actor                         | Capability                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Malicious server**          | Controls every byte of the response. Most common.                                                                    |
| **On-path network attacker**  | MITM. Mitigated by TLS unless the caller disabled validation.                                                        |
| **Malicious redirect target** | A trusted server redirects to an attacker - attacker now sees whatever axios forwards.                               |
| **Application user**          | Controls _part_ of the request (e.g. a URL path segment, a query param, a header value) via the calling application. |

### 2.5 Threats

> **Severity** = Likelihood × Impact, rated for a _typical_ server-side deployment. Browser deployments inherit the browser's same-origin policy and are generally lower risk for SSRF/credential leakage.

---

#### T-R1: SSRF via caller-controlled URL

|                   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**   | Application interpolates user input into `config.url` or `config.baseURL`. Attacker supplies `http://169.254.169.254/`, `http://localhost:6379/`, `file://`, `gopher://`, etc.                                                                                                                                                                                                                                                                                                                 |
| **Likelihood**    | **High** - this is the #1 real-world axios misuse pattern.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Impact**        | **High** - cloud metadata theft, internal service access.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **In scope?**     | **Partially.** axios cannot know which URLs the caller intends to allow.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Mitigations**   | • `allowAbsoluteUrls: false` prevents a relative `url` from overriding `baseURL` (`lib/core/buildFullPath.js`). Defaults to `true` for back-compat. <br>• The HTTP adapter only speaks `http:`/`https:`/`file:`/`data:` (Node) or `http:`/`https:`/`file:`/`blob:`/`url:`/`data:` (browser) - exotic schemes like `gopher:` are rejected (`lib/platform/node/index.js`, `lib/platform/browser/index.js`). <br>• **No built-in host allowlist.** Callers MUST validate destinations themselves. |
| **Residual risk** | Substantial. This is documented as caller responsibility.                                                                                                                                                                                                                                                                                                                                                                                                                                      |

---

#### T-R2: Credential leakage on cross-origin redirect

|                   |                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**   | Caller sets `Authorization: Bearer …` and requests `https://api.trusted.com/x`. Server responds `302 Location: https://evil.com/`. Does the bearer token go to evil.com?                                                                                                                                                                                                                                                                 |
| **Likelihood**    | Medium                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Impact**        | High (full credential theft)                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Mitigations**   | • Node adapter delegates to `follow-redirects@^1.15.11`, which strips `Authorization`, `Cookie`, and `Proxy-Authorization` on cross-host redirects and on HTTPS→HTTP downgrades. <br>• `maxRedirects` defaults to 5; set to `0` to handle redirects manually. <br>• `beforeRedirect` callback allows custom inspection. <br>• Browser adapters (XHR/fetch) delegate to the browser, which applies its own cross-origin credential rules. |
| **Residual risk** | Low. We inherit `follow-redirects`' security posture - it is a critical transitive dependency and its CVEs are our CVEs.                                                                                                                                                                                                                                                                                                                 |

---

#### T-R3: Header injection (CRLF)

|                   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**   | Application puts user input into a header value: `headers: { 'X-User': req.query.name }`. Attacker supplies `foo\r\nX-Injected: bar\r\n\r\n<body>`. A related surface is **multipart per-part headers** — attacker-controlled `blob.type` or `blob.name` flowing into the multipart body.                                                                                                                                                                                                                       |
| **Likelihood**    | Low                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Impact**        | Medium–High (request smuggling, response splitting, multipart parser confusion)                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Mitigations**   | • `lib/core/AxiosHeaders.js` rejects header values containing `\r` or `\n`, and validates header names against an RFC-7230-shaped charset. Node's own `http` module also rejects these. <br>• `lib/helpers/formDataToStream.js` strips CRLF from `value.type` and percent-encodes CRLF/`"` in `value.name` via `escapeName()` before interpolating them into per-part headers (GHSA-445q-vr5w-6q77). Node's `http` module does **not** defend here — multipart injection is in body bytes, not request headers. |
| **Residual risk** | Very low for HTTP headers (defense in depth: axios + Node). Low for multipart body headers (single layer of defense; regressions here would be silent).                                                                                                                                                                                                                                                                                                                                                         |

---

#### T-R4: Prototype pollution — write side (polluting response / merge into a target object)

|                   |                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**   | Server returns `{"__proto__": {"isAdmin": true}}`. If axios merged this into an object naively, every `{}` in the process would gain `.isAdmin`.                                                                                                                                                                                                                                                  |
| **Likelihood**    | Low (requires a downstream gadget to be exploitable)                                                                                                                                                                                                                                                                                                                                              |
| **Impact**        | High (process-wide state corruption, sometimes RCE)                                                                                                                                                                                                                                                                                                                                               |
| **Mitigations**   | • `JSON.parse` itself does not pollute (it creates own-properties named `__proto__`, not prototype links). <br>• Internal merge paths filter dangerous keys: `lib/utils.js` and `lib/core/mergeConfig.js` filter `__proto__` / `constructor` / `prototype`; `lib/helpers/formDataToJSON.js` filters `__proto__`. <br>• These were added in response to past advisories - regression here is a P0. |
| **Residual risk** | Low, but this is an area of active attacker interest. New merge helpers MUST go through the same filtering.                                                                                                                                                                                                                                                                                       |

---

#### T-R4b: Prototype pollution — read-side gadgets (polluted `Object.prototype` drives axios behavior)

|                   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**   | A _different_ library in the caller's dependency tree pollutes `Object.prototype` (e.g. `Object.prototype.validateStatus = () => true`). axios code that reads a config property through the prototype chain then picks up the attacker's value and executes the associated behavior. Each reachable property is a distinct **gadget**: `validateStatus` (bypass HTTP error handling), `parseReviver` (silently tamper JSON response bodies), `transport` / `httpAgent` / `lookup` (MITM / intercept), `withXSRFToken` (leak XSRF token cross-origin), `transformResponse` (response replacement), and so on.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Likelihood**    | Low–Medium (requires a polluted prototype somewhere in the process — historically common).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Impact**        | High — arbitrary behavior change across every axios call (auth bypass, response tampering, credential leakage). Unlike T-R4, this does not require axios itself to pollute — any polluted process is enough.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Mitigations**   | Config reads that can drive behavior are routed through `hasOwnProp` guards so polluted prototype properties are not seen: <br>• `lib/core/mergeConfig.js` — per-prop reads from `config1`/`config2` guarded with `hasOwnProp`; `mergeDirectKeys` (used by `validateStatus`) uses `hasOwnProp` rather than the `in` operator which traverses the prototype chain (fix for GHSA-w9j2-pvgh-6h63). <br>• `lib/defaults/index.js` — `transformResponse` / `transformRequest` read `transitional`, `responseType`, `parseReviver`, `response` via an `own()` wrapper (fix for GHSA-3w6x-2g7m-8v23). <br>• `lib/adapters/http.js` — `transport`, `httpAgent`, `httpsAgent`, `lookup`, `family`, `http2Options`, etc. read via `hasOwnProp` (fix for GHSA-pf86-5x62-jrwf gadget set). <br>• `lib/helpers/resolveConfig.js` — `withXSRFToken` requires strict `=== true` to send the header cross-origin; non-boolean truthy values (`1`, `"false"`, `{}`) no longer short-circuit the same-origin check (fix for GHSA-xx6v-rp6x-q39c). <br>• Regression tests for the gadget class live in `tests/unit/prototypePollution.test.js` (both unit-level and end-to-end against `axios.get`). |
| **Residual risk** | Low, but the surface is _every config property read_. Any new code path that reads `config.foo` / `this.foo` / destructures from a merged config MUST use a `hasOwnProp` guard. The non-goal that axios does not defend a caller with a polluted prototype is **narrower than it sounds** — the pollution typically comes from a transitive dep, not from the caller's own intent, and the above mitigations _do_ neutralize the reachable gadgets even when the prototype is polluted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

---

#### T-R5: Decompression bomb

|                   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**   | Server sends `Content-Encoding: gzip` with a 10 KB body that decompresses to 10 GB.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Likelihood**    | Low                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Impact**        | Medium (DoS - OOM kill of the calling process)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Mitigations**   | • `maxContentLength` bounds the **decompressed** response size in the Node adapter (`lib/adapters/http.js`), enforced chunk-by-chunk on the decompressed stream for both buffered and `responseType: 'stream'` responses (stream path fixed in GHSA-vf2m-468p-8v99). <br>• `maxBodyLength` bounds the request side, including when `maxRedirects === 0` (previously bypassed). <br>• Both default to `-1` (unlimited). **Callers handling untrusted servers should set these.** The README carries a top-level "security notice" call-out and `docs/pages/misc/security.md` documents the exact mitigation snippet in all four locales. <br>• Decompression uses Node's `zlib`, which streams — memory is bounded by the limit, not the full expansion. |
| **Residual risk** | Medium when limits are not configured. The defaults favor compatibility over safety; the reasoning is that tightening the default would silently break every legitimate download larger than whatever cap were chosen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

---

#### T-R6: TLS validation bypass

|                   |                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Description**   | Caller passes `httpsAgent: new https.Agent({ rejectUnauthorized: false })` to "fix" a certificate error in dev, ships it to prod. |
| **Likelihood**    | Medium (very common copy-paste anti-pattern)                                                                                      |
| **Impact**        | High (silent MITM)                                                                                                                |
| **In scope?**     | **No.** axios delegates TLS entirely to Node's `https` module / the browser. We do not inspect or warn on agent configuration.    |
| **Mitigations**   | None at the axios layer. Documentation responsibility only.                                                                       |
| **Residual risk** | High, but explicitly out of scope. This is caller misconfiguration, not an axios vulnerability.                                   |

---

#### T-R7: XSRF token sent cross-origin

|                   |                                                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**   | Browser deployment. `xsrfCookieName` is set; attacker tricks the app into requesting `https://evil.com` and the XSRF token cookie value is attached as a header.                      |
| **Likelihood**    | Low                                                                                                                                                                                   |
| **Impact**        | Medium                                                                                                                                                                                |
| **Mitigations**   | `lib/helpers/resolveConfig.js` only attaches the XSRF header when `isURLSameOrigin()` passes (or when `withXSRFToken` is explicitly forced). This was the fix for **CVE-2023-45857**. |
| **Residual risk** | Low. The same-origin check uses the WHATWG `URL` parser (`lib/helpers/isURLSameOrigin.js`), which is robust against parser-differential attacks.                                      |

---

#### T-R8: Sensitive data in error objects

|                   |                                                                                                                                                                                                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**   | Request fails. `AxiosError` includes `config`, which includes `config.auth`, `config.headers.Authorization`, `config.httpsAgent` (with embedded client cert/key). Caller logs the error → secrets in logs.                                                                                         |
| **Likelihood**    | **High**                                                                                                                                                                                                                                                                                           |
| **Impact**        | Medium–High                                                                                                                                                                                                                                                                                        |
| **Mitigations**   | `AxiosError.toJSON()` (`lib/core/AxiosError.js`) produces a reduced view, but the live error object still carries the full config by reference.                                                                                                                                                    |
| **Residual risk** | **Medium.** Callers using structured loggers that walk object graphs (Winston, Pino with serializers, Sentry) will capture credentials unless they configure redaction. This is a documented sharp edge, not a vulnerability - but it is the most common way axios users leak secrets in practice. |

---

#### T-R9: Proxy environment variable hijack

|                   |                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Description**   | Attacker controls the process environment (compromised CI step, container escape, `.env` injection) and sets `HTTPS_PROXY=http://evil.com:8080`. All axios traffic is now MITM'd.                                                                                                                                                                                                                |
| **Likelihood**    | Low (requires prior foothold)                                                                                                                                                                                                                                                                                                                                                                    |
| **Impact**        | High                                                                                                                                                                                                                                                                                                                                                                                             |
| **Mitigations**   | • `config.proxy: false` disables environment-based proxy detection entirely. <br>• `NO_PROXY` is honored (`lib/helpers/shouldBypassProxy.js`), with recent hardening for CIDR ranges, IPv6 literals, and wildcard patterns to close parser-differential edge cases. <br>• HTTPS through an HTTP proxy still validates the origin's cert (CONNECT tunnel) - the proxy sees SNI but not plaintext. |
| **Residual risk** | Low for HTTPS. **High for plain HTTP** - the proxy sees and can modify everything.                                                                                                                                                                                                                                                                                                               |

---

#### T-R10: Malicious interceptor / adapter

|                   |                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Description**   | Caller installs a third-party "axios plugin" from npm that registers an interceptor exfiltrating every `Authorization` header.                         |
| **Likelihood**    | Low–Medium                                                                                                                                             |
| **Impact**        | High                                                                                                                                                   |
| **In scope?**     | **No.** Interceptors are caller-supplied code running in the caller's process. axios provides the hook; vetting what goes into it is the caller's job. |
| **Residual risk** | Out of scope, but worth documenting: there is no meaningful difference between `axios.interceptors.request.use(evil)` and `require('evil')`.           |

---

#### T-R11: Form-data recursion DoS (deeply nested input)

|                   |                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**   | Caller passes untrusted object input as request `data` in a context that serializes to `multipart/form-data` or `application/x-www-form-urlencoded`. A pathological input with thousands of nesting levels causes `lib/helpers/toFormData.js` to recurse until stack overflow or the process is killed.                                                                     |
| **Likelihood**    | Low (requires the caller to serialize attacker-controlled object input without validation)                                                                                                                                                                                                                                                                                  |
| **Impact**        | Medium (DoS — stack overflow / process termination)                                                                                                                                                                                                                                                                                                                         |
| **Mitigations**   | • `formSerializer.maxDepth` caps recursion depth; default is 100, can be set to `Infinity` to disable. <br>• Exceeding the cap throws `AxiosError` with code `ERR_FORM_DATA_DEPTH_EXCEEDED` rather than crashing the process. <br>• Documented per locale in `docs/pages/advanced/multipart-form-data-format.md` and `docs/pages/advanced/x-www-form-urlencoded-format.md`. |
| **Residual risk** | Low when callers leave the default in place. Setting `maxDepth: Infinity` reintroduces the risk.                                                                                                                                                                                                                                                                            |

---

### 2.6 Explicit Non-Goals (Runtime)

axios will **not**:

- Sandbox or validate caller-supplied functions (interceptors, transforms, adapters, serializers).
- Validate that `config.url` points somewhere "safe." We don't know what safe means for your application.
- Warn when TLS validation is disabled via a custom agent.
- Redact `config` from thrown errors - the caller may legitimately need it for retry logic.
- Defend against a fully compromised caller process (e.g. attacker-controlled code running inside the caller). Note: for the narrower case of a **polluted `Object.prototype` arriving via a transitive dependency**, axios _does_ defend the reachable config-read gadgets (see T-R4b) — but any new config-read path must continue to use `hasOwnProp` guards to stay on this side of the line.

---

## 3. Project / Supply-Chain Threat Model

This is the model that protects **what gets published as `axios` on npm**. A successful attack here compromises every downstream consumer simultaneously. Given axios' install base, this is the higher-stakes half of the document.

### 3.1 System Overview

```
  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
  │  Maintainer's    │    │  Contributor's   │    │  GitHub.com      │
  │  workstation     │    │  fork + PR       │    │  (source of      │
  │                  │    │                  │    │   truth)         │
  │  ⚠ npm token?    │    │  untrusted code  │    │                  │
  │  ⚠ SSH keys      │    │                  │    │                  │
  │  ⚠ GPG keys      │    │                  │    │                  │
  └────────┬─────────┘    └────────┬─────────┘    └────────▲─────────┘
           │                       │                       │
           │  git push             │  PR                   │
           └───────────────────────┴───────────────────────┘
                                                           │
                                              tag push: v1.x.y
                                                           │
                                            ┌──────────────▼─────────────┐
                                            │  GitHub Actions            │
                                            │  .github/workflows/        │
                                            │    publish.yml             │
                                            │                            │
                                            │  • npm ci --ignore-scripts │
                                            │  • npm run build           │
                                            │  • npm publish             │
                                            │      --provenance          │
                                            │                            │
                                            │  OIDC → npm (no token)     │
                                            └──────────────┬─────────────┘
                                                           │
                                            ═══════════════▼═══════════════
                                                  registry.npmjs.org
                                                    axios@1.x.y
                                                  + provenance attestation
```

### 3.2 Assets

| Asset                                 | Compromise means…                                                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **The npm `axios` package name**      | Attacker can publish malware as `axios@1.x.y+1`. Game over for the ecosystem.                                                            |
| **npm publish capability**            | Whether via token, OIDC trust, or account takeover.                                                                                      |
| **GitHub `axios/axios` write access** | Attacker can push a tag → triggers publish. Or modify `publish.yml` itself.                                                              |
| **Maintainer GitHub accounts**        | Transitively grants the above.                                                                                                           |
| **Maintainer workstation secrets**    | SSH keys (→ GitHub push), `~/.npmrc` token if present (→ direct publish), GPG keys (→ signed commits), cloud creds (→ lateral movement). |
| **Build determinism**                 | If `dist/` doesn't match `lib/`, a backdoor can hide in the minified bundle.                                                             |
| **Runtime dependency integrity**      | `follow-redirects`, `form-data`, `proxy-from-env` ship inside every axios install.                                                       |

### 3.3 Trust Boundaries

1. **Contributor PRs ↔ main branch.** PRs from forks are untrusted. CI runs them, but `pull_request` workflows have no access to secrets and read-only `GITHUB_TOKEN`.
2. **Main branch ↔ release tag.** Pushing to `v1.x` does not publish. Only pushing a `v1.*.*` **tag** does. Tag push requires write access.
3. **GitHub Actions ↔ npm.** Crossed via OIDC (`id-token: write` → npm trusted publisher). No long-lived `NPM_TOKEN` secret in the repo.
4. **Maintainer workstation ↔ everything else.** This is the softest boundary. A maintainer's laptop is a high-value, low-assurance environment. **See §3.5.**

### 3.4 Threat Actors

| Actor                                           | Capability                                                                                                       | Motivation                              |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Drive-by contributor**                        | Open a PR. No secrets, no write.                                                                                 | Sneak a backdoor past review.           |
| **Compromised dependency**                      | _Attempt_ to run code on `npm install` via lifecycle scripts. Blocked on maintainer workstations (project `.npmrc`) and in CI (`--ignore-scripts` on every job). Residual execution path: plugin code under `npm run build` / `test` / `lint`. | Steal tokens, inject into build.        |
| **Phisher**                                     | Send convincing emails/DMs. No technical access.                                                                 | Maintainer GitHub/npm credential theft. |
| **Compromised maintainer account**              | Full write. Can push tags. Can edit workflows.                                                                   | Direct publish of malware.              |
| **GitHub / npm insider or platform compromise** | Out of scope. We trust the platforms.                                                                            | -                                       |

### 3.5 Threats

---

#### T-S1: Malicious code in a contributor PR

|                 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description** | Attacker opens a PR with a subtle backdoor - an obfuscated payload in a test fixture, a Unicode homoglyph in a comparison, a malicious `rollup` plugin in the config.                                                                                                                                                                                                                                                                                                  |
| **Likelihood**  | **High** (attempts are constant on high-profile repos)                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Impact**      | Critical, _if_ it lands                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Mitigations** | • Mandatory review before merge. <br>• `pull_request` workflows run with no secrets and a read-only token - a malicious test cannot exfiltrate anything from CI. <br>• `pull_request_target` is **not** used (it would grant secrets to fork code). <br>• `zizmor` lints workflow files for known-dangerous patterns. <br>• Branch protection on `v1.x`. <br>• **Path-scoped `.github/CODEOWNERS`** flags sensitive paths explicitly: runtime source (`/lib/`, `/index.*`), build/release infrastructure (`rollup.config.js`, `package.json`, `package-lock.json`, `.npmrc`), CI automation (`.github/workflows/`, `.github/dependabot.yml`, `CODEOWNERS` itself), and security-critical docs (`THREATMODEL.md`, `SECURITY.md`). Changes to these paths surface the scoped ownership rule in the PR review UI distinct from the catch-all — an audit trail that "this PR touched a sensitive path" is visible at review time.                                                                                                               |
| **Gaps**        | • Review is human and fallible. Obfuscated changes to `dist/` (if checked in) or to large test fixtures are hard to spot. <br>• No automated diffing of `lib/` → `dist/` to catch build-output tampering. <br>**Single-maintainer constraint:** with `@jasonsaayman` as sole owner on every scoped path, CODEOWNERS cannot enforce a second reviewer — two-person review on sensitive paths remains aspirational until a co-maintainer is added. Path-scoping is pre-staged for that event. |

---

#### T-S2: Compromised dev dependency steals maintainer keys

> **Historically the weakest link. Materially improved by the project-level `.npmrc` + hardware-backed maintainer keys, but still the top residual investment area** — because build-tool plugin execution (Rollup/Babel/Vitest/ESLint) is unaffected by `ignore-scripts` and runs whenever a maintainer builds or tests.

|                            |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**            | One of the ~45 direct dev dependencies - or one of their **thousands** of transitive dependencies - is compromised (maintainer account takeover, expired domain re-registration, the usual). It ships a `postinstall` script that reads `~/.npmrc`, `~/.ssh/id_*`, `~/.config/gh/hosts.yml`, `~/.aws/credentials`, `~/.gnupg/` and POSTs them to an attacker. <br><br>The next time a maintainer runs `npm install` on their workstation, the script runs **as the maintainer's user**, with full filesystem access. No exploit needed - this is npm working as designed. |
| **Likelihood**             | **Medium and rising.** This exact pattern has hit `event-stream`, `ua-parser-js`, `coa`, `rc`, `node-ipc`, `@solana/web3.js`, the Ledger connect-kit, the 2024 polyfill.io incident, and dozens more. axios' dev tree includes Babel, Rollup, Gulp, ESLint, Vitest, Playwright - each pulling hundreds of transitives. The attack surface is enormous and refreshes on every `npm install`.                                                                                                                                                                               |
| **Impact**                 | **Critical.** A stolen npm token with publish rights = direct malware publish. A stolen SSH key with GitHub push rights = tag push → publish via CI. Either path ends the same way.                                                                                                                                                                                                                                                                                                                                                                                       |
| **Current mitigations**    | • **CI is protected:** `publish.yml` runs `npm ci --ignore-scripts`, so a malicious lifecycle script cannot execute during the release build. ✅ <br>• **CI uses OIDC, not a stored token** - there is no `NPM_TOKEN` secret in GitHub for a malicious workflow step to steal. ✅ <br>• `package-lock.json` pins versions and integrity hashes - a _new_ malicious version won't arrive silently, only on explicit update. ✅ <br>• **Project-local `.npmrc` sets `ignore-scripts=true`**, so `npm install` / `npm ci` in a contributor or maintainer checkout **does not execute lifecycle scripts** (`preinstall`, `install`, `postinstall`, `prepare`) from any direct or transitive dependency. ✅ <br>• `husky` is the only `prepare` hook axios itself declares, and only writes `.git/hooks/`. With `ignore-scripts=true` it must be run manually (`npm rebuild husky && npx husky`) - documented in the README "Contributing → Local setup" section.                                                                     |
| **Gaps - the workstation** | `ignore-scripts=true` neutralizes the lifecycle-script path, but **does not neutralize build-time code execution**. A malicious Rollup / Babel / Terser / ESLint / Vitest plugin still runs when a maintainer executes `npm run build` / `npm test` / `npm run lint` - those are not lifecycle scripts, they are the maintainer explicitly invoking the tool. <br><br>The lockfile pins _which_ packages install, but if one of those pinned packages was already malicious when the lock was generated, or the maintainer runs `npm update` / `npm install <new-pkg>` without re-setting `ignore-scripts`, fresh lifecycle scripts can land. <br><br>**The development environment still has full read access to every credential the maintainer's user can read once a build tool runs.** Isolation (devcontainer / VM) remains the strongest control.                                                                                                                                      |

**Mitigations — adopted and recommended** (items marked ✅ are enforced via repo; others depend on per-maintainer discipline):

1. **Don't keep a publish-capable npm token on your workstation.**
   Publishing happens via GitHub Actions OIDC. There is no workflow that requires `npm publish` from a laptop. If `~/.npmrc` has a token, it should be read-only or scoped to unrelated packages. _If there's nothing to steal, the attack is defanged._

2. **Run `npm install` / `npm ci` with `--ignore-scripts` locally.** ✅ _Adopted: project ships a `.npmrc` with `ignore-scripts=true`._
   All `npm install` / `npm ci` runs in a contributor or maintainer checkout skip lifecycle scripts by default. To set up git hooks after install, run the one trusted script manually:

   ```
   npm rebuild husky && npx husky
   ```

   Minor inconvenience of manually running known-good post-install steps is price of not running thousands of unknown ones. Contributors adding a new dev dep must not override this flag.

3. **Develop in an isolated environment.**
   A devcontainer, VM, or sandbox profile that does not have:
   - `~/.ssh/` mounted (use a separate deploy key or SSH agent forwarding only when pushing)
   - `~/.npmrc` with publish tokens
   - `~/.config/gh/` with a `repo`-scoped GitHub token
   - `~/.aws/`, `~/.config/gcloud/`, etc.

   The dev environment should be able to read/write the repo working tree and reach the network for tests. Nothing else.

4. **Use hardware-backed keys for GitHub.** ✅ _Adopted project-wide._
   All maintainers use FIDO2/WebAuthn for GitHub auth and `sk-ssh-ed25519@openssh.com` for git push. A stolen `~/.ssh/id_ed25519_sk` is useless without the physical key. This converts "steal a file" into "steal a file AND a physical object." Each maintainer should keep a backup key registered and stored separately.

5. **Audit lockfile diffs on dependency-update PRs as carefully as code.**
   A 4000-line `package-lock.json` diff hides a lot. Tooling: `npm diff`, `lockfile-lint`, Socket.dev's PR integration. Pay particular attention to new packages with install scripts (`hasInstallScript: true` in the lockfile).

6. **Don't add dev dependencies casually.**
   Each one is a recurring trust decision delegated to a stranger. Prefer tools that can run via `npx` on demand (not in `node_modules`) or that are already in the tree.

---

#### T-S3: Phishing → maintainer account takeover

|                 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description** | Maintainer receives a convincing email: <br>• "_npm security alert: your axios package has been flagged, log in to verify ownership_" → fake npm login → password + TOTP captured and replayed in real-time. <br>• "_GitHub: @axios has been added to a new organization, review access_" → fake GitHub OAuth consent → attacker app gets `repo` scope. <br>• Social: a "recruiter" asks the maintainer to clone and `npm install` a "take-home assignment" repo. <br><br>npm and GitHub credentials for axios maintainers have been _specifically targeted_ by these campaigns in the past - this is not theoretical. |
| **Likelihood**  | **High.** These campaigns are continuous.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Impact**      | Critical. GitHub account → push tag → publish. npm account → publish directly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Mitigations** | • npm 2FA is **required** for publish on the `axios` package. <br>• OIDC publishing means there's no maintainer npm session involved in a normal release - this _narrows_ the attack to GitHub. <br>• **All maintainers authenticate to GitHub with hardware-backed WebAuthn/passkeys** (FIDO2 security keys / platform authenticators). Origin-bound credentials cannot be relayed by a phishing proxy (Evilginx, Modlishka). TOTP alone is not permitted for maintainer accounts. <br>• Git push uses `sk-ssh-ed25519@openssh.com` hardware-resident SSH keys where supported - a stolen key file is useless without the physical device.                                                                                                                           |
| **Gaps**        | • Enforcement is per-account policy, not verifiable from the repo itself. Onboarding/offboarding checklist should confirm hardware-key status. <br>• Incident-response runbook now documented in §3.7 — requires periodic rehearsal to remain useful. <br>• Each maintainer should register ≥2 hardware keys (primary + backup stored separately) to avoid lockout-driven fallback to weaker recovery methods.                                                                                                                                                                                                                                                                                                                                                             |

---

#### T-S4: Compromised runtime dependency

|                 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Description** | `follow-redirects`, `form-data`, or `proxy-from-env` ships a malicious version. Unlike T-S2, this code ends up **in the published axios bundle / runtime**, not just on maintainer machines. Every axios consumer runs it.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Likelihood**  | Low (only 3 deps; all are mature, narrowly-scoped, and watched)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Impact**      | Critical                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Mitigations** | • Three runtime deps total - minimal by design. <br>• `^` ranges in `package.json` mean consumers may get newer patch versions than the lockfile pins - this is intentional (consumers get security fixes) but means a malicious patch release of `follow-redirects` propagates without an axios release. <br>• `follow-redirects` is security-conscious and well-maintained; we track its advisories closely (multiple past axios releases were just `follow-redirects` bumps). <br>• Dependabot is configured (`.github/dependabot.yml`) for both npm and GitHub Actions, running weekly with grouped updates for production and development dependencies. |
| **Gaps**        | • No vendoring/inlining considered. The deps are small enough that vendoring is plausible but would forfeit upstream security fixes. Current judgment: not worth it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

---

#### T-S5: Build-output tampering (`dist/` ≠ `lib/`)

|                 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description** | The published tarball contains a `dist/axios.min.js` that doesn't match what `rollup` would produce from `lib/`. Nobody reads minified bundles. A backdoor here is invisible to source review. <br><br>Vectors: a malicious dev-dep Rollup/Babel/Terser plugin injects code at build time (T-S2 applied to CI), or a maintainer with a compromised workstation accidentally publishes a tampered local build.                                                                                                                                                                                                                                                                                                        |
| **Likelihood**  | Low                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Impact**      | Critical                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Mitigations** | • Builds run **only in CI** as part of `publish.yml`, from a clean `npm ci --ignore-scripts` checkout. There is no "publish from laptop" path. ✅ <br>• `--ignore-scripts` means a malicious dev dep can't tamper with `node_modules` _before_ the build, but it **can** still tamper _during_ the build if it's a Rollup/Babel plugin - those run as part of `npm run build`, not as lifecycle scripts. <br>• npm provenance (`--provenance`) cryptographically attests _which workflow on which commit_ produced the tarball. Consumers can verify with `npm audit signatures`. This proves the build ran in GitHub Actions on a known SHA - it does **not** prove the build is correct, only that it's traceable. |
| **Gaps**        | • The build is not currently **reproducible** in the strict sense - a third party cannot independently rebuild and get a byte-identical `dist/`. Timestamps, plugin ordering, and minifier nondeterminism would need to be locked down. <br>• `.github/workflows/verify-build-reproducibility.yml` performs a two-pass build-and-diff on PRs that touch build-related paths (`lib/**`, `rollup.config.js`, `package.json`, `package-lock.json`, and the workflow itself). It is currently **non-blocking** (`continue-on-error: true`) — it surfaces divergence in the CI summary so reproducibility regressions are visible, without gating merges until the build is actually deterministic. Once divergence is eliminated, remove `continue-on-error` to promote this to a hard gate. |

---

#### T-S6: Workflow file tampering

|                 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description** | Attacker with write access (or a merged PR that wasn't reviewed carefully) modifies `.github/workflows/publish.yml` to also `curl` the OIDC token somewhere, or to add a step that patches `dist/` after the build.                                                                                                                                                                                                                                                                                                                      |
| **Likelihood**  | Low                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Impact**      | Critical                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Mitigations** | • All actions are pinned to **full commit SHAs**, not tags - `actions/checkout@de0fac…` not `@v6`. A compromised action tag can't silently change behavior. ✅ <br>• `permissions:` are minimal (`contents: read`, `id-token: write`). <br>• `persist-credentials: false` on checkout - the build steps cannot push back to the repo. <br>• `zizmor` lints workflows on every PR and push to `v1.x` (`.github/workflows/zizmor.yml`); results surface as GitHub code-scanning alerts via the `security-events: write` permission on that job. This job must remain in the required-checks set on `v1.x` branch protection for the mitigation to be binding. <br>• The `npm-publish` GitHub Environment can require designated reviewers before the job runs - a tampered workflow still pauses for human approval. <br>• **CODEOWNERS now carries a path-scoped rule for `/.github/workflows/` and `/.github/CODEOWNERS` itself**, so workflow and ownership changes surface in the review UI as touching a scoped path rather than being folded into the default approval. |
| **Gaps**        | • Single-maintainer constraint (see T-S1): with one owner, the path-scoped rule cannot enforce a second reviewer on workflow changes. The rule surfaces the sensitivity but does not block single-maintainer approval. Closing this requires adding a co-maintainer.                                                                                                                                                                                                          |

---

#### T-S7: Tag confusion / replay

|                 |                                                                                                                                                                                                                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description** | Attacker with write access force-pushes an existing tag to point at a malicious commit, or pushes `v1.99.99` so that a release is published out of band.                                                                                                                                             |
| **Likelihood**  | Low (requires write access - assumed compromised at that point)                                                                                                                                                                                                                                      |
| **Impact**      | High                                                                                                                                                                                                                                                                                                 |
| **Mitigations** | • npm rejects re-publishing an existing version - re-tagging you cannot overwrite the published `1.15.0`. <br>• Provenance attestation records the commit SHA the tag pointed to _at publish time_ - forensically verifiable. Consumers can confirm with `npm audit signatures axios` (documented in SECURITY.md). <br>• **Tag protection rules**: repository setting must forbid tag deletion and force-push for the `v1.*.*` pattern. This is a GitHub UI setting (Settings → Tags → rulesets), not file-based — enforcement is auditable via the Rulesets REST API. |
| **Gaps**        | A _new_ malicious version (`v1.x.x`) is still publishable by anyone with tag-push rights - this collapses back into T-S3 (account security).                                                                                                                                                         |

---

#### T-S8: Typosquatting / dependency confusion

|                 |                                                                                                                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Description** | Attacker publishes `axois`, `axios-http`, `@axios/core`, etc., and waits for typos. Or publishes a package shadowing an internal name used in a consumer's monorepo.                                                                                                                 |
| **Likelihood**  | High (these packages already exist)                                                                                                                                                                                                                                                  |
| **Impact**      | Medium - affects confused consumers, not axios itself                                                                                                                                                                                                                                |
| **In scope?**   | Mostly out of scope; the axios project cannot police the npm namespace.                                                                                                                                                                                                              |
| **Mitigations** | • npm has typosquat detection at publish time (imperfect). <br>• The `@axios/` npm scope is **not owned** by the project - `@axios/anything` can be registered by anyone. This is a gap, not a mitigation. <br>• Provenance gives consumers a way to verify they got the real thing. |

---

### 3.6 Summary: Project Risk Posture

| Threat                       | Likelihood | Impact       | Current Posture | Priority Gap                                                          |
| ---------------------------- | ---------- | ------------ | --------------- | --------------------------------------------------------------------- |
| T-S1 Malicious PR            | High       | Critical     | 🟢 Good         | Second maintainer to enable two-person review on scoped paths         |
| **T-S2 Dev-dep steals keys** | **Medium** | **Critical** | 🟡 Partial       | **Isolated dev environment (devcontainer/VM); no publish tokens on workstations** — lifecycle scripts now blocked via project `.npmrc`, but build-tool plugins still execute |
| T-S3 Phishing                | High       | Critical     | 🟢 Good         | Document phish-response runbook; require registered backup hardware key |
| T-S4 Runtime dep compromise  | Low        | Critical     | 🟢 Good         | -                                                                     |
| T-S5 Build tampering         | Low        | Critical     | 🟡 Adequate     | Eliminate build non-determinism, then promote reproducibility check to blocking |
| T-S6 Workflow tampering      | Low        | Critical     | 🟢 Good         | Second maintainer (two-person review) for `/.github/workflows/`       |
| T-S7 Tag replay              | Low        | High         | 🟢 Good         | -                                                                     |
| T-S8 Typosquat               | High       | Medium       | ⚪ Out of scope | -                                                                     |

**The top remaining investment is T-S2** (dev-dependency compromise of maintainer workstations). Lifecycle-script execution is now blocked by the project-level `.npmrc`, and T-S3 phishing risk dropped materially once all maintainers moved to hardware-backed WebAuthn — real-time credential relay no longer works. The residual T-S2 gap is build-tool plugin execution (Rollup/Babel/Vitest/ESLint), which `ignore-scripts` does not cover; closing it requires running builds in an isolated environment without access to long-lived credentials.

---

### 3.7 Incident Response Runbook

If a maintainer suspects credential compromise (phish clicked, lost hardware key, unexpected tag/publish, leaked token in logs), execute the steps below **in order**. Speed matters more than completeness — a published malicious version affects every downstream consumer.

**1. Contain — minutes 0–15**

- **GitHub**: revoke all active sessions (`https://github.com/settings/sessions`), revoke all OAuth/PAT tokens (`/settings/tokens`, `/settings/applications`), review authorized SSH keys and remove any unrecognised. If a PAT with `repo` or `admin:org` scope existed, assume leak.
- **npm**: `npm token list` → `npm token revoke <token>` for any publish-capable token. If no CLI access, revoke via `https://www.npmjs.com/settings/<user>/tokens`. Rotate npm password + force sign-out of all sessions.
- **Workstation**: if a build/install ran malicious code, **assume full-user compromise** of the laptop. Unplug from trusted networks. Do not rely on AV; move to clean machine for rotation steps.

**2. Assess — minutes 15–60**

- Check `https://github.com/axios/axios/settings/security-log` and `https://github.com/<maintainer>/security/log` for unrecognised events (key adds, org changes, force-pushes, new tags).
- Verify recent tags match intent: `git log --tags --oneline -n 20`. Compare with `https://www.npmjs.com/package/axios?activeTab=versions`.
- For each recent publish, verify provenance: `npm audit signatures axios@<version>` and cross-check the `sourceCommit` in the provenance attestation against the tag's SHA. Divergence = investigate.
- Review `~/.npmrc`, `~/.ssh/`, `~/.config/gh/hosts.yml`, `~/.gnupg/` for tampering and unexpected files.

**3. Rotate — hour 1–4**

- Generate new SSH keys on clean hardware. Remove old keys from GitHub. If using `sk-ssh-ed25519@openssh.com`, register new hardware key first, then deregister the old one — do not leave the account with zero registered keys.
- Re-enrol WebAuthn authenticators (both primary and backup). Deregister lost/compromised authenticators.
- Rotate GPG keys if signed commits are used; upload new key to GitHub.
- Rotate any cloud credentials (`~/.aws/`, `~/.config/gcloud/`) and any tokens present on the compromised machine.

**4. Notify — hour 1 onward**

- **npm security**: `security@npmjs.com`. Include package name, suspected versions, timeline.
- **GitHub security**: `https://github.com/contact` → Security category. Request an investigation of the account.
- **Downstream**: open a GitHub security advisory (`https://github.com/axios/axios/security/advisories/new`) as soon as a malicious version is confirmed published. Do **not** wait for a fix — users need to pin away from the bad version.
- Co-maintainers (when present): notify via out-of-band channel (phone/Signal), not via a potentially compromised channel.

**5. Unpublish / deprecate — hour 1–24**

- npm allows `npm unpublish <pkg>@<version>` within **72 hours** of publish. After that, use `npm deprecate <pkg>@<version> "<reason>"` with a message pointing to the advisory.
- Publish a patched version that bumps semver above the malicious one, so `^` consumers move forward automatically.

**6. Post-mortem — within 1 week**

- Write up timeline: initial vector, dwell time, scope, mitigations applied.
- Update this threat model if the incident reveals a gap not captured here.
- File a PR if any mitigation can be codified (new CI check, new lint rule, new CODEOWNERS path).

Keep this runbook current. A runbook no one has rehearsed is a document, not a control.

---

_This document describes intent and current understanding. It does not constitute a security guarantee. To report a gap in the model itself, use the same private advisory channel as for code vulnerabilities._
