const {
  addPlugins,
  createConfig,
  defineConstants,
  entryPoint,
  env,
  setOutput,
  sourceMaps,
  resolve
} = require('@webpack-blocks/webpack')
const babel = require('@webpack-blocks/babel')
const uglify = require('@webpack-blocks/uglify')

const path = require('path')
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')

module.exports = createConfig([
  entryPoint('./lib/browser.js'),
  setOutput({
    path: path.resolve(__dirname, 'dist/browser'),
    filename: 'bundle.js',
    library: 'axios',
    libraryTarget: 'var'
  }),
  defineConstants({
    'process.env.NODE_ENV': process.env.NODE_ENV || 'development',
    'process.env.TARGET_ENV': 'browser'
  }),
  babel({
    presets: [
      ['@babel/env', { targets: 'last 2 versions, ie 11', modules: false }]
    ],
    plugins: [
      'lodash'
    ]
  }),
  addPlugins([
    new LodashModuleReplacementPlugin()
  ]),
  env('production', [
    setOutput({
      filename: 'bundle.min.js'
    }),
    uglify()
  ]),
  env('development', [
    uglify({
      uglifyOptions: {
        output: {
          beautify: false,
          preserve_line: true
        },
        mangle: false
      }
    })
  ]),
  env('test', [
    sourceMaps('inline-source-map')
  ]),
  // TODO: tree shaking instead of explicit replace
  resolve({
    alias: {
      './adapters/http': path.resolve(__dirname, 'lib/adapters/xhr')
    }
  })
])
