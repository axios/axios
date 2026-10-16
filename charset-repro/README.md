# Axios charset reproduction — issue #5317

Minimal, isolated reproduction for [axios/axios#5317](https://github.com/axios/axios/issues/5317).

The local server sends **real bytes** with a declared `Content-Type` charset. The tests characterize the current Node.js adapter behavior using this checkout's Axios source; they do not modify production code or propose a fix.

## Requirements

- Node.js 18+
- npm

## Run

From the repository root:

```sh
npm ci --ignore-scripts
node --test charset-repro/repro.test.mjs
node charset-repro/repro.mjs
```

## What it checks

- UTF-8 bytes with `charset=utf-8` decode correctly by default.
- ISO-8859-1 bytes declared as `charset=ISO-8859-1` are decoded using Axios's default UTF-8 behavior, so `Imágenes` is corrupted.
- Setting Axios's Node-only `responseEncoding: 'latin1'` decodes that ISO-8859-1 response correctly.
- EUC-JP bytes are also served to illustrate the gap between the charset declared by a server and the encodings supported by Node's `Buffer.toString()`.

The EUC-JP case is observational: supported encodings depend on the decoding API, and Axios's `responseEncoding` currently follows Node Buffer encoding names. The reproduction does not claim that every non-UTF-8 charset can be handled by a single encoding option.

This is evidence for discussion, not a proposed breaking change. Automatically honoring the response charset could change existing behavior; discuss the expected API and compatibility requirements with maintainers before implementing a fix.
