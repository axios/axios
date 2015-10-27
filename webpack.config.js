var webpack = require('webpack');
var config = {};

function generateConfig(name) {
  var uglify = name.indexOf('min') > -1;
  var config = {
    entry: './index.js',
    output: {
      path: 'dist/',
      filename: name + '.js',
      sourceMapFilename: name + '.map',
      library: 'axios',
      libraryTarget: 'umd'
    },
    node: {
      process: false
    },
    externals: [
      {
        './adapters/http': 'var undefined'
      }
    ],
    devtool: 'source-map'
  };
 
  if (uglify) {
    config.plugins = [
      new webpack.optimize.UglifyJsPlugin({
        compressor: {
          warnings: false
        }
      })
    ];
  }

  return config;
}

['axios', 'axios.min'].forEach(function (key) {
  config[key] = generateConfig(key);
});

module.exports = config;

