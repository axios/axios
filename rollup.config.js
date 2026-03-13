import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';
import { babel } from '@rollup/plugin-babel';
import bundleSize from 'rollup-plugin-bundle-size';
import aliasPlugin from '@rollup/plugin-alias';
import path from 'path';

const lib = require('./package.json');
const outputFileName = 'axios';
const name = 'axios';
const namedInput = './index.js';
const defaultInput = './lib/axios.js';

const buildConfig = ({ es5, browser = true, minifiedVersion = true, alias, ...config }) => {
  const { file } = config.output;
  const ext = path.extname(file);
  const basename = path.basename(file, ext);
  const extArr = ext.split('.');
  extArr.shift();

  const build = ({ minified }) => ({
    input: namedInput,
    ...config,
    output: {
      ...config.output,
      file: `${path.dirname(file)}/${basename}.${(minified ? ['min', ...extArr] : extArr).join('.')}`,
    },
    plugins: [
      aliasPlugin({
        entries: alias || [],
      }),
      json(),
      resolve({ browser }),
      commonjs(),

      minified && terser(),
      minified && bundleSize(),
      ...(es5
        ? [
            babel({
              babelHelpers: 'bundled',
              presets: ['@babel/preset-env'],
            }),
          ]
        : []),
      ...(config.plugins || []),
    ],
  });

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

export default async () => {
  const year = new Date().getFullYear();
  const banner = `/*! Axios v${lib.version} Copyright (c) ${year} ${lib.author} and contributors */`;

  return [
    // browser ESM bundle for CDN
    ...buildConfig({
      input: namedInput,
      output: {
        file: `dist/esm/${outputFileName}.js`,
        format: 'esm',
        preferConst: true,
        exports: 'named',
        banner,
      },
    }),

    // Browser UMD bundle for CDN
    ...buildConfig({
      input: defaultInput,
      es5: true,
      output: {
        file: `dist/${outputFileName}.js`,
        name,
        format: 'umd',
        exports: 'default',
        banner,
      },
    }),

    // Browser CJS bundle
    ...buildConfig({
      input: defaultInput,
      es5: false,
      minifiedVersion: false,
      output: {
        file: `dist/browser/${name}.cjs`,
        name,
        format: 'cjs',
        exports: 'default',
        banner,
      },
    }),

    // Node.js commonjs bundle (transpiled for Node 12)
    {
      input: defaultInput,
      external: nodeCjsExternal,
      output: {
        file: `dist/node/${name}.cjs`,
        format: 'cjs',
        preferConst: true,
        exports: 'default',
        banner,
      },
      plugins: [
        resolve(),
        commonjs(),
        babel({
          babelHelpers: 'bundled',
          presets: [['@babel/preset-env', { targets: { node: '12' } }]],
        }),
      ],
    },
  ];
};
