import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { Parser } from 'acorn';

const ROOT_DIR = fileURLToPath(new URL('../../', import.meta.url));
const DIST_DIR = join(ROOT_DIR, 'dist');
const require = createRequire(import.meta.url);
const packageJSON = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf8'));
const browserArtifacts = [
  ['axios.js', 'script'],
  ['axios.min.js', 'script'],
  ['browser/axios.cjs', 'script'],
  ['esm/axios.js', 'module'],
  ['esm/axios.min.js', 'module'],
];
const expectedFiles = [
  'axios.js',
  'axios.min.js',
  'axios.min.js.map',
  'browser/axios.cjs',
  'esm/axios.js',
  'esm/axios.min.js',
  'esm/axios.min.js.map',
  'node/axios.cjs',
];

const listFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    return entry.isDirectory() ? listFiles(path) : relative(DIST_DIR, path);
  });

const readArtifact = (path) => readFileSync(join(DIST_DIR, path), 'utf8');

const assertAxiosInstance = (axios) => {
  expect(typeof axios).toBe('function');
  expect(axios.VERSION).toBe(packageJSON.version);
  expect(axios.default).toBe(axios);
  expect(typeof axios.get).toBe('function');
  expect(typeof axios.AxiosError).toBe('function');
  expect(typeof axios.AxiosHeaders).toBe('function');
};

describe('generated package artifacts', () => {
  it('emits the complete published file set', () => {
    expect(listFiles(DIST_DIR).sort()).toEqual(expectedFiles);
    expect(packageJSON.jsdelivr).toBe('dist/axios.min.js');
    expect(packageJSON.unpkg).toBe('dist/axios.min.js');

    for (const file of expectedFiles) {
      expect(packageJSON.files).toContain(`dist/${file}`);
    }
  });

  it.each(browserArtifacts)('%s parses as ES2018', (file, sourceType) => {
    expect(() =>
      Parser.parse(readArtifact(file), {
        ecmaVersion: 2018,
        sourceType,
      })
    ).not.toThrow();
  });

  it.each(expectedFiles.filter((file) => !file.endsWith('.map')))(
    '%s contains the release banner',
    (file) => {
      expect(readArtifact(file)).toMatch(
        new RegExp(
          `^/\\*! Axios v${packageJSON.version.replaceAll('.', '\\.')}` +
            ` Copyright \\(c\\) \\d{4} ${packageJSON.author} and contributors \\*/`
        )
      );
    }
  );

  it.each([
    ['axios.min.js', 'axios.min.js.map'],
    ['esm/axios.min.js', 'esm/axios.min.js.map'],
  ])('%s references a valid source map', (file, mapFile) => {
    const sourceMap = JSON.parse(readArtifact(mapFile));

    expect(readArtifact(file)).toContain(`//# sourceMappingURL=${basename(mapFile)}`);
    expect(sourceMap.version).toBe(3);
    expect(sourceMap.sources.length).toBeGreaterThan(0);
    expect(sourceMap.sourcesContent).toHaveLength(sourceMap.sources.length);
  });

  it.each(['axios.js', 'axios.min.js'])('%s exposes a classic-script global', (file) => {
    const context = {};

    vm.runInNewContext(readArtifact(file), context, { filename: file });

    assertAxiosInstance(context.axios);
  });

  it.each(['axios.js', 'axios.min.js'])('%s exposes its default through AMD', (file) => {
    let axios;
    const define = (...args) => {
      const factory = args.at(-1);

      axios = factory();
    };
    define.amd = {};

    vm.runInNewContext(readArtifact(file), { define }, { filename: file });

    assertAxiosInstance(axios);
  });

  it('preserves browser and Node CommonJS default export shapes', () => {
    const browserAxios = require(join(DIST_DIR, 'browser/axios.cjs'));
    const nodeAxios = require(join(DIST_DIR, 'node/axios.cjs'));

    assertAxiosInstance(browserAxios);
    assertAxiosInstance(nodeAxios);
  });

  it('preserves browser ESM default and named exports', async () => {
    const axiosModule = await import(pathToFileURL(join(DIST_DIR, 'esm/axios.js')));

    assertAxiosInstance(axiosModule.default);
    expect(axiosModule.AxiosError).toBe(axiosModule.default.AxiosError);
    expect(axiosModule.AxiosHeaders).toBe(axiosModule.default.AxiosHeaders);
    expect(axiosModule.VERSION).toBe(packageJSON.version);
  });

  it('keeps Node dependencies out of browser artifacts', () => {
    for (const [file] of browserArtifacts) {
      const source = readArtifact(file);

      expect(source).not.toContain('follow-redirects');
      expect(source).not.toContain('https-proxy-agent');
      expect(source).not.toContain('proxy-from-env');
      expect(source).not.toMatch(/require\(["']form-data["']\)/);
    }
  });

  it('preserves selective Node dependency externalization', () => {
    const source = readArtifact('node/axios.cjs');

    expect(source).toMatch(/require\(["']follow-redirects["']\)/);
    expect(source).toMatch(/require\(["']https-proxy-agent["']\)/);
    expect(source).toMatch(/require\(["']form-data["']\)/);
    expect(source).not.toMatch(/require\(["']proxy-from-env["']\)/);
  });
});
