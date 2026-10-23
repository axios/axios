# Axios charset reproduction — issue #5317

Minimal, isolated reproduction for [axios/axios#5317](https://github.com/axios/axios/issues/5317).

The local server sends **real bytes** with a declared `Content-Type` charset. The tests characterize the current Node.js adapter behavior using this checkout's Axios source; they do not modify production code or propose a fix.

## Requirements

- Node.js 22.22.1 or newer. The root dev toolchain installs with the repository lockfile, whose largest engine requirement is `lint-staged` with `"engines": {"node": ">=22.22.1"}`; the Vitest harness itself only requires `"engines": {"node": "^20.0.0 || ^22.0.0 || >=24.0.0"}`, and the main CI workflow runs the Vitest suites on Node 26.x.
- npm

## Run

The integrated checks run as part of the normal Vitest unit suite, in `tests/unit/adapters/httpResponseEncoding.test.js`. From the repository root:

```sh
npm ci --ignore-scripts

# Targeted run
npx vitest run --project unit tests/unit/adapters/httpResponseEncoding.test.js

# Or the full Node unit suite
npm run test:vitest:unit
```

The tests start the local server through the shared `tests/setup/server.js` helpers, connect to loopback only (`127.0.0.1`) with `proxy: false`, and close each server in `try/finally`.

An optional standalone demo covering the same cases remains at `charset-repro/repro.mjs`:

```sh
node charset-repro/repro.mjs
```

## What it checks

- UTF-8 bytes with `charset=utf-8` decode correctly by default.
- ISO-8859-1 bytes declared as `charset=ISO-8859-1` are decoded using Axios's default UTF-8 behavior, so `Imágenes` is corrupted.
- Setting Axios's Node-only `responseEncoding: 'latin1'` decodes that ISO-8859-1 response correctly.
- EUC-JP bytes are also served to illustrate the gap between the charset declared by a server and the encodings supported by Node's `Buffer.toString()`.

`responseEncoding` is implemented by Axios's Node.js HTTP adapter (`lib/adapters/http.js`); it is not a portable browser option (it is documented in the request config as Node.js only). `latin1` is a valid Node `Buffer.toString()` encoding name, so it decodes the ISO-8859-1 case shown above. `euc-jp` is not a supported encoding name for Node.js `Buffer.toString()`, so passing `responseEncoding: 'euc-jp'` makes the adapter fail with Node's `ERR_UNKNOWN_ENCODING`: neither the default decoder nor the manual option can decode that response.

The EUC-JP case is observational: supported encodings depend on the decoding API, and Axios's `responseEncoding` currently follows Node Buffer encoding names. The reproduction does not claim that every non-UTF-8 charset can be handled by a single encoding option.

Axios does not implement automatic charset detection and does not automatically honor the response `Content-Type` charset; the tests document the current behavior. This is evidence for discussion, not a proposed breaking change. Automatically honoring the response charset could change existing behavior; discuss the expected API and compatibility requirements with maintainers before implementing a fix.
