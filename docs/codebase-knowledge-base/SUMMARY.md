# axios knowledge base

> Axios is a stateless, promise-based HTTP client whose shared configuration/interceptor/transform pipeline delegates I/O to capability-selected Node, XHR, Fetch, or custom adapters. This snapshot documents the current multi-format v1-shaped package and separately records the intended v2 move to ESM-only on Node 20+.

| Field | Value |
| --- | --- |
| Last updated | `2026-08-19T18:54:13+02:00` |
| Source revision | `84a9f3b9a4f3244b8c8e818f557d64c7b964fb25` |
| Source fingerprint | `sha256:c2c24343494f8039fe384607ceeca980b6f1f66f19942618fc27553c250cce9f` |
| Source branch | `docs/codebase-knowledge-base` |
| Source state | `clean` |
| Scope | `.` |

## At a glance

| Area | Summary |
| --- | --- |
| Purpose | Give JavaScript/TypeScript applications one promise-based HTTP API across browser and server-side transports, with normalized config, serialization, cancellation, responses, and errors. |
| Primary users and actors | Frontend/backend/runtime developers, library authors, maintainers, contributors, security researchers, remote servers, redirects, proxies, npm, and GitHub Actions. |
| System shape | Callable client instances feed a core merge/interceptor/transform pipeline, which selects a runtime adapter and returns a normalized response or `AxiosError`. |
| Main entry points | `index.js` and `lib/axios.js` at runtime; `index.d.ts`/`index.d.cts` for types; `lib/core/Axios.js` for dispatch; `lib/adapters/` for I/O. |
| Data and state | No durable application storage. Request/config/response/error data lives in memory, streams, or platform objects. Fetch-seed and CONNECT proxy-agent maps have no configured size cap or eviction; HTTP/2 sessions are removed after idle timeout, close, or error. |
| External systems | Origin servers, redirects, proxies, browser APIs, Node core networking, four runtime npm dependencies, npm registry, GitHub Actions, and sponsor platforms. |
| Runtime and delivery | ESM source currently builds ESM, UMD, browser CJS, and Node CJS artifacts; CI tests source plus the packed tarball across browsers, ESM/CJS Node matrices, Bun, and Deno. |

## Index

### Architecture

- [Patterns](architecture/patterns.md) — system shape, boundaries, dependencies, and runtime flows.
- [Standards](architecture/standards.md) — enforced engineering and operational conventions.
- [Code style](architecture/code-style.md) — formatting, naming, organization, and testing idioms.
- [Tech stack](architecture/tech-stack.md) — languages, frameworks, infrastructure, and integrations.

### Context

- [Business logic](context/business-logic.md) — domain model, invariants, decisions, and state transitions.
- [Business cases](context/business-cases.md) — actors, triggers, flows, outcomes, and exceptions.
- [Business overview](context/business-overview.md) — problem, users, capabilities, boundaries, and glossary.
- [North star](context/north-star.md) — explicit direction, outcomes, priorities, constraints, and success signals.

### History

- [Codebase change log](CHANGELOG.md) — source snapshots, completed work, validation, and recovery context.

## Coverage and gaps

- **Documented scope:** Full repository (`.`), emphasizing runtime source, public declarations, tests, build/package/CI/release configuration, security policy/threat model, contributor rules, docs, examples, and recent branch context.
- **Excluded areas:** Installed dependencies (`node_modules/`, including `docs/node_modules/` and test-fixture installs), generated/ignored `dist/` and site output, binary assets, exhaustive translated-doc comparison, every test case, and remote-only GitHub/npm state. These exclusions do not affect the documented runtime architecture.
- **Important unknowns:** No checked-in roadmap, formal north-star statement, product KPIs, v2 migration plan, root Node `engines` policy, 0.x release mechanism, or documentation hosting/deployment process was found. Consumer-specific authorization, persistence, destination policy, and retry/idempotency are outside Axios's boundary.
- **Current compatibility boundary:** Repository evidence still publishes/tests CommonJS and Node 12-18 while ESM tests cover Node 20-26. The maintainer direction supplied for v2 is ESM-only and Node 20+, with v1.x retaining legacy support; treat it as intent until manifests, outputs, workflows, declarations, and docs implement it.
- **Contradictions or stale upstream docs:** `CONTRIBUTING.md` still says tests use Jasmine/Mocha; `AGENTS.md` lists adapter selection before request transforms and states only the legacy-default interceptor order; `THREATMODEL.md` has stale redirect-default, header-sanitization, error-redaction, and runtime-dependency-count details; docs conflict on provenance history and domains; the retry guide's delay is not signal-aware; release-branch PR creation omits module-test jobs from its gate; `SECURITY.md` supports 0.x but the checked-in publish workflow only accepts v1 tags.
- **Recovery:** This KB is documentation-only. Remove `docs/codebase-knowledge-base/` to reverse it, or refresh the pages and their recorded source metadata after source changes.
