---
date: 2026-03-04
topic: adapters-esm-ts-modernization
---

# Adapters ESM + TypeScript Modernization

## What We're Building
We want a full modernization of Axios adapters so adapter internals are TypeScript-friendly and align with modern ESM-first development. The modernization should cover `http`, `xhr`, and `fetch` adapter areas and the adapter resolution surface anchored in `lib/adapters/adapters.js`.

The target is improved maintainability, clearer type contracts in implementation code, and cleaner long-term adapter evolution, while respecting the project's existing cross-environment adapter semantics (name/function resolution, availability checks, and runtime adapter selection behavior).

## Why This Approach
Three options were considered: compatibility-first full modernization, milestone cleanup with controlled breaking surface, and clean-slate modern platform reset. The selected direction is compatibility-first full modernization because it matches the repo's established pattern of incremental modernization backed by broad compatibility tests and dual-module distribution support.

This keeps momentum high while reducing ecosystem risk. It also avoids introducing unnecessary architectural churn before proving value in adapter internals and build/type ergonomics.

## Key Decisions
- **Full modernization scope:** The effort includes TypeScript-oriented modernization across adapter internals and ESM alignment, not only test/type touch-ups.
- **Compatibility-first posture:** Preserve current runtime behavior and adapter resolution semantics as the default success condition.
- **Adapter resolver contract remains stable:** `getAdapter` behavior, adapter availability signaling (`false`/`null`), and unknown adapter error semantics remain externally consistent.
- **Dual-module reality is acknowledged:** Changes should respect existing ESM/CJS distribution expectations unless explicitly revisited later.
- **Incremental delivery bias:** Even under full scope, work should be broken into reviewable phases to reduce regression risk.

## Resolved Questions
- **Modernization depth:** Full modernization (not partial) was explicitly requested.
- **Preferred strategy among alternatives:** No explicit alternative was selected after options were presented, so we default to the recommended compatibility-first path.

## Open Questions
- None at this stage.

## Next Steps
Proceed to `/workflows:plan` to define implementation phases, file-level changes, validation strategy, and rollout checkpoints.
