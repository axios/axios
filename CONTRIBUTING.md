# Contributing

We accept community contributions. By contributing to axios, you agree to follow the [code of conduct](https://github.com/axios/axios/blob/master/CODE_OF_CONDUCT.md).

Before submitting a PR for review, complete the [mandatory submission requirements in AGENTS.md](AGENTS.md#before-opening-or-updating-a-pull-request) and the [PR template](.github/PULL_REQUEST_TEMPLATE.md). These requirements apply to human and AI contributors. Every PR must add or update `PRE_RELEASE_CHANGELOG.md`, including documentation-only and test-only changes, except for the narrow [automated release-preparation exception](AGENTS.md#pre-release-notes). Use the Maintenance section for test-only changes, internal refactors, tooling, dependency updates, and CI changes without a user-visible behavior change.

## AI-assisted workflows

The repository includes the maintainer's five OSS skills in [`.agents/skills/`](.agents/skills/), imported from the globally installed `oss-*` skills so contributors can use and improve the same workflows in version control.

| Skill                                                                                              | Purpose                                                                                      |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [oss-pr-review](.agents/skills/oss-pr-review/SKILL.md)                                             | Review a GitHub PR for project fit, correctness, security, compatibility, and CI evidence.   |
| [oss-ghsa-review](.agents/skills/oss-ghsa-review/SKILL.md)                                         | Triage an advisory, verify affected code and versions, and assess CVSS and advisory wording. |
| [oss-ghsa-fix](.agents/skills/oss-ghsa-fix/SKILL.md)                                               | Plan a private advisory fix, obtain plan approval, then implement and verify it.             |
| [oss-vulnerability-impact-assessment](.agents/skills/oss-vulnerability-impact-assessment/SKILL.md) | Explain affected usage, exploit conditions, workarounds, and practical likelihood.           |
| [oss-release-notes](.agents/skills/oss-release-notes/SKILL.md)                                     | Draft release notes from merged GitHub PRs between two tags.                                 |

Codex discovers the root `.agents/skills/` directory from this repository and its subdirectories. Use `/skills` to select a skill, or mention it in a prompt, for example `$oss-pr-review 11359` or `$oss-release-notes` followed by the base and head tags. If a personal skill has the same name, select the copy in this repository. Other agents can read the linked `SKILL.md` directly; command and tool support depends on the agent. See the [official skill documentation](https://learn.chatgpt.com/docs/build-skills) for discovery and invocation details.

The GitHub workflows require Git, the GitHub CLI (`gh`), and an authenticated account with access to the repository or advisory. The release-notes workflow also uses `jq` for JSON filtering, and the advisory-fix verification uses ripgrep (`rg`) for its wording scan; install these utilities before running those steps. The impact-assessment skill can also work from a supplied report. Private advisories require appropriate maintainer access. No global skill installation or new package dependency is needed.

Read [AGENTS.md](AGENTS.md) and [SECURITY.md](SECURITY.md) before using a workflow. Repository contribution requirements remain authoritative. Review and release-note outputs are drafts unless the user authorizes posting or publishing them. Keep unpublished advisory material private, preserve the fix skill's plan-approval step, and complete the normal submission checklist before a public PR. Maintain the repository copies here; importing a skill does not modify anyone's global installation.

## Code style

Follow the [node style guide](https://github.com/felixge/node-style-guide).

## Commit messages

Follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/).

## Testing

Update tests for your changes. Pull requests must pass GitHub Actions.

## Documentation

Keep the API and documentation in sync. For unreleased runtime/API changes, record the required documentation updates in `PRE_RELEASE_DOCS.md` so they can be applied during release preparation. Follow the [prerelease notes rules](AGENTS.md#pre-release-notes); `packages/axios/CHANGELOG.md` is reserved for release preparation.

## Dependency and GitHub Actions updates

Please do not open pull requests that only update npm packages, lockfiles, or GitHub Actions versions. We close these PRs from outside collaborators. Only maintainers and approved automated bots may create package and GitHub Actions update PRs.

We keep the 7-day Dependabot delay for these updates unless a critical vulnerability requires a maintainer-led manual update.

## Workspace setup

The root is a private pnpm workspace. Install pnpm 10.34.7 (`npm install --global pnpm@10.34.7 --ignore-scripts`, or Corepack if available), then run `pnpm install --frozen-lockfile --ignore-scripts` from the repository root. Keep install scripts disabled.

Axios source and its tests live in `packages/axios/`. Documentation and the sandbox are in `apps/`; shared tools are in `tooling/`. Root commands forward to these workspaces. For example, run a focused unit test with `pnpm --filter axios run test:vitest:unit tests/unit/core/Axios.test.js`.

Consumer projects in `tests/compatibility/` are intentionally outside the workspace and install the tarball produced by `pnpm run pack:axios`. Follow [AGENTS.md](AGENTS.md#monorepo-layout) for isolated installation instructions.

## Developing

- `pnpm run lint` checks the library source
- `pnpm test` runs the unit and browser test suites; install the browsers first with `pnpm --filter axios exec playwright install`
- `pnpm run test:vitest:unit` runs the Node unit tests
- `pnpm run test:vitest:browser:headless` runs the Chromium, Firefox, and WebKit browser tests; install the browsers first with `pnpm --filter axios exec playwright install` (`pnpm --filter axios exec playwright install --with-deps` also installs system dependencies on supported Linux hosts)
- `pnpm run build` clears generated artifacts and runs Rolldown
- Maintainers can run `pnpm run version:axios patch --ignore-scripts=false` for a local version bump with release hooks. This explicit exception to disabled install scripts bumps `packages/axios/package.json`, prepares and stages `packages/axios/lib/env/data.js`, and builds Axios. It does not create a commit or tag; review and commit the staged files separately. The release workflow requires a major bump from v1 and keeps release PRs on major 2.

## Running the sandbox

Run the browser sandbox:

```bash
> pnpm start
# Open 127.0.0.1:3000
```

Run the terminal sandbox:

```bash
> pnpm start
> node ./apps/sandbox/client.js
```
