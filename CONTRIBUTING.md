# Contributing

We accept community contributions. By contributing to axios, you agree to follow the [code of conduct](https://github.com/axios/axios/blob/master/CODE_OF_CONDUCT.md).

Before submitting a PR for review, complete the [mandatory submission requirements in AGENTS.md](AGENTS.md#before-opening-or-updating-a-pull-request) and the [PR template](.github/PULL_REQUEST_TEMPLATE.md). These requirements apply to human and AI contributors. Every PR must add or update `PRE_RELEASE_CHANGELOG.md`, including documentation-only and test-only changes.

## Code style

Follow the [node style guide](https://github.com/felixge/node-style-guide).

## Commit messages

Follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/).

## Testing

Update tests for your changes. Pull requests must pass GitHub Actions.

## Documentation

Keep the API and documentation in sync. For unreleased runtime/API changes, record the required documentation updates in `PRE_RELEASE_DOCS.md` so they can be applied during release preparation. Follow the [prerelease notes rules](AGENTS.md#pre-release-notes); `CHANGELOG.md` is reserved for release preparation.

## Dependency and GitHub Actions updates

Please do not open pull requests that only update npm packages, lockfiles, or GitHub Actions versions. We close these PRs from outside collaborators. Only maintainers and approved automated bots may create package and GitHub Actions update PRs.

We keep the 7-day Dependabot delay for these updates unless a critical vulnerability requires a maintainer-led manual update.

## Developing

- `npm run lint` checks the library source
- `npm run test:vitest:unit` runs the Node unit tests
- `npm run test:vitest:browser:headless` runs the Chromium, Firefox, and WebKit browser tests; install the browsers first with `npx playwright install` (`npx playwright install --with-deps` also installs system dependencies on supported Linux hosts)
- `npm run build` runs Rollup and bundles the source
- `npm run version` prepares the code for release

## Running examples

Use the examples for manual testing.

Run the examples:

```bash
> npm run examples
# Open 127.0.0.1:3000
```

Run the browser sandbox:

```bash
> npm start
# Open 127.0.0.1:3000
```

Run the terminal sandbox:

```bash
> npm start
> node ./sandbox/client
```
