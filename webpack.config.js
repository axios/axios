var config = {};

/**
 * Generates a configuration object for webpack based on the provided name.
 * @param {string} name - The name of the configuration.
 * @returns {Object} - The generated configuration object.
 */
function generateConfig(name) {
  var compress = name.indexOf('min') > -1;
  var config = {
    entry: './index.js',
    output: {
      path: __dirname + '/dist/',
      filename: name + '.js',
      sourceMapFilename: name + '.map',
      library: 'axios',
      libraryTarget: 'umd',
      globalObject: 'this'
    },
    node: false,
    devtool: 'source-map',
    mode: compress ? 'production' : 'development'
  };
  return config;
}

['axios', 'axios.min'].forEach(function (key) {
  config[key] = generateConfig(key);
});

module.exports = config;
