import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// CI supplies an isolated parser so a changed workspace lockfile cannot replace it.
const { parse } = await import(process.env.AXIOS_LOCKFILE_YAML_MODULE || 'yaml');

export const lockfiles = [
  'pnpm-lock.yaml',
  'tests/compatibility/module/cjs/pnpm-lock.yaml',
  'tests/compatibility/module/esm/pnpm-lock.yaml',
  'tests/compatibility/smoke/cjs/pnpm-lock.yaml',
  'tests/compatibility/smoke/esm/pnpm-lock.yaml',
];

// Only these first-party links are allowed in committed dependency graphs.
const workspaceLinks = new Map([
  ['apps/docs:axios', 'link:../../packages/axios'],
  ['apps/sandbox:axios', 'link:../../packages/axios'],
  ['examples:axios', 'link:../packages/axios'],
]);
const registryVersion =
  /^(?:@[^/:\s]+\/[^@:\s]+@|[^@:\s/]+@)?\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?(?:\(.*\))?$/;

export function validateLockfile(source, workspace = false) {
  const lockfile = parse(source);
  if (lockfile?.lockfileVersion !== '9.0' || !lockfile.importers || !lockfile.packages) {
    throw new Error('Expected a pnpm v9 lockfile with importers and packages');
  }

  for (const [importer, manifest] of Object.entries(lockfile.importers)) {
    for (const group of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      for (const [name, dependency] of Object.entries(manifest[group] || {})) {
        if (
          workspace &&
          workspaceLinks.has(`${importer}:${name}`) &&
          dependency.specifier === 'workspace:*' &&
          dependency.version === workspaceLinks.get(`${importer}:${name}`)
        ) {
          continue;
        }
        if (!registryVersion.test(dependency.version)) {
          throw new Error(`Non-registry dependency: ${importer}:${name}`);
        }
        // Reject remote/git/file specifiers even if a forged version looks normal.
        if (
          /^(?:git|https?|file|link|workspace|github|gitlab|bitbucket):|[/\\]/.test(
            dependency.specifier.replace(/^npm:@?[^@]+@/, '')
          )
        ) {
          throw new Error(`Non-registry specifier: ${importer}:${name}`);
        }
      }
    }
  }

  for (const [snapshot, manifest] of Object.entries(lockfile.snapshots || {})) {
    for (const group of ['dependencies', 'optionalDependencies']) {
      for (const [name, version] of Object.entries(manifest[group] || {})) {
        // pnpm resolves the docs app's optional Axios peer to the first-party package.
        if (workspace && name === 'axios' && version === 'link:packages/axios') continue;
        if (!registryVersion.test(version)) {
          throw new Error(`Non-registry transitive dependency: ${snapshot}:${name}`);
        }
      }
    }
  }

  for (const [name, entry] of Object.entries(lockfile.packages)) {
    const resolution = entry.resolution;
    if (!/^@?[^\s:@]+(?:\/[^\s:@]+)?@\d+\.\d+\.\d+/.test(name)) {
      throw new Error(`Non-registry package: ${name}`);
    }
    if (!resolution || !/^sha512-[A-Za-z0-9+/]{86}==$/.test(resolution.integrity)) {
      throw new Error(`Missing or invalid SHA-512 integrity: ${name}`);
    }
    if (Object.keys(resolution).some((key) => !['integrity', 'tarball'].includes(key))) {
      throw new Error(`Non-registry resolution: ${name}`);
    }
    if (resolution.tarball) {
      const url = new URL(resolution.tarball);
      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'registry.npmjs.org' ||
        url.port ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      ) {
        throw new Error(`Untrusted registry URL: ${name}`);
      }
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const [index, path] of lockfiles.entries()) {
    validateLockfile(
      await readFile(new URL(`../../${path}`, import.meta.url), 'utf8'),
      index === 0
    );
    console.log(`Validated ${path}`);
  }
}
