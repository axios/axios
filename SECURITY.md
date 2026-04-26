# Security Policy

## Supported Versions

The following versions will receive security updates promptly based on the maintainers' discretion.

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |
| 1.x.x   | :white_check_mark: |

## Threat Model

For a detailed analysis of the runtime attack surface and the project's supply-chain / development-environment security posture, see [THREATMODEL.md](THREATMODEL.md). Researchers are encouraged to read it before reporting — it documents what is in scope, what is an explicit non-goal, and where we already know the gaps are.

An incident-response runbook (for the maintainer side — session revocation, key rotation, notification) is maintained in [THREATMODEL.md §3.7](THREATMODEL.md#37-incident-response-runbook).

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

Please do not report security vulnerabilities through public GitHub issues. Please use the official security channel on GitHub by logging a [security advisory](https://github.com/axios/axios/security).

## Disclosure Policy

When we receive a security vulnerability report, we assign it a primary handler. The handler confirms the problem, determines affected versions, evaluates severity, develops and ships a fix, and coordinates public disclosure with the reporter.

### 60-day resolution and disclosure commitment

We commit to **resolving and publicly disclosing every valid security advisory within 60 calendar days of the initial report**, measured from the moment a report is received via the [GitHub security advisory channel](https://github.com/axios/axios/security/advisories/new).

The 60-day clock is a commitment to reporters and downstream consumers — a backstop, not an aspiration. If we cannot ship a fix in time, we still publish the advisory at day 60 with the best available mitigation guidance so consumers can act.

**Milestones inside the 60-day window:**

| Day     | Milestone                                                                                                                                 |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 0       | Report received. Private advisory opened on GitHub.                                                                                       |
| ≤ 3     | Acknowledgement sent to reporter. Triage decision: in scope / out of scope / duplicate / needs-info.                                      |
| ≤ 10    | Severity assessed (CVSS v4 where applicable). Affected versions confirmed. CVE requested via GitHub if a public identifier is warranted.  |
| ≤ 45    | Fix developed, reviewed, tested. Release candidate prepared on a private branch. Reporter offered a preview for validation.               |
| ≤ 60    | Patched release published to npm. Public advisory + CVE published. Reporter credited unless they request otherwise. CHANGELOG updated. |

**Exceptions and extensions.**

- If a reporter requests a shorter embargo (e.g. they plan to present findings at a conference), we accommodate where possible.
- If a fix requires a breaking change, coordinating with major downstream consumers, or a `follow-redirects` / `form-data` / `proxy-from-env` upstream release, we may extend beyond 60 days. Any extension is disclosed publicly at day 60 via the advisory, with a revised ETA and the reason.
- If a report turns out to be **out of scope** (e.g. falls under an explicit non-goal in [THREATMODEL.md §2.6](THREATMODEL.md)), we close it with an explanation to the reporter within the triage window (≤ 3 days). Out-of-scope reports do not enter the 60-day queue.
- **Actively exploited vulnerabilities** are treated as incidents: fix and advisory ship as soon as a patch is validated, not on the 60-day schedule.

**Reporter expectations.**

While a report is under embargo, we ask reporters to refrain from public disclosure until the earlier of: (a) the coordinated advisory publication, or (b) day 60. If the 60-day deadline passes without action from us, reporters are free to disclose independently — but we will treat that as a failure on our part, not on theirs.

## Security Updates

Security updates will be released as soon as possible after the patch has been developed and tested. We will notify users of the release via the project’s GitHub repository. We will also publish the release notes and security advisories on the project’s GitHub releases page. We will also deprecate all versions that contain the security vulnerability.

## Security Partners and Acknowledgements

We would like to thank the following security researchers for working with us to help make the project safe for everyone:

- [Socket Dev](https://socket.dev/)
- [GitHub Security Lab](https://securitylab.github.com/)
