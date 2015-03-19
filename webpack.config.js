var webpack = require('webpack');

var EXTERNAL_PROMISE = '{Promise: Promise}';
var config = {};
var base = {
  entry: './index.js',
  output: {
    path: 'dist/',
    filename: 'axios.js',
    sourceMapFilename: 'axios.map',
    library: 'axios'
  },
  externals: [
    {
      './adapters/http': 'var undefined'
    }
  ],
  devtool: 'source-map'
};

['amd', 'global', 'amd-standalone', 'global-standalone'].forEach(function (key) {
  config[key] = JSON.parse(JSON.stringify(base));
  config[key + '-min'] = JSON.parse(JSON.stringify(base));

  config[key + '-min'].plugins = [
    new webpack.optimize.UglifyJsPlugin()
  ];
});

config['amd'].output.filename = 'axios.amd.js';
config['amd'].output.sourceMapFilename = 'axios.amd.map';
config['amd'].output.libraryTarget = 'amd';

config['amd-standalone'].output.filename = 'axios.amd.standalone.js';
config['amd-standalone'].output.sourceMapFilename = 'axios.amd.standalone.map';
config['amd-standalone'].output.libraryTarget = 'amd';
config['amd-standalone'].externals[0]['es6-promise'] = EXTERNAL_PROMISE;

config['amd-min'].output.filename = 'axios.amd.min.js';
config['amd-min'].output.sourceMapFilename = 'axios.amd.min.map';
config['amd-min'].output.libraryTarget = 'amd';

config['amd-standalone-min'].output.filename = 'axios.amd.standalone.min.js';
config['amd-standalone-min'].output.sourceMapFilename = 'axios.amd.standalone.min.map';
config['amd-standalone-min'].output.libraryTarget = 'amd';
config['amd-standalone-min'].externals[0]['es6-promise'] = EXTERNAL_PROMISE;

config['global-standalone'].output.filename = 'axios.standalone.js';
config['global-standalone'].output.sourceMapFilename = 'axios.standalone.map';
config['global-standalone'].externals[0]['es6-promise'] = EXTERNAL_PROMISE;

config['global-min'].output.filename = 'axios.min.js';
config['global-min'].output.sourceMapFilename = 'axios.min.map';

config['global-standalone-min'].output.filename = 'axios.standalone.min.js';
config['global-standalone-min'].output.sourceMapFilename = 'axios.standalone.min.map';
config['global-standalone-min'].externals[0]['es6-promise'] = EXTERNAL_PROMISE;

module.exports = config;

