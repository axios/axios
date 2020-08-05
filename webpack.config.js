'use strict';

var path = require('path');
var webpack = require('webpack');
var TerserPlugin = require('terser-webpack-plugin');

var configs = {};

function generateConfig(name) {
  var uglify = name.includes('.min');
  var mode = JSON.stringify(process.env.NODE_ENV);
  var banner = 'axios v' + require(path.resolve(__dirname, './package.json')).version + ' | (c) ' + new Date().getFullYear() + ' by Matt Zabriskie';
  var terserOptions = {
    cache: true,
    parallel: true,
    sourceMap: true,
    extractComments: false
  };

  var config = {
    entry: './index.js',
    output: {
      path: path.resolve(__dirname, './dist/'),
      filename: name + '.js',
      sourceMapFilename: name + '.map',
      library: 'axios',
      libraryTarget: 'umd'
    },
    node: {
      process: false
    },
    devtool: 'source-map',
    mode: 'production'
  };

  config.plugins = [
    new webpack.EnvironmentPlugin({
      NODE_ENV: mode
    }),
    new webpack.BannerPlugin({
      banner: banner
    })
  ];

  if (mode === 'production') {
    config.mode = 'production';
  } else if (mode === 'development') {
    config.mode = 'development';
  }

  config.optimization = {
    minimizer: []
  };

  if (!uglify) {
    config.optimization.minimize = false;
  }

  config.optimization.minimizer.push(new TerserPlugin(terserOptions));

  return config;
}

['axios', 'axios.min'].forEach(function(key) {
  configs[key] = generateConfig(key);
});

module.exports = configs;
