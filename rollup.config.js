import alias from '@rollup/plugin-alias';
import analyze from 'rollup-plugin-analyzer'
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {terser} from "rollup-plugin-terser";
import json from '@rollup/plugin-json';
import { babel } from '@rollup/plugin-babel';
import autoExternal from 'rollup-plugin-auto-external';
import bundleSize from 'rollup-plugin-bundle-size';
import copy from 'rollup-plugin-copy';
import path from 'path';

const lib = require("./package.json");
const outputFileName = 'axios';
const name = "axios";
const namedInput = './index.js';
const defaultInput = './lib/axios.js';

const buildConfig = ({
  es5,
  node = true,
  pure = false,
  esm = false,
  browser = true,
  minifiedVersion = true,
  typeHint = false,
  ...config
}) => {
  const {file} = config.output;
  const ext = path.extname(file);
  const basename = path.basename(file, ext);
  const extArr = ext.split('.');
  extArr.shift();
  if (node) {
    delete config.node;
  }
  if (pure) {
    delete config.pure;
  }
  delete config.esm;
  delete config.typeHint;

  // relative to `./lib/platform/`
  let platformTarget = './generic/index.js';
  if (browser) {
    platformTarget = './browser/index.js';
  } else if (pure) {
    platformTarget = './generic/index.js';
  }

  const build = ({minified}) => ({
    input: namedInput,
    ...config,
    output: {
      ...config.output,
      file: `${path.dirname(file)}/${basename}.${(minified ? ['min', ...extArr] : extArr).join('.')}`
    },
    plugins: [
      json(),
      resolve(Object.assign({}, {
        browser,
        preferBuiltins: node,
      }, node ? {
        exportConditions: ['node']
      } : {}, pure ? {
        exportConditions: ['generic', 'default']
      } : {})),
      commonjs(Object.assign({}, pure ? {
        transformMixedEsModules: true
      }: {})),
      minified && terser(),
      minified && bundleSize(),
      ...(es5 ? [babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env']
      })] : []),
      ...(config.plugins || []),
    ].concat(typeHint ? [
      // copy typings so that they can be referenced from compatible JS targets.
      copy({
        targets: [
          {
            src: pure ? './index.generic.d.ts' : './index.d.ts',
            dest: `dist/${browser ? 'browser' : 'generic'}`,
            rename: `axios.d.ts`
          },
          {
            src: pure ? './index.generic.d.cts' : './index.d.cts',
            dest: `dist/${browser ? 'browser' : 'generic'}`,
            rename: 'axios.d.cts'
          },
        ].filter(i => i)
      })
    ] : []).concat((esm || pure || browser) ? [
      alias({entries: [
        {
          find: '#platform',
          replacement: platformTarget
        },

        // splice in a `AbortController` alias, which is expected to exist in generic environments
        {
          find: '#abortController',
          replacement: `../platform/${browser ? 'browser' : 'generic'}/classes/AbortController.js`
        },

        // splice in a `FormData` alias, which is expected to exist in generic environments
        {
          find: '#formData',
          replacement: `../platform/${browser ? 'browser' : 'generic'}/classes/FormData.js`
        },

        // alias `#httpAdapter` adapter to `null` adapter on non-node platforms where it is not supported
        {
          find: '#httpAdapter',
          replacement: '../helpers/null.js'
        },

        // alias `#xhrAdapter` to `null` except for browser builds
        browser ? {
          find: '#xhrAdapter',
          replacement: './xhr.js'
        } : {
          find: '#xhrAdapter',
          replacement: '../helpers/null.js'
        },

        // resolve the browser or native `fetch` implementation aliases
        {
          find: '#fetchApi',
          replacement: `../platform/${browser ? 'browser' : 'generic'}/classes/FetchAPI.js`
        },

        // alias `stream` module to `readable-stream`, but only in pure environments and browser builds
        pure || browser ? {
          find: 'stream',
          replacement: 'readable-stream'
        } : undefined
      ].filter(i => i)})
    ] : []).concat((pure || browser) ? [
      analyze()
    ] : [])
  });

  const configs = [
    build({minified: false}),
  ];

  if (minifiedVersion) {
    configs.push(build({minified: true}))
  }

  return configs;
};

export default async () => {
  const year = new Date().getFullYear();
  const typeReference = (browser) => `/// <reference types="./${browser ? 'axios.d.cts' : 'axios.d.ts'}" />`;
  const banner = `// Axios v${lib.version} Copyright (c) ${year} ${lib.author} and contributors`;

  return [
    // Pure JS ESM bundle for workers, Deno, etc.
    ...buildConfig({
      es5: false,
      browser: false,
      node: false,
      pure: true,
      typeHint: true,
      minifiedVersion: true,
      input: namedInput,
      output: {
        file: `dist/generic/${outputFileName}.mjs`,
        format: "esm",
        preferConst: true,
        exports: "named",
        banner: `${typeReference()}\n${banner}`
      }
    }),

    // Browser ESM bundle for CDN
    ...buildConfig({
      browser: true,
      node: false,
      pure: false,
      esm: true,
      input: namedInput,
      output: {
        file: `dist/esm/${outputFileName}.js`,
        format: "esm",
        preferConst: true,
        exports: "named",
        banner
      }
    }),

    // Browser UMD bundle for CDN
    ...buildConfig({
      browser: true,
      node: false,
      pure: false,
      input: defaultInput,
      es5: true,
      output: {
        file: `dist/${outputFileName}.js`,
        name,
        format: "umd",
        exports: "default",
        banner
      }
    }),

    // Browser CJS bundle
    ...buildConfig({
      browser: true,
      node: false,
      pure: false,
      input: defaultInput,
      es5: false,
      minifiedVersion: false,
      output: {
        file: `dist/browser/${name}.cjs`,
        name,
        format: "cjs",
        exports: "default",
        banner
      }
    }),

    // Node.js commonjs bundle
    {
      input: defaultInput,
      output: {
        file: `dist/node/${name}.cjs`,
        format: "cjs",
        preferConst: true,
        exports: "default",
        banner
      },
      plugins: [
        autoExternal(),
        resolve(),
        commonjs(),
        alias({entries: [
            {
              find: '#platform',
              replacement: './node/index.js'  // relative to `lib/platform/`
            },
            {
              find: '#abortController',
              replacement: '../platform/node/classes/AbortController.js'
            },
            {
              find: '#httpAdapter',
              replacement: './http.js'
            },
            {
              find: '#xhrAdapter',
              replacement: '../helpers/null.js'
            },
            {
              find: '#formData',
              replacement: '../platform/node/classes/FormData.js'
            },
            {
              find: '#fetchApi',
              replacement: `../platform/node/classes/FetchAPI.js`
            },
        ]}),
      ]
    }
  ]
};
