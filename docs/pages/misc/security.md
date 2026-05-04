# Security policy

## ⚠️ Decompression bomb / unbounded response buffering

By default, `maxContentLength` and `maxBodyLength` are set to `-1` (unlimited). A malicious or compromised server can return a small gzip/deflate/brotli-compressed body that expands to gigabytes, exhausting memory in the Node.js process.

**If you make requests to servers you do not fully trust, you MUST set a `maxContentLength` (and `maxBodyLength`) suitable for your workload.** The limit is enforced chunk-by-chunk during streaming decompression, so setting it is sufficient to neutralize decompression-bomb attacks.

```js
axios.get('https://example.com/data', {
  maxContentLength: 10 * 1024 * 1024, // 10 MB
  maxBodyLength: 10 * 1024 * 1024,
});

// Or globally:
axios.defaults.maxContentLength = 10 * 1024 * 1024;
axios.defaults.maxBodyLength = 10 * 1024 * 1024;
```

The default was not tightened because doing so would silently break every legitimate download larger than the chosen cap. The responsibility to pick a safe ceiling for untrusted sources rests with the application.

## Other security-sensitive options

The following request-config options have direct security implications. They are documented in full alongside the rest of the [request config](/pages/advanced/request-config), and summarised here so they show up in one place.

| Option | Risk | Mitigation |
| --- | --- | --- |
| [`socketPath`](/pages/advanced/request-config#socketpath) | If derived from untrusted input, an attacker can redirect traffic to privileged local sockets like `/var/run/docker.sock`, bypassing hostname-based SSRF protections (CWE-918). | Strip or allowlist config keys from untrusted input. Use [`allowedSocketPaths`](/pages/advanced/request-config#allowedsocketpaths) to restrict accepted socket paths. |
| [`beforeRedirect`](/pages/advanced/request-config#beforeredirect) | Runs after `follow-redirects` strips credentials on protocol downgrade. Re-injecting credentials without checking the destination protocol can leak them over plain HTTP. | Only re-add credentials for trusted HTTPS destinations. Check `options.protocol === "https:"` before assigning `auth`. |
| [`withXSRFToken`](/pages/advanced/request-config#withxsrftoken) | Setting `true` forces the XSRF header on cross-origin requests. Older axios versions implicitly enabled this with `withCredentials: true`; newer versions require both flags. | Leave at `undefined` (same-origin only) unless your backend explicitly validates XSRF on cross-origin requests. |
| [`redact`](/pages/advanced/request-config#redact) | `AxiosError#toJSON()` includes the request config by default, which can leak `Authorization` headers or `auth` credentials into error logs and telemetry. | Pass a `redact` array with sensitive config key names. Matching is case-insensitive and recursive. |
| [`formDataHeaderPolicy`](/pages/advanced/request-config#formdataheaderpolicy) | A custom `FormData` whose `getHeaders()` returns attacker-controlled values can overwrite headers like `Authorization` or inject arbitrary ones in Node.js. | Set `'content-only'` to copy only `Content-Type` and `Content-Length`, then set other headers explicitly via the request `headers` config. |

## Supply-chain hardening: `ignore-scripts` and lifecycle scripts

The repository ships a project-level `.npmrc` that sets `ignore-scripts=true`. This blocks npm lifecycle scripts (`preinstall`, `install`, `postinstall`, `prepare`) from any direct or transitive dependency when running `npm install` or `npm ci` inside the repo. See [THREATMODEL.md](https://github.com/axios/axios/blob/v1.x/THREATMODEL.md) (threat T-S2) for the rationale.

One consequence: the repository's own `prepare` hook (which installs Husky's git hooks) does **not** run automatically. After your first install, enable the git hooks manually:

```bash
npm ci
npm rebuild husky && npx husky
```

Run those two commands once per fresh checkout. You do **not** need to re-run them after every subsequent `npm install`.

::: danger Do not remove `ignore-scripts=true`
Removing `ignore-scripts=true` from `.npmrc` to "fix" the husky setup re-opens the lifecycle-script attack surface for every other package in the tree. All CI workflows already invoke npm with `--ignore-scripts`, so local behaviour matches CI.
:::

We recommend the same `ignore-scripts=true` setting in any consumer project that pulls axios (or any other dependency) into a build environment that handles secrets.

## Verifying a Release

Every `axios` tarball on npm is published from GitHub Actions with an [npm provenance attestation](https://docs.npmjs.com/generating-provenance-statements) that cryptographically binds the package to the workflow and commit SHA that produced it.

Consumers can verify provenance locally:

```bash
# Verify every package in your lockfile, including axios
npm audit signatures
```

A successful verification proves the tarball was built in `axios/axios`' GitHub Actions environment on a known commit — it was not tampered with between build and registry. It does **not** prove the code in that commit is free of bugs.

If `npm audit signatures` reports a missing or invalid attestation for a recent `axios` version, treat it as a potential supply-chain incident and report via the private channel below.

## Reporting a Vulnerability

If you believe you have found a security vulnerability in the project, please report it to us as described below. We take all security vulnerabilities seriously. If you have found a vulnerability in a third-party library, please report it to the maintainers of that library.

## Reporting Process

Please do not report security vulnerabilities through public GitHub issues. Please use the official security channel on GitHub by logging a [security advisory](https://github.com/axios/axios/security/advisories/new).

## Disclosure Policy

When we receive a security vulnerability report, we assign it a primary handler. The handler confirms the problem, determines affected versions, evaluates severity, develops and ships a fix, and coordinates public disclosure with the reporter.

### 60-day resolution and disclosure commitment

We commit to **resolving and publicly disclosing every valid security advisory within 60 calendar days of the initial report**, measured from the moment a report is received via the [GitHub security advisory channel](https://github.com/axios/axios/security/advisories/new).

The 60-day clock is a commitment to reporters and downstream consumers — a backstop, not an aspiration. If we cannot ship a fix in time, we still publish the advisory at day 60 with the best available mitigation guidance so consumers can act.

**Milestones inside the 60-day window:**

| Day  | Milestone                                                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Report received. Private advisory opened on GitHub.                                                                                      |
| ≤ 3  | Acknowledgement sent to reporter. Triage decision: in scope / out of scope / duplicate / needs-info.                                     |
| ≤ 10 | Severity assessed (CVSS v4 where applicable). Affected versions confirmed. CVE requested via GitHub if a public identifier is warranted. |
| ≤ 45 | Fix developed, reviewed, tested. Release candidate prepared on a private branch. Reporter offered a preview for validation.              |
| ≤ 60 | Patched release published to npm. Public advisory + CVE published. Reporter credited unless they request otherwise. CHANGELOG updated.   |

**Exceptions and extensions.**

- If a reporter requests a shorter embargo (e.g. they plan to present findings at a conference), we accommodate where possible.
- If a fix requires a breaking change, coordinating with major downstream consumers, or a `follow-redirects` / `form-data` / `proxy-from-env` upstream release, we may extend beyond 60 days. Any extension is disclosed publicly at day 60 via the advisory, with a revised ETA and the reason.
- If a report is **out of scope** (e.g. falls under an explicit non-goal documented in the project's [threat model](https://github.com/axios/axios/blob/v1.x/THREATMODEL.md)), we close it with an explanation to the reporter within the triage window (≤ 3 days). Out-of-scope reports do not enter the 60-day queue.
- **Actively exploited vulnerabilities** are treated as incidents: fix and advisory ship as soon as a patch is validated, not on the 60-day schedule.

**Reporter expectations.**

While a report is under embargo, we ask reporters to refrain from public disclosure until the earlier of: (a) the coordinated advisory publication, or (b) day 60. If the 60-day deadline passes without action from us, reporters are free to disclose independently — we will treat that as a failure on our part, not on theirs.

## Security Updates

Security updates are released as soon as possible after the patch has been developed and tested. We notify users of the release via the project's GitHub repository and publish release notes and security advisories on the GitHub releases page. We also deprecate all versions that contain the vulnerability.

## Maintainer-side incident response

For compromise scenarios affecting maintainer accounts, workstations, or release infrastructure (phishing, stolen hardware key, unexpected tag/publish), the project maintains an internal incident-response runbook in [THREATMODEL.md §3.7](https://github.com/axios/axios/blob/v1.x/THREATMODEL.md#37-incident-response-runbook). It covers session revocation, key rotation, downstream notification, and unpublish/deprecate procedures.

## Security Partners and Acknowledgements

We would like to thank the following security researchers for working with us to help make the project safe for everyone:

- [Socket Dev](https://socket.dev/)
- [GitHub Security Lab](https://securitylab.github.com/)
