# Context: North star

> This page separates explicit direction from inference. The repository contains no formal roadmap, mission, or north-star document.

## North-star statement

**Unknown as a formally approved product statement.** The closest explicit repository positioning is a simple, promise-based HTTP client for browser and Node.js use (`README.md:431-515`, `docs/index.md:6-27`). The closest durable engineering direction is predictable public API compatibility under stricter Semantic Versioning plus an explicit security posture (`docs/pages/misc/semver.md:5-31`, `THREATMODEL.md`).

The stakeholder direction supplied with this task is: **Axios v2 may drop non-ESM support and target Node.js 20+, while v1.x continues legacy runtime/module support.** This is confirmed intent from the maintainer context, but it is not yet implemented or encoded as repository policy in this snapshot.

## Desired outcomes and success signals

| Outcome | Success signal or metric | Evidence | Confidence |
| --- | --- | --- | --- |
| Simple cross-environment HTTP use | One consistent API with adapters, interceptors, transforms, cancellation, and TypeScript support | `docs/index.md:21-27`; feature docs | Confirmed outcome; no numeric metric |
| Predictable compatibility | Breaking changes occur in major releases and release versions communicate change class | `docs/pages/misc/semver.md:5-31` | Confirmed principle; no tracked KPI |
| Secure runtime behavior | Threats have explicit mitigations/residual risks and security regressions receive focused tests | `THREATMODEL.md`; `AGENTS.md:101-107` | Confirmed principle |
| Trustworthy packages | CI tests the packed artifact and releases carry provenance | `.github/workflows/run-ci.yml`; `SECURITY.md:18-34` | Confirmed controls |
| Safer maintainer environment | Build tools execute in isolation without long-lived credentials | `THREATMODEL.md:449-462` | Explicit priority; not complete |
| Reproducible builds | Two independent builds become byte-identical and the check can gate merges | `.github/workflows/verify-build-reproducibility.yml:18-24`; `THREATMODEL.md:449-462` | Explicit desired state; currently non-blocking |
| Axios v2 modern baseline | ESM-only distribution on Node 20+; v1.x retains compatibility | Maintainer direction supplied 2026-08-19 | Confirmed intent; repository implementation absent |

No repository-backed adoption, latency, reliability, download, revenue, or satisfaction target was found. Do not invent one.

## Current priorities

Explicit repository priorities are:

- Adhere more strictly to Semantic Versioning and reserve incompatible API changes for major releases.
- Continue security hardening across runtime and supply-chain boundaries.
- Isolate maintainer build environments, add independent sensitive-path review when maintainer capacity allows, and promote build reproducibility from monitoring to enforcement once deterministic.
- Maintain v1.x through the current multi-format/runtime compatibility and release processes.

The v2 ESM-only/Node 20+ target is stakeholder-supplied future direction. The repository does not yet state its sequencing, migration plan, browser/Bun/Deno implications, declaration strategy, release branch, or completion criteria.

## Enduring principles and constraints

- Keep the public request/response/error model consistent across supported transports.
- Detect by capability, not environment name.
- Preserve security boundaries around URLs, redirects, proxies, credentials, XSRF, sockets, config prototypes, compression, and package publication.
- Keep runtime dependencies intentionally small and treat dependency/build-tool changes as security-sensitive.
- Use deprecation and major releases for compatibility-breaking removals.
- Verify installed package artifacts, not only source behavior.
- Axios cannot make application-specific destination, authorization, retry, or idempotency decisions for callers.

## Explicit non-goals and trade-offs

- The threat model explicitly declines to sandbox trusted caller hooks or decide whether caller-selected destinations are safe.
- Backward compatibility currently retains deprecated `CancelToken`, `Cancel`, `axios.all`, CommonJS artifacts, and older Node tests; some of these are documented candidates for future-major removal.
- Decompression/body limits remain unlimited by default for compatibility, trading default safety for existing behavior.
- The current project accepts a non-blocking reproducibility check while nondeterminism remains unresolved.
- The intended v2 runtime/module simplification trades legacy compatibility for a modern ESM/Node baseline; exact scope beyond Node 20+ and ESM-only is unknown.

## Evidence needed to resolve unknowns

- A checked-in v2 roadmap or decision record defining supported runtimes, browsers, package exports, types, migration path, and release branch.
- A root `engines` policy plus updated Rollup outputs, package exports, smoke/module matrices, and docs implementing the v2 baseline.
- Maintainer-approved product outcomes and measurable success criteria, if the project wants a formal north star beyond compatibility/security principles.
- A documented 0.x maintenance/release path or an update to `SECURITY.md` if support has changed.
- A documented deployment target/process for the VitePress site.

## Evidence and gaps

| Claim or area | Evidence | Confidence | Gap or conflict |
| --- | --- | --- | --- |
| Product mission | `README.md:431-515`; `docs/index.md:6-27` | Inferred from positioning | No formal mission/north-star document |
| Compatibility direction | `docs/pages/misc/semver.md:5-31`; API deprecations | Confirmed | No checked-in v2 roadmap |
| v2 Node/ESM direction | Maintainer directive supplied with this task on 2026-08-19 | Confirmed as intent | Conflicts with current `package.json`, Rollup, CI, and docs; not yet implemented |
| Security priorities | `THREATMODEL.md:449-462` | Confirmed | Isolation, two-person review, and enforced reproducibility remain incomplete |
| Success metrics | Repository-wide docs/config inventory | Unknown | No numeric product or operational KPIs found |
