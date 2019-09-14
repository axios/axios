const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const config = {};

function generateConfig(name) {
  return {
    mode: 'production',
    entry: './index.js',
    output: {
      path: `${__dirname}/dist`,
      filename: name + '.js',
      sourceMapFilename: name + '.map',
      library: 'axios',
      libraryTarget: 'umd'
    },
    node: {
      process: false
    },
    devtool: 'source-map',
    optimization: {
      minimize: name.includes('min'),
      minimizer: [
        // config options documented at https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
        new TerserPlugin({
          sourceMap: true,
        }),
      ],
    },
  };
}

['axios', 'axios.min'].forEach(outputScript => {
  config[outputScript] = generateConfig(outputScript);
});

module.exports = config;
