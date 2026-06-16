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

### Node native env proxy interaction

- **Change:** Document how the Node.js HTTP adapter interacts with Node native environment proxy handling.
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes, #10942, closes #7299.
- **Status:** Pending.
- **Docs targets:** `README.md` proxy/request config sections; `docs/pages/advanced/request-config.md`; translated request-config docs after English docs are finalized.
- **Required content:** Explain that axios normally resolves `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY` itself for the Node.js HTTP adapter unless `config.proxy` is `false`. On Node.js versions with native HTTP proxy support, axios defers environment proxy handling to Node when the selected HTTP/HTTPS agent has `proxyEnv` enabled, including processes started with `NODE_USE_ENV_PROXY=1`, `--use-env-proxy`, or `NODE_OPTIONS=--use-env-proxy`. Custom agents without `proxyEnv` continue to use axios env proxy resolution. Explicit `config.proxy` remains handled by axios.
- **Examples:** None required.
- **Notes:** Keep the wording Node.js-only. Mention that this avoids double proxy rewriting while preserving existing custom-agent behavior.
