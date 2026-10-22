---
name: oss-ghsa-fix
description: Plan and implement fixes for open source GitHub Security Advisory reports. Use when the user asks to fix, patch, remediate, or implement a GHSA before public release; fetches the advisory with `gh`, presents a plan for approval, then implements without leaking unpublished advisory details or editing release documentation in the source repository. Trigger on `/oss-ghsa-fix` with an advisory ID or URL.
---

# OSS GHSA Fix

Use this command when the user wants to implement a fix for a GitHub Security Advisory in an open source repository before the fix is publicly released.

This workflow is gated. First fetch the advisory with the GitHub CLI, investigate, write a plan, present the plan to the user, and stop. Only implement after the user explicitly says to continue.

## Non-Negotiable Rules

- Fetch the GHSA with `gh` before planning. Do not rely on memory, web search, or pasted summaries until the `gh` fetch has been attempted.
- Treat all advisory details as confidential until the user says the release is public.
- Before implementation, present a plan and wait. Do not edit, commit, push, or create files before approval.
- During implementation, public artifacts must not mention the GHSA ID, GHSA URL, advisory state, reporter, CVE, or unpublished vulnerability framing.
- Do not edit pre-release docs, release notes, changelogs, changesets, or unreleased changelog directories in the source repository.
- Write required release-communication drafts only to a separate location explicitly approved by the user or designated by repository guidance.

## Inputs

The user should provide a GHSA ID or GitHub advisory URL. Accept forms such as:

- `GHSA-xxxx-xxxx-xxxx`
- `https://github.com/<owner>/<repo>/security/advisories/GHSA-xxxx-xxxx-xxxx`
- `https://github.com/advisories/GHSA-xxxx-xxxx-xxxx`

If the user does not provide a GHSA ID or URL, ask one short question:

> Which GHSA should I plan a fix for? Provide a GHSA ID or GitHub advisory URL.

If the user provides only a CVE, resolve it through `gh api` before continuing:

```bash
gh api --method GET /advisories -f cve_id=<CVE-ID>
```

If this does not identify exactly one GHSA, ask the user for the GHSA ID or repository advisory URL.

## Phase 1 - Resolve Repo And Fetch Advisory

Determine repository context before fetching:

- If the advisory URL includes `<owner>/<repo>`, use that repository.
- Otherwise, if running inside a GitHub-backed repo, use `gh repo view --json nameWithOwner -q .nameWithOwner`.
- If no repository can be resolved, only use the global advisory endpoint and avoid repo-specific claims.

For a GHSA ID, prefer the repository endpoint when a repo is known because draft or private advisories may only exist there:

```bash
gh api repos/<owner>/<repo>/security-advisories/<GHSA-ID>
```

If that fails or no repository is known, try the global endpoint:

```bash
gh api advisories/<GHSA-ID>
```

Capture at least:

- Advisory ID, URL, title/summary, description, severity, state, and publication status.
- Affected package ecosystem, package names, vulnerable ranges, and patched versions.
- CVSS data, CWEs, references, credits, and timestamps.
- Any maintainer-only fields returned by the repository endpoint.

If the advisory cannot be fetched with `gh`, stop and tell the user which command failed. Do not continue by guessing.

## Phase 2 - Investigate Privately

Build enough context to create a credible remediation plan:

- Read `SECURITY.md`, `.github/SECURITY.md`, `README.md`, package manifests, supported-version policy, and relevant release branches.
- Search for referenced files, functions, packages, config keys, APIs, sinks, and tests.
- Verify the source, sink, attacker-controlled input, and missing guard.
- Check whether affected ranges line up with tags, branches, or package artifacts when needed.
- Identify existing tests and the smallest regression test that proves the fix.

Keep advisory details in the private conversation and planning notes only. Do not create product-repo files while investigating.

## Phase 3 - Write The Plan And Stop

Write a plan with these sections:

```markdown
## Advisory Facts

- Source fetched with `gh`: <endpoint used>
- Affected package/component: <package or component>
- Root cause: <one concise paragraph>
- Exploit condition: <required attacker control and environment>

## Fix Strategy

- Code change: <minimal remediation>
- Regression coverage: <tests to add/update>
- Supported branches/backports: <needed/not needed/unknown>
- Verification commands: <commands to run>

## Files To Touch

- Source repository: <source/test/config files only>
- External release-documentation location: <approved path, deferred, or none>
- Explicitly not touching: <source-repository changelog/pre-release docs/release notes paths>

## Public Wording Guard

- Branch/commit/PR/test wording: <neutral wording plan>
- Terms to avoid in public artifacts: GHSA, advisory, CVE, security advisory, vulnerability report, reporter names, unpublished exploit details

## Risks And Open Questions

- <risk or question>
```

Then stop and ask:

> Continue with this plan, refine it, or stop?

If the user asks for refinements, update the plan and ask again. Do not implement until the user clearly approves continuing.

## Phase 4 - Implement After Approval

Once the user approves the plan, switch to neutral implementation language.

Implementation rules:

- Do the smallest correct source change that removes the vulnerable behavior.
- Add or update regression tests using neutral names, such as malformed input, invalid URL, unsafe redirect, unexpected prototype key, invalid archive path, or resource limit behavior.
- Do not include GHSA IDs, advisory URLs, CVEs, reporter names, or private exploit details in comments, test names, snapshots, fixtures, commit messages, branch names, PR titles, PR bodies, public docs, changelogs, or release notes.
- If the current branch name includes GHSA, CVE, advisory, or similarly sensitive wording, ask whether to create or switch to a neutral branch before editing.
- Do not commit unless the user explicitly asks for commits.

## External Release Documentation

When release-note, changelog, or pre-release documentation content is required, write it outside the source repository.

Resolve the destination without guessing:

- Use a path the user supplied for private release communication.
- Otherwise, inspect repository guidance or workspace configuration for an explicitly designated external documentation location.
- If no destination is explicit, ask the user where to write the draft. The user may choose to defer it; do not infer a location from sibling-directory names.

Naming rules:

- Follow the approved destination's own naming and placement conventions.
- If its guidance says to mirror source-repository paths, preserve the corresponding relative path and filename.
- If no convention exists, propose a path in the plan and obtain approval before writing.

Before writing notes files:

- Check `git status --short` when the destination is a Git repository.
- Do not overwrite unrelated changes.
- Keep the notes entry neutral enough for private pre-release handling, but include enough detail for maintainers to finish release communication later.

## Phase 5 - Verify

Run the planned verification commands and any focused regression tests.

Before finalizing, check all changed public product-repo files for forbidden unpublished-advisory wording:

```bash
rg -n "GHSA|CVE-|security advisory|vulnerability report|GitHub Security Advisory" <changed-public-files>
```

Also verify:

- No source-repository changelog, release-note, pre-release doc, changeset, or unreleased changelog file was edited.
- Any required release communication was written only to the approved external location or explicitly deferred.
- The code fix is covered by a regression test or a clear manual verification step.
- The final user-facing summary uses neutral wording and does not repeat the GHSA ID.

## Final Response

After implementation, do not mention the GHSA ID or advisory framing. Use this shape:

```markdown
Implemented the planned fix.

- Changed <neutral component/behavior summary>.
- Added/updated <neutral regression coverage>.
- Wrote private release notes to <approved external path>, if applicable.
- Verification: <commands and result>.
```

If implementation is blocked, explain the blocker using neutral language unless the user is still in the planning phase.

## Quality Checklist

Before ending, confirm:

- The GHSA was fetched with `gh` before planning.
- The user approved the plan before implementation.
- Public artifacts contain no GHSA/advisory/CVE references or private exploit details.
- Source-repository release docs, pre-release docs, changelogs, changesets, and unreleased changelog directories were not edited.
- Required release communication drafts were written only to an approved external location or explicitly deferred.
- Tests or verification commands ran, or failures are reported clearly.
