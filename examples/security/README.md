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

- Every commit carries a signature from the maintainer's cryptographic identity
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

This workflow adds the commit-signing layer. A full deployment would also use
`auths artifact sign` in the release workflow to bind published packages to signed
commits, closing the gap completely.

## Running the Simulation

The simulation script demonstrates the commit-signing layer — it shows that commits
from unauthorized parties are detected:

```bash
brew tap auths-dev/auths-cli && brew install auths
node auths-attack-simulation.mjs
```

## Adding Auths to Your Workflow

See the GitHub Actions workflow at `.github/workflows/auths-verify-commits.yml`
and the allowed signers configuration at `.auths/allowed_signers`.
