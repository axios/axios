# Security Policy

> **Last updated:** 2026-03-31
> **Context:** This policy was strengthened in response to the [axios@1.14.1 supply chain attack](https://www.stepsecurity.io/blog/axios-compromised-on-npm-malicious-versions-drop-remote-access-trojan) where compromised npm credentials were used to publish malicious versions containing a phantom dependency that deployed a cross-platform RAT.

---

## Reporting a Vulnerability

If you discover a security vulnerability, please report it through one of these channels:

- **GitHub Security Advisory:** [Create a private advisory](../../security/advisories/new)
- **Email:** security@axios-http.com

**Do NOT file a public GitHub issue for security vulnerabilities.**

We will acknowledge receipt within 24 hours and provide a detailed response within 72 hours.

---

## Publish Process

> This is the most critical section of this document. The March 31, 2026 attack succeeded because the attacker bypassed the GitHub Actions pipeline entirely and published directly via npm CLI using stolen credentials. Every control below exists to prevent that specific attack class.

### Mandatory Requirements

1. **All releases MUST go through `.github/workflows/npm-publish.yml`**
   - Manual `npm publish` from a local machine is **PROHIBITED**
   - The workflow enforces 5 pre-publish security gates before any publish
   - A git tag (e.g., `v1.14.2`) must exist before the workflow triggers

2. **npm Account Security**
   - Primary 2FA: **FIDO2 hardware key** (not TOTP — TOTP seeds can be phished via real-time relay attacks, which is likely how the jasonsaayman account was compromised)
   - Recovery email: team alias (e.g., `npm-recovery@axios-http.com`), never a personal email
   - npm token type: **Granular Access Token** scoped to the axios package only
   - Token rotation: every **90 days** maximum

3. **OIDC Trusted Publishing**
   - npm publish uses GitHub Actions OIDC (`id-token: write` + `--provenance`)
   - This generates SLSA Build Level 2 provenance for every release
   - Consumers can verify the package was built from a specific commit in this repo

4. **Account Change Monitoring**
   - Any change to npm account email triggers mandatory security review
   - Any change to npm account 2FA method triggers mandatory security review
   - Changes to npm token permissions require 2 maintainer approvals

### Pre-Publish Checklist (automated in CI)

All 5 gates must pass before `npm publish` executes:

| Gate | What it checks | What it would have caught |
|------|---------------|--------------------------|
| Phantom deps | Every dependency in package.json is actually imported in source | plain-crypto-js was never imported |
| Git tag | Tag `v{version}` exists in git | No tag v1.14.1 existed |
| Postinstall audit | No unauthorized lifecycle scripts in dependencies | plain-crypto-js had `postinstall: "node setup.js"` |
| Dependency drift | Dependency graph matches signed baseline | plain-crypto-js was not in any baseline |
| Version match | Git tag matches package.json version | Prevents version confusion |

### Post-Publish Verification

After every publish, the workflow automatically:
1. Queries npm registry for the published package's dependencies
2. Compares against the expected dependencies from package.json
3. Alerts if any unexpected dependency appears (the exact attack vector)
4. Verifies provenance attestation exists

---

## Dependency Policy

### Adding New Dependencies

1. **New runtime dependencies require explicit approval from 2 maintainers**
2. All runtime dependencies must be actively imported in source code
   - A dependency that appears in package.json but is never `import`ed or `require`d is called a "phantom dependency" and will be blocked by CI
3. No dependency may have a `postinstall` script without explicit justification and hash-based allowlisting
4. Dependency additions must update the signed baseline (requires the DEPS_BASELINE_SECRET)

### Dependency Verification Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/verify-deps.js` | Full publish gate: phantom deps, postinstall, drift, lockfile, tag | `node scripts/verify-deps.js` |
| `scripts/audit-postinstall.js` | Standalone lifecycle script scanner for any project | `node scripts/audit-postinstall.js` |

Both scripts use **zero external dependencies** (only `node:fs`, `node:path`, `node:crypto`, `node:child_process`). A security tool that has npm dependencies is a security tool that can be supply-chain attacked.

### Baseline Management

The dependency baseline (`.deps-baseline.json`) is signed with HMAC-SHA256. To update it after a legitimate dependency change:

```bash
DEPS_BASELINE_SECRET=<secret> node scripts/verify-deps.js --sign
```

**Future improvement:** Migrate from HMAC-SHA256 (symmetric, shared secret) to Ed25519 (asymmetric). With HMAC, anyone who has the secret can forge a baseline. With Ed25519, the private key stays on a hardware token and only the public key is committed to the repo. The upgrade path:

1. Generate Ed25519 keypair, store private key on YubiKey
2. Commit public key to `.deps-baseline-pubkey.pem`
3. Sign baseline with `crypto.sign('ed25519', data, privateKey)`
4. Verify with `crypto.verify('ed25519', data, publicKey, signature)`
5. Deprecate HMAC signing after transition period

---

## Incident Response

### If You Think You Installed a Compromised Version

The axios@1.14.1 and axios@0.30.4 versions deployed platform-specific RATs. Check for these indicators of compromise:

| Platform | IOC Path | What it is |
|----------|----------|------------|
| macOS | `/Library/Caches/com.apple.act.mond` | Mach-O binary (RAT) |
| Windows | `%PROGRAMDATA%\wt.exe` | Windows executable (RAT) |
| Linux | `/tmp/ld.py` | Python script (RAT) |

Additionally, check for:
- `node_modules/plain-crypto-js/` existing in your project (this package is not a dependency of ANY legitimate axios version)
- Network connections to `sfrclak.com` or `142.11.206.73` in your firewall/DNS logs

### If IOCs are found:

1. **Isolate** the affected machine from the network immediately
2. **Rotate ALL credentials** accessible from that machine (npm tokens, SSH keys, API keys, database passwords, cloud provider credentials)
3. **Audit** git history for any unauthorized commits made from the machine
4. **Report** to your organization's security team and to us via the channels above
5. **Reinstall** the operating system (the RAT may have established persistence)

### Safe Axios Versions

- 1.x users: `axios@1.14.0` (**not** 1.14.1, which is compromised) or later patched versions
- 0.x users: `axios@0.30.3` (**not** 0.30.4, which is compromised) or later patched versions

---

## What This Security Hardening Does NOT Protect Against

Transparency builds trust. These controls reduce the attack surface but are not a complete solution:

### Not covered:

1. **Malicious maintainer with legitimate access** — If a maintainer with valid credentials and GitHub access intentionally publishes malicious code through the normal workflow, these checks will pass. The defense here is code review by other maintainers, not automated tooling.

2. **Compromise of GitHub Actions itself** — If GitHub's infrastructure is compromised, the attacker could modify workflow files or inject code during the build. Mitigation: pinned action SHAs (not tags), but a full GitHub compromise is beyond our threat model.

3. **Vulnerability in a whitelisted dependency** — If a legitimate, allowlisted dependency (one that IS imported in source) contains a vulnerability, phantom dependency detection won't catch it. Standard CVE scanning (npm audit, Snyk, Socket) covers this vector.

4. **Build-time code injection** — If a build tool (webpack, rollup, etc.) is compromised and injects code during bundling, the published artifact could differ from source. Mitigation: reproducible builds (future work).

5. **Registry-level attacks** — If npm's registry itself is compromised to serve different tarballs than what was uploaded, provenance attestation helps but is not foolproof. This is a supply-chain-of-the-supply-chain problem.

6. **Pre-staged clean packages** — The March 31 attacker published plain-crypto-js@4.2.0 (clean) 18 hours before 4.2.1 (malicious) to establish npm history. Our phantom dependency check catches this because it detects unused deps regardless of their history. But an attacker could pre-stage a package that IS imported in source — social engineering a maintainer to add the dependency first, then publishing a malicious version later.

### Residual attack surface:

The next sophisticated attacker would likely try:
- Compromising a dependency that axios already uses (e.g., injecting into `form-data` or `follow-redirects`)
- Social engineering a PR that adds a "useful" new dependency, then compromising that dependency after it's established
- Attacking the build/bundling step rather than the source
- Targeting the CI environment itself (GitHub Actions runner compromise)

### Defense-in-depth philosophy:

No single control stops a determined attacker. The goal is to make each attack require compromising multiple independent systems — requiring both npm credentials AND GitHub access AND baseline secret AND maintainer approval makes the attack exponentially harder.

---

## Security Contact

- **Email:** security@axios-http.com
- **GitHub Security Advisories:** [Create advisory](../../security/advisories/new)
- **PGP key:** Available on request for encrypted communication

---

*Adapted from [Kairos Shield Protocol](https://github.com/Valisthea) security infrastructure. All scripts use zero external dependencies (node:crypto only) — a security tool that can be supply-chain attacked is not a security tool.*
