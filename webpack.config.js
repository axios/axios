// @ts-check
'use strict';

var path = require('path');
// installed because webpack requires it by default
var TerserWebpackPlugin = require('terser-webpack-plugin');

/**
 * @param {string} name
 * @param {boolean} compress
 * @returns {import('webpack').Configuration}
 */
function generateConfig(name, compress) {
  return {
    mode: compress ? 'production' : 'development',

    entry: path.resolve(__dirname, 'index.js'),

    output: {
      path: path.join(__dirname, 'dist'),
      globalObject: "'undefined'==typeof self?this:self",
      filename: name + '.js',
      sourceMapFilename: name + '.map',
      library: {
        type: 'umd',
        name: 'axios'
      }
    },

    devtool: 'source-map',

    optimization: {
      minimize: !!compress,
      minimizer: [new TerserWebpackPlugin({ parallel: true })]
    }
  };
}

module.exports.axios = generateConfig('axios', false);
module.exports['axios.min'] = generateConfig('axios.min', true);
