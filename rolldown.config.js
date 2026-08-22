import { defineConfig } from 'rolldown';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const lib = require('./package.json');
const outputFileName = 'axios';
const name = 'axios';
const namedInput = './index.js';
const defaultInput = './lib/axios.js';

const buildConfig = ({
  input = namedInput,
  minifiedVersion = true,
  platform = 'browser',
  target,
  output,
  ...config
}) => {
  const build = ({ minified }) => {
    const ext = path.extname(output.file);
    const file = minified ? `${output.file.slice(0, -ext.length)}.min${ext}` : output.file;

    return {
      input,
      platform,
      tsconfig: false,
      transform: {
        target,
      },
      ...config,
      output: {
        ...output,
        file,
        minify: minified,
        sourcemap: minified,
      },
    };
  };

  const configs = [build({ minified: false })];

  if (minifiedVersion) {
    configs.push(build({ minified: true }));
  }

  return configs;
};

const nodeCjsExternal = (id) => {
  if (id === 'proxy-from-env') {
    return false;
  }

  if (id.startsWith('.') || path.isAbsolute(id) || id.startsWith('\0')) {
    return false;
  }

  return true;
};

export default defineConfig(() => {
  const year = new Date().getFullYear();
  const banner = `/*! Axios v${lib.version} Copyright (c) ${year} ${lib.author} and contributors */`;

  return [
    // Browser ESM bundle for CDN
    ...buildConfig({
      target: 'es2018',
      output: {
        file: `dist/esm/${outputFileName}.js`,
        format: 'esm',
        exports: 'named',
        banner,
      },
    }),

    // Modern browser UMD bundle for CDN and classic script loaders
    ...buildConfig({
      input: defaultInput,
      target: 'es2018',
      output: {
        file: `dist/${outputFileName}.js`,
        name,
        format: 'umd',
        exports: 'default',
        banner,
      },
    }),

    // Browser CommonJS bundle
    ...buildConfig({
      input: defaultInput,
      minifiedVersion: false,
      target: 'es2018',
      output: {
        file: `dist/browser/${name}.cjs`,
        name,
        format: 'cjs',
        exports: 'default',
        banner,
      },
    }),

    // Node.js CommonJS bundle
    ...buildConfig({
      input: defaultInput,
      minifiedVersion: false,
      platform: 'node',
      target: 'node20',
      external: nodeCjsExternal,
      output: {
        file: `dist/node/${name}.cjs`,
        format: 'cjs',
        exports: 'default',
        banner,
      },
    }),
  ];
});
