const webpack = require('webpack');

module.exports = {
    basePath: '',
    files: [
      'test/specs/__helpers.js',
      'test/specs/**/*.spec.js',
    ],
    frameworks: ['jasmine-ajax', 'jasmine', 'sinon'],
    preprocessors: {
      'test/specs/__helpers.js': ['webpack', 'sourcemap'],
      'test/specs/**/*.spec.js': ['webpack', 'sourcemap']
    },
    reporters: ['progress', 'coverage'],
    webpack: {
      cache: true,
      devtool: 'inline-source-map',
      externals: [{
        './adapters/http': 'var undefined',
      }],
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('test')
        })
      ]
    }
};