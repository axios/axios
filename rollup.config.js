import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {terser} from "rollup-plugin-terser";
import json from '@rollup/plugin-json';

const lib = require("./package.json");
const outputFileName = 'axios';
const name = "axios";
const input = './lib/axios.js';

const buildConfig = (config) => {

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
