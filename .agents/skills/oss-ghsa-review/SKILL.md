---
name: oss-ghsa-review
description: Review an open source GitHub Security Advisory, CVE, or draft vulnerability report for validity, exploitability, threat-model fit, affected versions, CVSS v4 scoring, and maintainer-ready advisory rewrites. Trigger on `/oss-ghsa-review` with an advisory ID or URL.
---

# OSS GHSA Review

Use this command when the user asks to review, triage, validate, score, or rewrite an open source GitHub Security Advisory, CVE, GHSA, or draft security report.

The goal is maintainer-grade advisory triage: verify the vulnerable code path, attacker capability, affected versions, realistic impact, and the wording maintainers should publish. Do not inflate impact. Do not dismiss valid conditional vulnerabilities without explaining the required condition.

## Inputs

The user must provide a GHSA ID, CVE ID, GitHub advisory URL, repository advisory URL, or advisory body. Accept forms such as:

- `GHSA-xxxx-xxxx-xxxx`
- `CVE-YYYY-NNNN`
- `https://github.com/<owner>/<repo>/security/advisories/GHSA-xxxx-xxxx-xxxx`
- `https://github.com/advisories/GHSA-xxxx-xxxx-xxxx`

If the user does not provide an ID, URL, or advisory text, ask one short question:

> Which advisory should I review? Provide a GHSA/CVE ID, GitHub advisory URL, or advisory text.

## Step 1 - Resolve Repository And Fetch Advisory

Determine the repository context:

- If the advisory URL includes `<owner>/<repo>`, use that repository.
- Otherwise, if running inside a GitHub-backed repo, use `gh repo view --json nameWithOwner -q .nameWithOwner`.
- If no repo can be resolved, use the global advisory endpoint and ask for repo context before making repo-specific claims.

For a GHSA ID, prefer the repository endpoint when a repo is known because private or draft advisories may only exist there:

```bash
gh api repos/<owner>/<repo>/security-advisories/<GHSA-ID>
```

If that fails or no repo is known, try:

```bash
gh api advisories/<GHSA-ID>
```

For a CVE ID, search GitHub advisories:

```bash
gh api --method GET /advisories -f cve_id=<CVE-ID>
```

Capture at least:

- Advisory ID, CVE ID, URL, title/summary, description, severity, state.
- Affected package/ecosystem/version metadata.
- CVSS v3/v4 data if present.
- CWEs, credits, published/updated/withdrawn timestamps.
- Patched versions, vulnerable version ranges, and references.

If GitHub cannot be accessed, tell the user exactly which fetch failed and ask for the advisory body. Do not continue by guessing.

Treat private or draft advisory content as confidential. Do not suggest posting private text publicly before publication.

## Step 2 - Establish The Project Threat Model

Read repo-specific context before deciding validity:

- `SECURITY.md`, `.github/SECURITY.md`
- `THREATMODEL.md`, `docs/security*`, `docs/threat*`
- `README.md`, `CONTRIBUTING.md`
- Package manifests and supported-version policy
- Relevant source files, tests, and release branches/tags

Map the report to the project explicitly:

- Runtime/component affected: library API, CLI, server, client, plugin, parser, serializer, transport, auth, build tooling, docs/types only, or supply chain.
- Trust boundary crossed: user input to package, package to network/filesystem/process, caller-supplied code, environment variables, dependency graph, CI/release pipeline, or downstream consumer boundary.
- Threat actor: remote unauthenticated user, authenticated user, malicious server, on-path attacker, malicious package consumer, malicious package author, compromised dependency, local user, or already-compromised process.
- Asset at risk: credentials, request/response data, filesystem, network reachability, process integrity, availability, package integrity, user data, or downstream systems.
- Supported environments affected: server, browser, CLI, desktop/mobile, CI/build, specific OS/runtime versions, or all supported environments.

Apply general OSS boundaries:

- Caller-supplied code, plugins, hooks, callbacks, transforms, or configuration are often trusted by design. Treat them as attacker-controlled only when the project documents or realistically exposes them to an untrusted actor.
- A separate vulnerability may be a valid attack requirement. Do not dismiss it automatically; identify whether this project materially amplifies that weaker primitive.
- Fully compromised processes, arbitrary code execution before project code runs, or malicious dependencies are usually out of scope unless the report shows the project meaningfully worsens that condition.
- Separate runtime impact from build/CI/dev-dependency impact.
- Separate environment-specific impact. Do not imply browser impact for server-only code, CLI impact for library-only code, or package-install impact for runtime-only code.

## Step 3 - Verify Correctness And Exploitability

Do not rely on reporter claims or existing CVSS. Verify the code path.

Use repo tools and Git history as needed:

- Search for referenced files, functions, config keys, package names, and affected APIs.
- Inspect vulnerable and fixed versions with `git show <tag>:<path>` when current code may already be fixed.
- Compare maintained release branches when the project supports more than one line.
- Search existing security regression tests and related issue/PR history.
- Reproduce with a safe local PoC when useful. Use local servers/stubs/files; do not send secrets or attack third-party systems.
- For dependency advisories, distinguish direct runtime reachability from dev/build/test-only exposure.
- For prototype pollution/object injection/deserialization/path traversal/SSRF/RCE/DoS claims, identify the exact source, sink, guard, and required attacker control.

For each claimed impact, answer:

- Is the vulnerable code reachable in supported usage?
- What exact API, command, endpoint, config, file format, or package path is required?
- What attacker-controlled input is required?
- Does exploitation require another vulnerability, privileged role, local access, user interaction, environment control, network position, or credentials already present?
- What does the attacker actually learn, modify, execute, or deny?
- What mitigations limit impact? Examples: authentication, authorization, same-origin policy, TLS, sandboxing, path normalization, schema validation, own-property guards, resource limits, safe defaults, or unsupported environment constraints.

## Step 4 - Decide Validity

Classify the report as one of:

- Invalid / out of scope: no project bug under the threat model.
- Duplicate / already fixed: real issue, already covered or patched, or affected range is wrong.
- Informational / hardening only: defense-in-depth with no concrete exploit path under supported usage.
- Valid vulnerability: reachable project behavior crosses a trust boundary or materially escalates a realistic weaker primitive.

Invalid or out-of-scope examples:

- The attack requires the application to intentionally execute malicious caller-supplied code when the project treats that code as trusted.
- The attack requires arbitrary code execution before the project code runs and the project does not amplify it.
- The claimed vulnerable behavior is blocked in the submitted affected versions.
- The affected code exists only in unsupported versions or non-shipped examples.
- The issue affects only tests, docs, or development tooling with no realistic supply-chain or user impact.

Valid examples:

- Untrusted input reaches a sensitive sink without documented opt-in.
- A supported default violates a documented security guarantee.
- The project leaks, routes, executes, writes, parses, or trusts data across a boundary unexpectedly.
- A weaker primitive such as prototype pollution, malicious archive content, or hostile remote data can drive a project-specific gadget with real impact.

## Step 5 - Bail Out If Invalid

If the report is invalid, duplicate, already fixed, or hardening-only, stop before writing a new advisory body or final CVSS score.

Provide a closing comment maintainers can paste:

```markdown
Thanks for the report. We reviewed this against the project's supported threat model and could not confirm a vulnerability in <project/package>.

<One concise paragraph explaining the decisive reason: trusted caller behavior, unreachable code path, existing mitigation, duplicate fixed issue, unsupported version, dev-only exposure, or unsupported impact claim. Cite files/functions and versions checked.>

Because this does not cross a supported project trust boundary under the conditions checked, we are closing this advisory as <invalid/out of scope/duplicate/already fixed/informational>. If you can provide a PoC that works against <specific checked version/range> without requiring <excluded condition>, we can re-open and reassess.
```

Include evidence for the user:

- Files, tags, branches, packages, or releases checked.
- Reproduction result, if any.
- Threat-model or support-policy basis.
- Residual hardening opportunity, if any.

## Step 6 - If Valid, Score With CVSS 4.0

Provide a CVSS 4.0 base score and vector. Do not reuse reporter-provided scores blindly.

Explain each base metric:

- `AV` Attack Vector
- `AC` Attack Complexity
- `AT` Attack Requirements
- `PR` Privileges Required
- `UI` User Interaction
- `VC` Vulnerable System Confidentiality
- `VI` Vulnerable System Integrity
- `VA` Vulnerable System Availability
- `SC` Subsequent System Confidentiality
- `SI` Subsequent System Integrity
- `SA` Subsequent System Availability

General scoring guidance:

- Score the vulnerable project behavior, not a hypothetical wrapper application unless the project documents that use case.
- If exploitation requires a separate helper vulnerability or unusual deployment condition, reflect it with `AT:P`, higher `AC`, or narrower impact, and explain why.
- Distinguish vulnerable-system impact from subsequent-system impact. For libraries, the vulnerable system is usually the application process using the package; downstream services or users may be subsequent systems.
- Do not count trusted maintainer/developer actions as attacker privileges unless the attack realistically targets the supply chain or development workflow.
- Availability impact should be realistic: request-level failure differs from process crash, persistent resource exhaustion, or service-wide outage.

Output format:

```markdown
## CVSS 4.0

**Score:** <score> <severity>
**Vector:** `CVSS:4.0/...`

**Reasoning:**

- `AV:<x>` - <why>
- `AC:<x>` - <why>
- `AT:<x>` - <why>
- `PR:<x>` - <why>
- `UI:<x>` - <why>
- `VC:<x>` - <why>
- `VI:<x>` - <why>
- `VA:<x>` - <why>
- `SC:<x>` - <why>
- `SI:<x>` - <why>
- `SA:<x>` - <why>
```

If you cannot confidently compute the exact numeric score, state the vector and say the numeric score should be confirmed in a CVSS 4.0 calculator. Do not invent a number.

## Step 7 - Determine Affected Versions

Determine affected versions from evidence, not assumptions:

- Read advisory vulnerability metadata.
- Identify package ecosystem and package names.
- Check the vulnerable code path across tags/releases/branches with `git show` or package artifacts when possible.
- Identify first fixed version or commit.
- Identify maintained branches that need backports based on the project's support policy.
- If dev/build/test-only exposure changes impact, state that separately.
- If a version line is not affected, explain why: code path absent, feature absent, guard already present, unsupported environment, or exploit condition impossible.

Output format:

```markdown
## Affected Versions

- `<package/ecosystem>`: <affected range>; fixed in <version or pending>.
- Maintained branches/backports: <needed/not needed/unknown with reason>.
```

Do not say "all versions" unless release history was checked and the claim is accurate.

## Step 8 - Rewrite The Advisory Body

When the report is valid, write a maintainer-ready advisory using exactly these sections and order:

```markdown
## Summary

<One or two concise paragraphs. Identify project/package, affected versions, vulnerable component, required attacker capability, and actual impact. Avoid dramatic language unless proven.>

## Impact

<Practical user impact. State conditions. Separate data exposure, integrity, availability, environment-specific impact, dev/build/runtime exposure, and subgroup risks. Distinguish "installed" from "reachable".>

## Affected Functionality

<Exact APIs, commands, endpoints, config keys, file formats, packages, environments, and data flow required. Include unaffected functionality when it prevents overbroad interpretation.>

## Technical Details

<Code-level explanation with file/function names. Explain why the vulnerability exists, how attacker-controlled data reaches it, what mitigations fail or apply, and what changed in fixed versions.>

## Proof of Concept of Attack

<Safe, minimal PoC or pseudocode demonstrating exploit conditions without attacking third-party systems or exposing secrets. Use local servers/stubs/files when possible. Include expected result. If a full PoC would be unsafe, provide a constrained demonstration and explain what was omitted.>

## Workarounds

<Include only if there is a realistic workaround other than updating. If none, omit this section. Do not list "upgrade" here; fixed versions are covered outside the body.>

## Original Source

<Link to the GHSA/CVE/report and summarize the original reporter claim. Include original title, reporter if available, original claimed affected versions/CVSS if relevant, and important maintainer corrections. Do not paste private advisory text publicly before publication.>
```

Writing rules:

- Use conditional language where exploitability is conditional.
- Do not say "zero user input" unless no attacker-controlled application input, user interaction, or helper vulnerability is needed.
- Do not say "all users" or "all requests" unless every supported environment/path is affected.
- Separate runtime, development, CI, build, and supply-chain impact.
- Mention fixed versions only if known.
- Keep the advisory factual, reproducible, and user-actionable.

## Step 9 - Final Output To The User

For a valid report, respond in this order:

```markdown
# <GHSA/CVE-ID> - <recommended title>

## Verdict

Valid vulnerability.
<One-sentence exploitability summary.>

## CVSS 4.0

<score/vector/reasoning>

## Affected Versions

<package ranges and backport needs>

## Rewritten Advisory

<template body>

## Notes For Maintainers

<Metadata corrections, CWE changes, duplicate links, fixed-version metadata, docs/changelog implications, regression tests needed, release/backport notes.>
```

If the advisory is still in triage or no fix exists yet, end with:

```markdown
If you want to move from triage to remediation, start a plan session with:

"Plan a fix for <GHSA/CVE-ID> in <project>. Cover affected packages, supported branches, regression tests, CVSS/advisory metadata, release notes, and whether backports are needed."
```

For an invalid report, use only the Step 5 bail-out output.

## Quality Checklist

Before finalizing, confirm:

- The advisory or report was fetched or supplied by the user.
- Repository context and support policy were checked where relevant.
- The vulnerable code path was verified in code, tags, or package artifacts.
- Runtime vs dev/build/CI impact is separated.
- Environment-specific impact is separated.
- Attacker-controlled input and helper requirements are explicit.
- Invalid reports stop with a closing comment only.
- Valid reports include CVSS 4.0 vector and reasoning.
- Valid reports include affected package/version assessment.
- The rewritten advisory uses the required sections.
- Workarounds are included only when realistic and distinct from upgrading.
