import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {terser} from "rollup-plugin-terser";
import json from '@rollup/plugin-json';
import { babel } from '@rollup/plugin-babel';

const lib = require("./package.json");
const outputFileName = 'axios';
const name = "axios";
const input = './lib/axios.js';

const buildConfig = ({es5, ...config}) => {

  const build = ({minified}) => ({
    input,
    ...config,
    output: {
      ...config.output,
      file: `${config.output.file}.${minified ? "min.js" : "js"}`
    },
    plugins: [
      json(),
      resolve({browser: true}),
      commonjs(),
      minified && terser(),
      ...(es5 ? [babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env']
      })] : []),
      ...(config.plugins || []),
    ]
  });

  return [
    build({minified: false}),
    build({minified: true}),
  ];
};

export default async () => {
  const year = new Date().getFullYear();
  const banner = `// ${lib.name} v${lib.version} Copyright (c) ${year} ${lib.author}`;

  return [
    ...buildConfig({
      es5: true,
      output: {
        file: `dist/${outputFileName}`,
        name,
        format: "umd",
        exports: "default",
        banner
      }
    }),

    ...buildConfig({
      output: {
        file: `dist/esm/${outputFileName}`,
        format: "esm",
        preferConst: true,
        exports: "named",
        banner
      }
    })
  ]
};
