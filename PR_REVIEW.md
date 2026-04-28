# Axios Open PR Review

Snapshot: 2026-04-24. Open PR count: **115**. Base branch: `v1.x`.

Legend:

- **Merge**: 🟢 easy (clean, small, isolated) · 🟡 medium (review surface or conflicts) · 🔴 hard (big diff, deep conflicts, architectural)
- **Breaking**: 💥 behavior/API change that bumps semver-major or requires migration note

## 3. Ranked by importance × merge effort

### Tier A — important, medium effort

| PR         | Merge | Breaking | Value                                                                                                                            |
| ---------- | ----- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |


| **#7380**  | 🟢    | —        | `composeSignals` uses `AbortSignal.any` when available. 30/0.                                                                    |
| **#7378**  | 🟢    | —        | Replace deprecated `unescape()` with UTF-8 encoder. 16/9.                                                                        |
| **#10549** | 🟢    | —        | `forEachEntry` null iterator guard. 8/0.                                                                                         |
| **#10782** | 🟢    | —        | Docs + TS for `parseReviver` ES2023 `context` arg.                                                                               |
| **#10577** | 🟢    | —        | Adds unit tests for 4 helpers. 322/0 tests only.                                                                                 |
| **#10646** | 🟡    | —        | Auths commit verification CI, response to the 2026-03-31 supply-chain attack. Warn-only, draft. Policy decision as much as code. |
| **#10733** | 🟡    | —        | Native `Retry-After` support (opt-in). 307/11. Needs careful review of retry loop in `dispatchRequest`.                          |
| **#7248**  | 🟡    | —        | Align fetch timeout errors (`timeoutErrorMessage`, `ETIMEDOUT` vs `ECONNABORTED`). Conflicts.                                    |
| **#10657** | 🟡    | —        | Timeout with `maxRedirects=0`. Conflicts.                                                                                        |
| **#7149**  | 🟡    | —        | Unsettled promise on abort + compression + `maxRedirects=0`. Conflicts.                                                          |
| **#7243**  | 🟡    | —        | RN Android multipart boundary — removes forced header. Behavior change for form posts. Conflicts.                                |
| **#7413**  | 🟡    | —        | Prototype pollution hardening in `formDataToJSON` — security. Conflicts.                                                         |
| **#7444**  | 🟡    | —        | Validate timeout non-negative finite. 167/0, mostly tests.                                                                       |
| **#7237**  | 🟡    | —        | Cap onUploadProgress at 100%. Conflicts.                                                                                         |
| **#7267**  | 🟡    | —        | Guard `utils.global` destructure (Vite/Rollup crash). Conflicts.                                                                 |
| **#7260**  | 🟡    | —        | Same `utils.global` issue, alternative fix. Pick one with #7267.                                                                 |

### Tier B — scope/architecture decisions

| PR                      | Merge | Breaking | Value                                                                                                          |
| ----------------------- | ----- | -------- | -------------------------------------------------------------------------------------------------------------- |
| **#10802** / **#10579** | 🟡    | —        | QUERY HTTP method. Pick one; reject the other. Duplicative.                                                    |
| **#7156**               | 🟡    | —        | Optional `proxyFromEnvAdapter`. Additive, clean. Conflicts.                                                    |
| **#6792**               | 🟡    | —        | zstd decompression. Node 23.8+ only; feature-detected. Conflicts.                                              |
| **#6428**               | 🟡    | —        | Custom `jsonParser`/`jsonEncoder` config.                                                                      |
| **#6379**               | 🟡    | —        | `progressUpdateIntervalMs` config. 19 files.                                                                   |
| **#7300**               | 🟡    | —        | Skip axios proxy when `NODE_USE_ENV_PROXY=1` on Node 22.11+. Conflicts.                                        |
| **#7537**               | 🔴    | —        | HTTPS-over-HTTP-proxy tunneling via `https-proxy-agent`. Adds dep. Security fix for plaintext leak. Conflicts. |
| **#6465**               | 🔴    | —        | Alternative proxy tunneling (renewal of #5781). Opt-in to avoid breaking.                                      |
| **#6915**               | 🔴    | —        | Undici adapter. 700/7, 8 files. New adapter contract. Conflicts.                                               |

### Tier C — low priority but mergeable

`#7276` (undefined error codes in settle — 1/1 but useful),
`#7151` (keepAlive ECONNRESET — overlap with defaults review),
`#7443` (repro test for abort reason — merge with #7435),
`#6111` (Set in toJSONObject).

---

## 4. Semver summary

- If you merge the breaking set above, next release must be **v2.0** (or hold behind a major flag).
- Pure-additive wins that can land in **v1.x minor**: #10680, #10733, #10787, #10708, #10729, #10724, #10772, #7544, #7414, #7248, #10657, #7149, #7191, #7444, #7378, #7380, #10549, #10577, #7237, #7267, #7156, #6792, #6428, #6379, #10802/10579, #7443, docs.
- Breakers to sequence into v2: #7128, #7279, #7040, #5492, #7332, #10681, #10682, #6807, #6706, #7538, #10578, #7540, #7435, #7526, #6638.

---

## 5. Suggested next actions

1. **Triage close bucket** (§1) — ~30 PRs can close with a short reason, buying reviewer bandwidth.
2. **Ship Tier S** — all 🟢, no breaking. One release, measurable DX wins.
3. **Batch security work** — #7537, #7538, #7413, #10646 into a coordinated security-focused minor.
4. **Start v2 branch** — collect breakers behind a `v2.x` base; do not land them on `v1.x`.
5. **Pick one QUERY PR** (#10802 vs #10579) and close the loser.
6. **Decide proxy strategy** — #7537, #6465, #7156, #7300 overlap. Need an owner doc.
