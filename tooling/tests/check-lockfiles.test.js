import assert from 'node:assert/strict';
import { test } from 'node:test';
import { stringify } from 'yaml';
import { validateLockfile } from '../scripts/check-lockfiles.js';

const fixture = () => ({
  lockfileVersion: '9.0',
  importers: { '.': { dependencies: { example: { specifier: '^1.0.0', version: '1.0.0' } } } },
  packages: {
    'example@1.0.0': { resolution: { integrity: `sha512-${Buffer.alloc(64).toString('base64')}` } },
  },
});

test('accepts registry packages with integrity and HTTPS npm tarballs', () => {
  const lock = fixture();
  lock.packages['example@1.0.0'].resolution.tarball =
    'https://registry.npmjs.org/example/-/example-1.0.0.tgz';
  validateLockfile(stringify(lock));
});

for (const tarball of [
  'http://registry.npmjs.org/example.tgz',
  'https://evil.example/example.tgz',
  'https://registry.npmjs.org.evil.example/example.tgz',
  'https://registry.npmjs.org@evil.example/example.tgz',
  'https://user:secret@registry.npmjs.org/example.tgz',
  'https://registry.npmjs.org:444/example.tgz',
  'file:/tmp/example.tgz',
]) {
  test(`rejects untrusted tarball ${tarball}`, () => {
    const lock = fixture();
    lock.packages['example@1.0.0'].resolution.tarball = tarball;
    assert.throws(() => validateLockfile(stringify(lock)));
  });
}

for (const resolution of [
  {},
  { integrity: 'sha512-invalid' },
  { integrity: fixture().packages['example@1.0.0'].resolution.integrity, directory: '../malware' },
]) {
  test(`rejects incomplete or non-registry resolution ${JSON.stringify(resolution)}`, () => {
    const lock = fixture();
    lock.packages['example@1.0.0'].resolution = resolution;
    assert.throws(() => validateLockfile(stringify(lock)));
  });
}

for (const version of ['file:../example', 'link:../example', 'github:owner/repo']) {
  test(`rejects non-registry dependency ${version}`, () => {
    const lock = fixture();
    lock.importers['.'].dependencies.example = { specifier: version, version };
    assert.throws(() => validateLockfile(stringify(lock)));
  });
}

test('permits only the declared first-party workspace links in the root graph', () => {
  const lock = fixture();
  lock.importers['apps/docs'] = {
    dependencies: { axios: { specifier: 'workspace:*', version: 'link:../../packages/axios' } },
  };
  validateLockfile(stringify(lock), true);
  assert.throws(() => validateLockfile(stringify(lock), false));
  lock.importers['apps/docs'].dependencies.axios.version = 'link:../../other';
  assert.throws(() => validateLockfile(stringify(lock), true));
});

test('rejects a URL specifier hidden behind a registry-looking version', () => {
  const lock = fixture();
  lock.importers['.'].dependencies.example.specifier = 'https://evil.example/example.tgz';
  assert.throws(() => validateLockfile(stringify(lock)));
});

test('rejects transitive local links and remote references', () => {
  for (const version of [
    'link:../malware',
    'file:../malware.tgz',
    'https://evil.example/pkg.tgz',
  ]) {
    const lock = fixture();
    lock.snapshots = { 'example@1.0.0': { dependencies: { malware: version } } };
    assert.throws(() => validateLockfile(stringify(lock), true));
  }
});

test('accepts registry aliases and only the root Axios workspace peer', () => {
  const lock = fixture();
  lock.snapshots = {
    'example@1.0.0': {
      optionalDependencies: {
        alias: 'example@1.0.0',
        axios: 'link:packages/axios',
      },
    },
  };
  validateLockfile(stringify(lock), true);
  assert.throws(() => validateLockfile(stringify(lock), false));
});

test('rejects undeclared workspace importers with a missing version', () => {
  const lock = fixture();
  lock.importers['unknown'] = { dependencies: { example: { specifier: 'workspace:*' } } };
  assert.throws(() => validateLockfile(stringify(lock), true));
});
