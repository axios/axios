# Axios

Axios is a promise-based HTTP client for the browser and Node.js. This repository is the v2 monorepo; the central published package remains [`axios`](packages/axios/README.md).

## Repository layout

- [`packages/axios`](packages/axios) contains the library, public declarations, build configuration, and unit, browser, and artifact tests.
- [`apps/docs`](apps/docs) contains the documentation site and translations.
- [`apps/sandbox`](apps/sandbox) provides the local browser and terminal sandbox.
- [`examples`](examples) contains a private workspace for usage examples.
- [`tests/compatibility`](tests/compatibility) tests packed Axios releases in independent consumer projects, including CommonJS, ESM, Bun, and Deno.
- [`tooling`](tooling) contains shared lint configuration.

## Development

Use Node.js 20.19 or newer (or 22.12 or newer on the Node 22 line) and pnpm 10.34.7. Install the pinned package manager with `npm install --global pnpm@10.34.7 --ignore-scripts`, or use Corepack if available.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm run lint
pnpm run build
pnpm run test:build:artifacts
pnpm run test:vitest:unit
pnpm --filter axios exec playwright install
pnpm run test:vitest:browser:headless
pnpm run pack:axios
```

The root manifest is private. `pnpm run pack:axios` writes only the Axios package to `artifacts/`; the library's public exports and installed directory structure are unchanged. Root commands delegate to the appropriate workspace; package-specific commands can also run with `pnpm --filter axios run <command>`.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) for contributor requirements, isolated consumer tests, and release instructions. Usage documentation is in the [Axios package README](packages/axios/README.md).
