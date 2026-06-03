# Pre-Release Documentation Notes

## Purpose

Track documentation updates that should be applied during release preparation.

Do not treat this file as final documentation. Each entry should give enough context for a maintainer or LLM to update README, docs pages, examples, migration guides, and translated docs when the release is prepared.

Do not store raw diffs or line-number-only instructions here; prefer stable section names, target files, required concepts, examples, and release-specific notes.

## Entry Format

- **Change:** Short feature/fix name.
- **Source:** PR, issue, or changelog reference.
- **Status:** Pending | Applied | Skipped.
- **Docs targets:** Files or docs sections likely needing updates.
- **Required content:** What the docs must explain.
- **Examples:** Any code snippets or examples that should be included.
- **Notes:** Constraints, release-only wording, translation follow-up, etc.

## Unreleased

### sensitiveHeaders request config

- **Change:** Document the Node.js `sensitiveHeaders` request config option for stripping custom secret headers from cross-origin redirects.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Security Fixes, #10892.
- **Status:** Pending.
- **Docs targets:** `docs/pages/misc/security.md`; `docs/pages/advanced/request-config.md`; README request config section if it lists all config options; translated docs after English docs are finalized.
- **Required content:** Explain that `sensitiveHeaders` is an optional array of custom secret-bearing header names. Matching is case-insensitive. The Node.js HTTP adapter removes matching headers only when following a redirect to a different origin. Same-origin redirects keep these headers. If `maxRedirects` is `0`, axios does not follow redirects and `sensitiveHeaders` is not used. Mention common custom authentication headers such as `X-API-Key`.
- **Examples:** Include this request example.

```js
axios.get('https://api.example.com/users', {
  headers: { 'X-API-Key': 'secret' },
  sensitiveHeaders: ['X-API-Key']
});
```

- **Notes:** Add a security page row linking to the request-config section and add a `sensitiveHeaders` request-config entry marked Node.js only.

### validateStatus undefined transitional option

- **Change:** Document `transitional.validateStatusUndefinedResolves` for the `validateStatus: undefined` merge behavior.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, #10899, closes #6688.
- **Status:** Pending.
- **Docs targets:** README request config section; `docs/pages/advanced/request-config.md` `validateStatus` section and request config example; translated request-config docs after English docs are finalized.
- **Required content:** Explain that `validateStatus: undefined` keeps legacy behavior by default and resolves every response status because `transitional.validateStatusUndefinedResolves` defaults to `true`. Explain that setting `transitional.validateStatusUndefinedResolves` to `false` makes explicit `validateStatus: undefined` behave like the option was omitted, so axios uses the configured/default validator and rejects non-2xx responses by default. Mention that `validateStatus: null` still accepts every response status, and users who disable the transitional behavior should use `null` or `() => true` when they intentionally want all statuses to resolve.
- **Examples:** Include a short opt-in example.

```js
axios.get('/user/12345', {
  validateStatus: undefined,
  transitional: {
    validateStatusUndefinedResolves: false
  }
});
```

- **Notes:** This is release-prep documentation only; do not update README or docs pages in the feature/fix PR.
