# Collaborator Guide

As a collaborator you share in the administrative responsibility for axios. This guide covers what we expect from you and how we keep the project healthy. For the technical bar (architecture, lifecycle, security-sensitive code, conventions), see [AGENTS.md](./AGENTS.md) — it is the canonical contributor guide.

## Code of Conduct

You are expected to have read the [Code of Conduct](./CODE_OF_CONDUCT.md) and to help enforce it. This community should be friendly and welcoming.

## Triage Issues

- Apply appropriate labels and respond as needed.
- For bug reports, ask for a minimal reproduction (axios version, environment, request/response details) before deeper triage.
- If an issue is not directly about axios, convert it to a discussion.
- Issues will only be closed when they are resolved, a fix is merged, lack of clarity and/or reproduction or the reporter requests closure. Do not close issues for inactivity we want to keep the history and be responsive if more information comes in later.

## Answer Questions

Be helpful and patient. If a question stems from unclear docs, update the docs (and consider adding an example) rather than just answering in the thread. You are not obligated to teach JavaScript or unrelated tooling — redirect those politely.

## Submit PRs

When opening a PR make sure:

- **Scope:** the change fits within axios. Features that belong in user code or a plugin should be declined early and kindly.
- **Platform parity:** behavior is covered across the XHR, Fetch, and Node HTTP adapters where relevant. Detect by capability, not environment name.
- **Type definitions:** both `index.d.ts` (ESM) and `index.d.cts` (CJS) are updated when the public API changes.
- **Errors:** axios-originated failures throw `AxiosError` with an appropriate code, never raw `Error`. Third-party errors are wrapped with `AxiosError.from`.
- **Tests:** unit tests cover the change; browser/smoke/module suites are updated when packaging or runtime surface is affected.
- **CI:** lint and tests pass before requesting review. Do not merge red PRs.
- **Dependencies:** no new runtime dependencies without discussion. `package-lock.json` changes must keep `lockfile-lint` happy (npm HTTPS hosts, integrity hashes).
- **Security-sensitive areas:** changes touching URL construction, redirects, proxy/env handling, XSRF, socket paths, decompression limits, prototype walking, or adapters get extra scrutiny and focused regression tests. Consult [THREATMODEL.md](./THREATMODEL.md).
- **Deprecations:** removed functionality is properly deprecated with a warning first.
- **API shape:** new public surface is predictable, consistent with existing options, and documented.
- **Commit title:** PRs use [Conventional Commits](https://www.conventionalcommits.org/) (`fix:`, `feat:`, `chore:`, `docs:`, etc.) — release tooling depends on this.
- **Semver impact:** call out whether this is a patch, minor, or breaking change, and target the right branch (`v1.x` for the current maintenance line; breaking work goes elsewhere).

At least one maintainer must review and approve the PR before it can be merged. If you are unsure about the impact of a change, ask for a second opinion. If you are making a breaking change, make sure to call it out in the PR description and target the appropriate branch. If you are fixing a bug, make sure to include a test that reproduces the issue and verifies the fix.

If changes are requested, address them in a timely manner. If you are unable to make the changes, communicate that clearly so someone else can pick it up.

> [!IMPORTANT]  
> We will wait a maximum of 21 days for a response to requested changes before closing the PR. If the PR is closed due to inactivity, it can be reopened if the requested changes are made.

## Security Disclosures

If someone reports a suspected vulnerability in a public issue, do not discuss specifics in the thread. Redirect them to the process described in [SECURITY.md](./SECURITY.md) (GitHub security advisories) and close or hide the issue as appropriate.

## What Collaborators Should Not Do

- Add runtime dependencies unilaterally — the dependency surface is intentionally tiny.
- Disable `ignore-scripts` in `.npmrc` or otherwise weaken install-time safety.
- Weaken `beforeRedirect`, proxy, `socketPath`, XSRF, or prototype-pollution safeguards without tests covering the regression cases.

---

Thank you for helping keep axios healthy. If you are unsure about a call, ask another collaborator before acting, we would rather move a little slower than ship a regression. If you have any questions about your role or responsibilities, please reach out to the maintainers.
