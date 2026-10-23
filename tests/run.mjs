import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServices } from './fixtures/service.mjs';
import { run } from './helpers/run.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const require = createRequire(import.meta.url);
const scope = process.argv[2] || 'all';
const args = process.argv.slice(3).filter((arg) => arg !== '--');
const pnpm = process.env.npm_execpath;
if (!pnpm || !basename(pnpm).includes('pnpm'))
  throw new Error('Run this suite through pnpm run test:e2e (or a test:e2e:<runtime> command).');
if (!['all', 'pack', 'node', 'bun', 'deno', 'browser'].includes(scope))
  throw new Error(`Unknown e2e scope: ${scope}`);
if (args.length && (args.length !== 2 || args[0] !== '--artifact-dir'))
  throw new Error(
    'Expected --artifact-dir <directory>, or no arguments to build and pack freshly.'
  );

const pnpmRun = (argv, options) => run(process.execPath, [pnpm, ...argv], options);
const hash = async (path) =>
  createHash('sha256')
    .update(await readFile(path))
    .digest('hex');

async function pack(directory) {
  await run(process.execPath, ['--test', join(here, 'harness/run.test.mjs')]);
  await mkdir(directory, { recursive: true });
  const staging = await mkdtemp(join(tmpdir(), 'axios-pack-'));
  try {
    await pnpmRun(['--dir', repo, 'run', 'build']);
    await pnpmRun(['--dir', join(repo, 'packages/axios'), 'pack', '--pack-destination', staging]);
    const files = (await readdir(staging)).filter((name) => name.endsWith('.tgz'));
    if (files.length !== 1) throw new Error('Packing must produce exactly one Axios tarball.');
    const filename = files[0];
    await cp(join(staging, filename), join(directory, filename));
    const { version } = JSON.parse(await readFile(join(repo, 'packages/axios/package.json')));
    await writeFile(
      join(directory, 'manifest.json'),
      JSON.stringify({ filename, version, sha256: await hash(join(directory, filename)) }, null, 2)
    );
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

async function artifact(directory) {
  const manifest = JSON.parse(await readFile(join(directory, 'manifest.json')));
  if (!/^axios-[\w.+-]+\.tgz$/.test(manifest.filename))
    throw new Error('Invalid package artifact filename.');
  const path = join(directory, manifest.filename);
  if ((await hash(path)) !== manifest.sha256)
    throw new Error('Axios tarball checksum differs from its manifest.');
  return { ...manifest, path };
}

async function checkTypes(consumer, env) {
  const typeRoots = [resolve(dirname(require.resolve('@types/node/package.json')), '..')];
  for (const mode of ['cjs', 'esm']) {
    const directory = join(consumer, 'types', mode);
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify({ type: mode === 'esm' ? 'module' : 'commonjs' })
    );
    const files =
      mode === 'cjs'
        ? [
            'cjs-typing.ts',
            'cjs-is-cancel-typing.ts',
            'cjs-added-types.ts',
            'cjs-fetch-options.ts',
            'cjs-fetch-types.ts',
          ]
        : ['esm-index.ts', 'esm-added-types.ts', 'esm-fetch-options.ts', 'esm-fetch-types.ts'];
    const config = {
      compilerOptions: {
        module: 'node16',
        strict: true,
        skipLibCheck: false,
        noEmit: true,
        typeRoots,
        types: ['node'],
        lib: ['ES2022', 'DOM'],
      },
      files,
    };
    await writeFile(join(directory, 'tsconfig.json'), JSON.stringify(config));
    const compiler = require.resolve(
      mode === 'cjs' ? 'typescript-legacy/bin/tsc' : 'typescript/bin/tsc'
    );
    await run(process.execPath, [compiler, '-p', directory], { env });
    // Node 20's fetch declarations must also work without a DOM library.
    config.compilerOptions.lib = ['ES2022'];
    config.files = [mode + '-fetch-types.ts'];
    await writeFile(join(directory, 'tsconfig.json'), JSON.stringify(config));
    await run(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', directory], { env });
    const declaration = {
      ...config,
      compilerOptions: {
        ...config.compilerOptions,
        lib: ['ES2022', 'DOM'],
        noEmit: false,
        declaration: true,
        emitDeclarationOnly: true,
        outDir: 'declarations',
      },
      files: ['index.ts'],
    };
    await cp(join(consumer, 'types/esm/declaration-emit.ts'), join(directory, 'index.ts'));
    await cp(join(consumer, 'types/esm/declaration-consumer.ts'), join(directory, 'consumer.ts'));
    await writeFile(join(directory, 'tsconfig.json'), JSON.stringify(declaration));
    await run(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', directory], { env });
    config.files = ['consumer.ts'];
    config.compilerOptions.lib = ['ES2022', 'DOM'];
    await writeFile(join(directory, 'tsconfig.json'), JSON.stringify(config));
    await run(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', directory], { env });
    // A compiled application must actually issue a request using its installed package.
    const source =
      mode === 'cjs'
        ? "import axios = require('axios'); axios.get(process.env.AXIOS_E2E_ORIGIN + '/echo', {proxy:false}).then(r => { if(r.data.method !== 'GET') throw new Error('typed request failed'); });"
        : "import axios from 'axios'; const r = await axios.get(process.env.AXIOS_E2E_ORIGIN + '/echo', {proxy:false}); if(r.data.method !== 'GET') throw new Error('typed request failed');";
    await writeFile(join(directory, 'application.ts'), source);
    await writeFile(
      join(directory, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          module: 'node16',
          target: 'ES2022',
          strict: true,
          typeRoots,
          types: ['node'],
          outDir: 'compiled',
        },
        files: ['application.ts'],
      })
    );
    await run(process.execPath, [compiler, '-p', directory], { env });
    await run(
      process.env.AXIOS_E2E_NODE || process.execPath,
      [join(directory, 'compiled/application.js')],
      { env }
    );
  }
}

const temporary = await realpath(await mkdtemp(join(tmpdir(), 'axios-release-e2e-')));
let services;
try {
  const directory =
    scope === 'pack'
      ? join(repo, 'artifacts/e2e')
      : args.length
        ? resolve(repo, args[1])
        : join(temporary, 'artifact');
  if (scope === 'pack' || !args.length) await pack(directory);
  const release = await artifact(directory);
  console.log(`Testing packed axios ${release.version}; sha256 ${release.sha256}`);
  if (scope !== 'pack') {
    const consumer = join(temporary, 'consumer');
    await mkdir(consumer);
    await writeFile(
      join(consumer, 'package.json'),
      JSON.stringify({
        name: 'axios-release-consumer',
        private: true,
        type: 'module',
        dependencies: { axios: 'file:' + release.path },
      })
    );
    await writeFile(join(consumer, 'deno.json'), JSON.stringify({ nodeModulesDir: 'manual' }));
    await pnpmRun([
      '--dir',
      consumer,
      'install',
      '--ignore-workspace',
      '--ignore-scripts',
      '--config.node-linker=hoisted',
      '--config.package-import-method=copy',
    ]);
    const packageRoot = join(consumer, 'node_modules/axios');
    if ((await realpath(packageRoot)) !== packageRoot)
      throw new Error('Installed Axios must be a package directory, not a workspace symlink.');
    await cp(join(here, 'runtime'), join(consumer, 'runtime'), { recursive: true });
    await cp(join(here, 'types'), join(consumer, 'types'), { recursive: true });
    await cp(join(here, 'fixtures/tls/cert.pem'), join(consumer, 'cert.pem'));
    let assets;
    if (scope === 'all' || scope === 'browser') {
      await cp(join(here, 'browser/app'), join(consumer, 'app'), { recursive: true });
      assets = join(consumer, 'web');
      const { build } = await import('vite');
      await build({
        configFile: false,
        root: join(consumer, 'app'),
        build: { outDir: assets, emptyOutDir: true },
      });
    }
    services = await startServices({ assets, packageRoot });
    const baseEnv = {
      ...process.env,
      AXIOS_E2E_SERVICES: JSON.stringify(services.info),
      AXIOS_E2E_ORIGIN: services.info.origin,
      AXIOS_E2E_VERSION: release.version,
    };
    for (const runtime of scope === 'all' ? ['node', 'bun', 'deno', 'browser'] : [scope]) {
      const env = { ...baseEnv, AXIOS_E2E_RUNTIME: runtime };
      if (runtime === 'browser') {
        await run(
          process.execPath,
          [
            require.resolve('@playwright/test/cli'),
            'test',
            '--config',
            join(here, 'playwright.config.mjs'),
          ],
          { cwd: here, env }
        );
      } else {
        const binary =
          process.env[`AXIOS_E2E_${runtime.toUpperCase()}`] ||
          (runtime === 'node' ? process.execPath : runtime);
        await run(binary, ['--version']); // Missing runtimes fail; never silently skip coverage.
        for (const mode of ['esm', 'cjs']) {
          const argv =
            runtime === 'node'
              ? ['--test', '--test-concurrency=1', 'runtime/node.test.mjs']
              : runtime === 'bun'
                ? ['test', 'runtime/bun.test.mjs']
                : [
                    'test',
                    '--no-check',
                    '--allow-net=127.0.0.1',
                    '--allow-read',
                    '--allow-env',
                    'runtime/deno.test.mjs',
                  ];
          await run(binary, argv, { cwd: consumer, env: { ...env, AXIOS_E2E_MODULE: mode } });
        }
        if (runtime === 'node') await checkTypes(consumer, env);
      }
    }
  }
} finally {
  if (services) await services.close();
  await rm(temporary, { recursive: true, force: true });
}
