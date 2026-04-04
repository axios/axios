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

## Running the Simulation

The simulation script recreates the attack scenario and demonstrates how Auths
verification catches the unauthorized commit:

```bash
npm install -g @auths-dev/sdk
node auths-attack-simulation.mjs
```

## Adding Auths to Your Workflow

See the GitHub Actions workflow at `.github/workflows/auths-verify-commits.yml`
and the allowed signers configuration at `.auths/allowed_signers`.
