# axios knowledge base

> Axios is a stateless, promise-based HTTP client whose shared configuration/interceptor/transform pipeline delegates I/O to capability-selected Node, XHR, Fetch, or custom adapters. This v2 snapshot documents the completed Node 20+ runtime baseline on PR #11161 while the current ESM, UMD, browser CommonJS, and Node CommonJS package surfaces remain intact pending a separate ESM-only migration.

| Field              | Value                                                                     |
| ------------------ | ------------------------------------------------------------------------- |
| Last updated       | `2026-08-21T15:08:15+02:00`                                               |
| Source revision    | `9e51e031b453d7b766eaa9410b8b338f811e2cbf`                                |
| Source fingerprint | `sha256:0aa8f5b8434bf5a866742b37dbb31a2e38047428849970dbfbb24ab65a9c70bc` |
| Source branch      | `docs/archive-node-20-runtime-baseline`                                   |
| Source state       | `dirty`                                                                   |
| Scope              | `.`                                                                       |

## At a glance

| Area                     | Summary                                                                                                                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose                  | Give JavaScript/TypeScript applications one promise-based HTTP API across browser and server-side transports, with normalized config, serialization, cancellation, responses, and errors.                                                                           |
| Primary users and actors | Frontend/backend/runtime developers, library authors, maintainers, contributors, security researchers, remote servers, redirects, proxies, npm, and GitHub Actions.                                                                                                 |
| System shape             | Callable client instances feed a core merge/interceptor/transform pipeline, which selects a runtime adapter and returns a normalized response or `AxiosError`.                                                                                                      |
| Main entry points        | `index.js` and `lib/axios.js` at runtime; `index.d.ts`/`index.d.cts` for types; `lib/core/Axios.js` for dispatch; `lib/adapters/` for I/O.                                                                                                                          |
| Data and state           | No durable application storage. Request/config/response/error data lives in memory, streams, or platform objects. Fetch-seed and CONNECT proxy-agent maps have no configured size cap or eviction; HTTP/2 sessions are removed after idle timeout, close, or error. |
| External systems         | Origin servers, redirects, proxies, browser APIs, Node core networking, four runtime npm dependencies, npm registry, GitHub Actions, and sponsor platforms.                                                                                                         |
| Runtime and delivery     | ESM source still builds ESM, UMD, browser CJS, and Node CJS artifacts. The package and Node-based fixtures now declare Node `>=20.0.0`; configured ESM/CJS matrices cover Node 20/22/24/26, with Bun and Deno smoke lanes retained.                                 |

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
- **Important unknowns:** No formal north-star statement, product KPIs, completed ESM-only migration plan, 0.x release mechanism, or documentation hosting/deployment process was found. Consumer-specific authorization, persistence, destination policy, and retry/idempotency are outside Axios's boundary.
- **Current compatibility boundary:** PR #11161 declares and tests a Node `>=20.0.0` package contract, targets the temporary Node CommonJS build and type fixture at Node 20, and configures ESM/CJS matrices for Node 20/22/24/26. CommonJS/UMD artifacts and declarations remain present by design. After replacing the Node 26-incompatible Mocha 9 runner and obsolete cleanup fallback, final-revision CI passes every ESM/CJS module and smoke lane on Node 20/22/24/26 plus build, lint, dependency review, unit/browser, lockfile, reproducibility, bundle-size, workflow-security, Bun, and Deno checks. [Plan 001](../plans/archive/2026-08-21-001-node-20-runtime-baseline.md) is complete and archived; ESM-only removal remains a separate migration.
- **Contradictions or stale upstream docs:** `CONTRIBUTING.md` still says tests use Jasmine/Mocha; `AGENTS.md` lists adapter selection before request transforms and states only the legacy-default interceptor order; `THREATMODEL.md` has stale redirect-default, header-sanitization, error-redaction, and runtime-dependency-count details; docs conflict on provenance history and domains; the retry guide's delay is not signal-aware; release-branch PR creation omits module-test jobs from its gate; `SECURITY.md` supports 0.x but the checked-in publish workflow only accepts v1 tags.
- **Recovery:** This KB is documentation-only. Remove `docs/codebase-knowledge-base/` to reverse it, or refresh the pages and their recorded source metadata after source changes.
