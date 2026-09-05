#!/usr/bin/env bash
set -euo pipefail

# npm 8 supports Node 12 and includes its dependencies in the published tarball.
# Pin both the URL and SHA-512 digest; do not fetch integrity metadata at runtime.
npm_url='https://registry.npmjs.org/npm/-/npm-8.19.4.tgz'
npm_integrity='3HANl8i9DKnUA89P4KEgVNN28EjSeDCmvEqbzOAuxCFDzdBZzjUl99zgnGpOUumvW5lvJo2HKcjrsc+tfyv1Hw=='
npm_dir="$(mktemp -d "${RUNNER_TEMP:?RUNNER_TEMP must be set}/legacy-npm.XXXXXX")"
npm_archive="$npm_dir/npm.tgz"
: "${GITHUB_PATH:?GITHUB_PATH must be set}"

curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' \
  --output "$npm_archive" "$npm_url"

# Verify with Node's built-ins before extracting or executing package contents.
node -e '
  const fs = require("fs");
  const crypto = require("crypto");
  const actual = crypto.createHash("sha512")
    .update(fs.readFileSync(process.argv[1])).digest("base64");
  if (actual !== process.argv[2]) {
    console.error("npm bootstrap integrity check failed");
    process.exit(1);
  }
' "$npm_archive" "$npm_integrity"

tar -xzf "$npm_archive" -C "$npm_dir"
mkdir "$npm_dir/bin"
ln -s "$npm_dir/package/bin/npm-cli.js" "$npm_dir/bin/npm"
ln -s "$npm_dir/package/bin/npx-cli.js" "$npm_dir/bin/npx"
"$npm_dir/bin/npm" --version
printf '%s\n' "$npm_dir/bin" >> "$GITHUB_PATH"
