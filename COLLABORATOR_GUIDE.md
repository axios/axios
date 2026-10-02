# Collaborator guide

As a collaborator, you help administer axios. This guide covers the responsibilities that come with that access. For architecture, lifecycle, security-sensitive code, and conventions, use [AGENTS.md](./AGENTS.md), the canonical contributor guide.

## Code of conduct

Read the [Code of Conduct](./CODE_OF_CONDUCT.md) and help enforce it. Keep the community friendly and welcoming.

## Triage issues

- Apply appropriate labels and respond as needed.
- For bug reports, ask for a minimal reproduction (axios version, environment, request/response details) before deeper triage.
- If an issue is not directly about axios, convert it to a discussion.
- Close issues only when they are resolved, a fix is merged, the report lacks enough detail or a reproduction, or the reporter requests closure. Do not close issues for inactivity. We want to keep the history and respond if more information comes in later.

## Answer questions

Be helpful and patient. If a question comes from unclear docs, update the docs and consider adding an example instead of only answering in the thread. You are not expected to teach JavaScript or unrelated tooling. Redirect those questions politely.

## Submit PRs

When opening a PR, make sure:

- The change fits within axios. Decline features early and kindly when they belong in user code or a plugin.
- Cover behavior across the XHR, Fetch, and Node HTTP adapters where relevant. Detect by capability, not environment name.
- Update both `index.d.ts` (ESM) and `index.d.cts` (CJS) when the public API changes.
- Make axios-originated failures throw `AxiosError` with an appropriate code, never raw `Error`. Wrap third-party errors with `AxiosError.from`.
- Cover the change with unit tests. Update browser, smoke, or module suites when packaging or runtime surface is affected.
- Lint and tests pass before review. Do not merge red PRs.
- Do not add runtime dependencies without discussion. `package-lock.json` changes must keep `lockfile-lint` happy (npm HTTPS hosts, integrity hashes).
- Package and GitHub Actions update PRs are maintainer/bot-only. Close PRs from outside collaborators that only update npm packages, lockfiles, or GitHub Actions versions.
- Keep the 7-day Dependabot delay for these updates. Bypass it only when a critical vulnerability requires a maintainer-led manual update.
- Security-sensitive changes get extra scrutiny and focused regression tests. This includes URL construction, redirects, proxy/env handling, XSRF, socket paths, decompression limits, prototype walking, and adapters. Consult [THREATMODEL.md](./THREATMODEL.md).
- Warn before removing functionality.
- New public API surface is predictable, consistent with existing options, and documented.
- PR titles use [Conventional Commits](https://www.conventionalcommits.org/) (`fix:`, `feat:`, `chore:`, `docs:`, etc.). Release tooling depends on this.
- Call out whether the change is patch, minor, or breaking, and target the right branch (`v1.x` for the current maintenance line; breaking work goes elsewhere).

At least one maintainer must review and approve a PR before merge. If you are unsure about the impact of a change, ask for a second opinion. Call out breaking changes in the PR description and send them to the appropriate branch. Bug fixes need a test that reproduces the issue and verifies the fix.

If changes are requested, address them promptly. If you cannot make the changes, say so clearly so someone else can pick them up.

> [!IMPORTANT]
> We wait up to 28 days for a response to requested changes before closing the PR as stale. After that, we will either address the issue in a maintainer-led PR or open an issue for other contributors. If the author wants to continue the work, they should recreate the PR from the latest version of the correct target branch, address all feedback, and request review from a maintainer.

## Security disclosures

If someone reports a suspected vulnerability in a public issue, do not discuss specifics in the thread. Redirect them to the process described in [SECURITY.md](./SECURITY.md) (GitHub security advisories) and close or hide the issue as appropriate.

## What collaborators should not do

- Add runtime dependencies without discussion. The dependency surface is intentionally tiny.
- Merge package, lockfile, or GitHub Actions version update PRs from outside collaborators.
- Disable `ignore-scripts` in `.npmrc` or otherwise weaken install-time safety.
- Weaken `beforeRedirect`, proxy, `socketPath`, XSRF, or prototype-pollution safeguards without tests covering the regression cases.

---

Thanks for helping keep axios healthy. If you are unsure about a call, ask another collaborator before acting. We would rather move a little slower than ship a regression. If you have questions about your role or responsibilities, contact the maintainers.
