# Security Example: Auths Commit Verification

## Background

On March 31, 2026, Axios was the target of a supply chain attack. The attacker
compromised a lead maintainer's npm account and used a long-lived access token to
publish malicious versions (v1.14.1 and v0.30.4) directly to npm. The malicious
packages included a cross-platform RAT delivered via a postinstall hook. Neither
version appears in the GitHub release tags.

The attack succeeded because **there was no cryptographic binding between the published
package and a verified maintainer identity**.

## What is Auths?

[Auths](https://github.com/auths-dev/auths) provides Ed25519 signatures bound to
KERI-based decentralized identifiers (DIDs). With Auths:

- Every commit and artifact carries a signature from the maintainer's cryptographic identity
- The signature is bound to the maintainer's device keychain (not a registry account)
- Stealing npm credentials is insufficient without the signing key
- Verification happens locally — no network calls to a central authority

## How Auths Addresses the Attack

The real attack bypassed Git entirely — the attacker published directly to npm with
no corresponding commit or GitHub release tag. Commit-level signing alone would not
have caught a registry-only publish. However, Auths establishes a verifiable chain:
every legitimate release must trace back to a signed commit by an authorized
maintainer. A package published without a matching signed commit has no valid
attestation chain and would be flagged by consumers and CI pipelines that verify
signatures.

This workflow adds the commit-signing layer via the
[`auths-dev/verify`](https://github.com/auths-dev/verify) GitHub Action. A full
deployment would also use `auths artifact sign` (via
[`auths-dev/sign`](https://github.com/auths-dev/sign)) in the release workflow to
bind published packages to signed commits.

## Running the Simulation

The simulation script uses the Auths Node SDK to demonstrate the core cryptographic
primitive — it shows that only the holder of the maintainer's private key can produce
a valid signature:

```bash
npm install @auths-dev/sdk
node auths-attack-simulation.mjs
```

No CLI installation, git, or ssh-keygen needed — the script uses the SDK directly.

## Adding Auths to Your Workflow

See the GitHub Actions workflow at `.github/workflows/auths-verify-commits.yml`
and the allowed signers configuration at `.auths/allowed_signers`.
