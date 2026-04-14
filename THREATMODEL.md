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

|                   |                                                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**   | Application puts user input into a header value: `headers: { 'X-User': req.query.name }`. Attacker supplies `foo\r\nX-Injected: bar\r\n\r\n<body>`.                                   |
| **Likelihood**    | Low                                                                                                                                                                                   |
| **Impact**        | Medium–High (request smuggling, response splitting)                                                                                                                                   |
| **Mitigations**   | `lib/core/AxiosHeaders.js` rejects header values containing `\r` or `\n`, and validates header names against an RFC-7230-shaped charset. Node's own `http` module also rejects these. |
| **Residual risk** | Very low. Defense in depth (axios + Node).                                                                                                                                            |

---

#### T-R4: Prototype pollution via response body

|                   |                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**   | Server returns `{"__proto__": {"isAdmin": true}}`. If axios merged this into an object naively, every `{}` in the process would gain `.isAdmin`.                                                                                                                                                                                                                                                  |
| **Likelihood**    | Low (requires a downstream gadget to be exploitable)                                                                                                                                                                                                                                                                                                                                              |
| **Impact**        | High (process-wide state corruption, sometimes RCE)                                                                                                                                                                                                                                                                                                                                               |
| **Mitigations**   | • `JSON.parse` itself does not pollute (it creates own-properties named `__proto__`, not prototype links). <br>• Internal merge paths filter dangerous keys: `lib/utils.js` and `lib/core/mergeConfig.js` filter `__proto__` / `constructor` / `prototype`; `lib/helpers/formDataToJSON.js` filters `__proto__`. <br>• These were added in response to past advisories - regression here is a P0. |
| **Residual risk** | Low, but this is an area of active attacker interest. New merge helpers MUST go through the same filtering.                                                                                                                                                                                                                                                                                       |

---

#### T-R5: Decompression bomb

|                   |                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**   | Server sends `Content-Encoding: gzip` with a 10 KB body that decompresses to 10 GB.                                                                                                                                                                                                                                                                                          |
| **Likelihood**    | Low                                                                                                                                                                                                                                                                                                                                                                          |
| **Impact**        | Medium (DoS - OOM kill of the calling process)                                                                                                                                                                                                                                                                                                                               |
| **Mitigations**   | • `maxContentLength` bounds the **decompressed** response size in the Node adapter (`lib/adapters/http.js`). <br>• `maxBodyLength` bounds the request side. <br>• Both default to `-1` (unlimited). **Callers handling untrusted servers should set these.** <br>• Decompression uses Node's `zlib`, which streams - memory is bounded by the limit, not the full expansion. |
| **Residual risk** | Medium when limits are not configured. The defaults favor compatibility over safety.                                                                                                                                                                                                                                                                                         |

---

#### T-R6: TLS validation bypass

|                   |                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Description**   | Caller passes `httpsAgent: new https.Agent({ rejectUnauthorized: false })` to "fix" a cert error in dev, ships it to prod.     |
| **Likelihood**    | Medium (very common copy-paste anti-pattern)                                                                                   |
| **Impact**        | High (silent MITM)                                                                                                             |
| **In scope?**     | **No.** axios delegates TLS entirely to Node's `https` module / the browser. We do not inspect or warn on agent configuration. |
| **Mitigations**   | None at the axios layer. Documentation responsibility only.                                                                    |
| **Residual risk** | High, but explicitly out of scope. This is caller misconfiguration, not an axios vulnerability.                                |

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

|                   |                                                                                                                                                                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**   | Attacker controls the process environment (compromised CI step, container escape, `.env` injection) and sets `HTTPS_PROXY=http://evil.com:8080`. All axios traffic is now MITM'd.                                                                                           |
| **Likelihood**    | Low (requires prior foothold)                                                                                                                                                                                                                                               |
| **Impact**        | High                                                                                                                                                                                                                                                                        |
| **Mitigations**   | • `config.proxy: false` disables environment-based proxy detection entirely. <br>• `NO_PROXY` is honored (`lib/helpers/shouldBypassProxy.js`). <br>• HTTPS through an HTTP proxy still validates the origin's cert (CONNECT tunnel) - the proxy sees SNI but not plaintext. |
| **Residual risk** | Low for HTTPS. **High for plain HTTP** - the proxy sees and can modify everything.                                                                                                                                                                                          |

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

### 2.6 Explicit Non-Goals (Runtime)

axios will **not**:

- Sandbox or validate caller-supplied functions (interceptors, transforms, adapters, serializers).
- Validate that `config.url` points somewhere "safe." We don't know what safe means for your application.
- Warn when TLS validation is disabled via a custom agent.
- Redact `config` from thrown errors - the caller may legitimately need it for retry logic.
- Defend against a caller that has already been compromised (e.g. polluted `Object.prototype` before calling axios).

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
| **Compromised dependency**                      | Run code on `npm install` (lifecycle scripts) on every machine that installs it - including maintainers' and CI. | Steal tokens, inject into build.        |
| **Phisher**                                     | Send convincing emails/DMs. No technical access.                                                                 | Maintainer GitHub/npm credential theft. |
| **Compromised maintainer account**              | Full write. Can push tags. Can edit workflows.                                                                   | Direct publish of malware.              |
| **GitHub / npm insider or platform compromise** | Out of scope. We trust the platforms.                                                                            | -                                       |

### 3.5 Threats

---

#### T-S1: Malicious code in a contributor PR

|                 |                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description** | Attacker opens a PR with a subtle backdoor - an obfuscated payload in a test fixture, a Unicode homoglyph in a comparison, a malicious `rollup` plugin in the config.                                                                                                                                                                                    |
| **Likelihood**  | **High** (attempts are constant on high-profile repos)                                                                                                                                                                                                                                                                                                   |
| **Impact**      | Critical, _if_ it lands                                                                                                                                                                                                                                                                                                                                  |
| **Mitigations** | • Mandatory review before merge. <br>• `pull_request` workflows run with no secrets and a read-only token - a malicious test cannot exfiltrate anything from CI. <br>• `pull_request_target` is **not** used (it would grant secrets to fork code). <br>• `zizmor` lints workflow files for known-dangerous patterns. <br>• Branch protection on `v1.x`. |
| **Gaps**        | • Review is human and fallible. Obfuscated changes to `dist/` (if checked in) or to large test fixtures are hard to spot. <br>• No automated diffing of `lib/` → `dist/` to catch build-output tampering. <br>• No `CODEOWNERS` requiring specific reviewers for `lib/`, `.github/`, `rollup.config.js`.                                                 |

---

#### T-S2: Compromised dev dependency steals maintainer keys ⚠

> **This is the threat the project is least defended against today.**

|                            |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**            | One of the ~45 direct dev dependencies - or one of their **thousands** of transitive dependencies - is compromised (maintainer account takeover, expired domain re-registration, the usual). It ships a `postinstall` script that reads `~/.npmrc`, `~/.ssh/id_*`, `~/.config/gh/hosts.yml`, `~/.aws/credentials`, `~/.gnupg/` and POSTs them to an attacker. <br><br>The next time a maintainer runs `npm install` on their workstation, the script runs **as the maintainer's user**, with full filesystem access. No exploit needed - this is npm working as designed. |
| **Likelihood**             | **Medium and rising.** This exact pattern has hit `event-stream`, `ua-parser-js`, `coa`, `rc`, `node-ipc`, `@solana/web3.js`, the Ledger connect-kit, the 2024 polyfill.io incident, and dozens more. axios' dev tree includes Babel, Rollup, Gulp, ESLint, Vitest, Playwright - each pulling hundreds of transitives. The attack surface is enormous and refreshes on every `npm install`.                                                                                                                                                                               |
| **Impact**                 | **Critical.** A stolen npm token with publish rights = direct malware publish. A stolen SSH key with GitHub push rights = tag push → publish via CI. Either path ends the same way.                                                                                                                                                                                                                                                                                                                                                                                       |
| **Current mitigations**    | • **CI is protected:** `publish.yml` runs `npm ci --ignore-scripts`, so a malicious lifecycle script cannot execute during the release build. ✅ <br>• **CI uses OIDC, not a stored token** - there is no `NPM_TOKEN` secret in GitHub for a malicious workflow step to steal. ✅ <br>• `package-lock.json` pins versions and integrity hashes - a _new_ malicious version won't arrive silently, only on explicit update. ✅ <br>• `husky` is the only `prepare` hook and only writes `.git/hooks/`.                                                                     |
| **Gaps - the workstation** | None of the above protects a maintainer running `npm install` **locally**. The lockfile pins _which_ packages install, but if one of those pinned packages was _already_ malicious when the lock was generated, or if a maintainer runs `npm update` / `npm install <new-pkg>`, the scripts run. <br><br>**The development environment has full read access to every credential the maintainer's user can read.** That's the threat.                                                                                                                                      |

**Mitigations maintainers SHOULD adopt** (in roughly descending order of effectiveness):

1. **Don't keep a publish-capable npm token on your workstation.**
   Publishing happens via GitHub Actions OIDC. There is no workflow that requires `npm publish` from a laptop. If `~/.npmrc` has a token, it should be read-only or scoped to unrelated packages. _If there's nothing to steal, the attack is defanged._

2. **Run `npm install` / `npm ci` with `--ignore-scripts` locally.**
   Add to a project-local `.npmrc`:

   ```
   ignore-scripts=true
   ```

   Then explicitly run the one trusted script you need:
   `npm rebuild husky && npx husky`. The minor inconvenience of manually running known-good post-install steps is the price of not running thousands of unknown ones.

3. **Develop in an isolated environment.**
   A devcontainer, VM, or sandbox profile that does not have:
   - `~/.ssh/` mounted (use a separate deploy key or SSH agent forwarding only when pushing)
   - `~/.npmrc` with publish tokens
   - `~/.config/gh/` with a `repo`-scoped GitHub token
   - `~/.aws/`, `~/.config/gcloud/`, etc.

   The dev environment should be able to read/write the repo working tree and reach the network for tests. Nothing else.

4. **Use hardware-backed keys for GitHub.**
   FIDO2/WebAuthn for the GitHub account, and `sk-ssh-ed25519@openssh.com` for git push. A stolen `~/.ssh/id_ed25519_sk` is useless without the physical key. This converts "steal a file" into "steal a file AND a physical object."

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
| **Mitigations** | • npm 2FA is **required** for publish on the `axios` package. <br>• But: TOTP 2FA is **phishable** via real-time relay (Evilginx, Modlishka). <br>• OIDC publishing means there's no maintainer npm session involved in a normal release - this _narrows_ the attack to GitHub. <br>• GitHub: maintainers should use **WebAuthn/passkeys**, which are origin-bound and cannot be relayed by a phishing proxy. TOTP is not sufficient for an account guarding a package this widely deployed.                                                                                                                           |
| **Gaps**        | • This is a _policy_ control, not enforceable in the repo. The project cannot verify what 2FA method each maintainer uses. <br>• No documented "I think I've been phished" runbook (revoke sessions, rotate keys, audit recent tags, contact npm support).                                                                                                                                                                                                                                                                                                                                                             |

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
| **Gaps**        | • The build is not currently **reproducible** in the strict sense - a third party cannot independently rebuild and get a byte-identical `dist/`. Timestamps, plugin ordering, and minifier nondeterminism would need to be locked down. <br>• No automated `dist/`-vs-rebuild diff in CI. This is the cheapest available improvement.                                                                                                                                                                                                                                                                                                                                                                                |

---

#### T-S6: Workflow file tampering

|                 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description** | Attacker with write access (or a merged PR that wasn't reviewed carefully) modifies `.github/workflows/publish.yml` to also `curl` the OIDC token somewhere, or to add a step that patches `dist/` after the build.                                                                                                                                                                                                                                                                                                                      |
| **Likelihood**  | Low                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Impact**      | Critical                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Mitigations** | • All actions are pinned to **full commit SHAs**, not tags - `actions/checkout@de0fac…` not `@v6`. A compromised action tag can't silently change behavior. ✅ <br>• `permissions:` are minimal (`contents: read`, `id-token: write`). <br>• `persist-credentials: false` on checkout - the build steps cannot push back to the repo. <br>• `zizmor` lints workflows on every PR. <br>• The `npm-publish` GitHub Environment can require designated reviewers before the job runs - a tampered workflow still pauses for human approval. |
| **Gaps**        | • No `CODEOWNERS` rule requiring extra scrutiny on `.github/workflows/**`. A workflow change can currently be approved by any single maintainer.                                                                                                                                                                                                                                                                                                                                                                                         |

---

#### T-S7: Tag confusion / replay

|                 |                                                                                                                                                                                                                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description** | Attacker with write access force-pushes an existing tag to point at a malicious commit, or pushes `v1.99.99` to publish out of band.                                                                                                                                                           |
| **Likelihood**  | Low (requires write access - assumed compromised at that point)                                                                                                                                                                                                                                            |
| **Impact**      | High                                                                                                                                                                                                                                                                                                       |
| **Mitigations** | • npm rejects re-publishing an existing version - re-tagging you cannot overwrite the published `1.15.0`. <br>• Provenance attestation records the commit SHA the tag pointed to _at publish time_ - forensically verifiable. <br>• GitHub tag protection rules can prevent tag deletion/force-push. |
| **Gaps**        | A _new_ malicious version (`v1.x.x`) is still publishable by anyone with tag-push rights - this collapses back into T-S3 (account security).                                                |

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

| Threat                       | Likelihood | Impact       | Current Posture | Priority Gap                                                    |
| ---------------------------- | ---------- | ------------ | --------------- | --------------------------------------------------------------- |
| T-S1 Malicious PR            | High       | Critical     | 🟡 Adequate     | Add CODEOWNERS for sensitive paths                              |
| **T-S2 Dev-dep steals keys** | **Medium** | **Critical** | **🔴 Weak**     | **Local `--ignore-scripts`; no publish tokens on workstations** |
| **T-S3 Phishing**            | **High**   | **Critical** | **🟡 Partial**  | **Mandate WebAuthn (not TOTP) for maintainer GitHub accounts**  |
| T-S4 Runtime dep compromise  | Low        | Critical     | 🟢 Good         | -                                                               |
| T-S5 Build tampering         | Low        | Critical     | 🟡 Adequate     | Reproducible-build verification step                            |
| T-S6 Workflow tampering      | Low        | Critical     | 🟢 Good         | CODEOWNERS on `.github/`                                        |
| T-S7 Tag replay              | Low        | High         | 🟢 Good         | -                                                               |
| T-S8 Typosquat               | High       | Medium       | ⚪ Out of scope | -                                                               |

**The two threats most worth investing in are T-S2 and T-S3.** Both target the maintainer rather than the code, both bypass every in-repo control, and both have well-understood, low-cost mitigations that are currently a matter of individual maintainer discipline rather than enforced policy.

---

_This document describes intent and current understanding. It does not constitute a security guarantee. To report a gap in the model itself, use the same private advisory channel as for code vulnerabilities._
