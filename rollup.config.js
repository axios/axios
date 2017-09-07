var resolve = require('rollup-plugin-node-resolve');
var cjs = require('rollup-plugin-commonjs');
var replace = require('rollup-plugin-replace');
var uglify = require('rollup-plugin-uglify');
var filesize = require('rollup-plugin-filesize');

function generateConfig(isMinify) {
  var files = [{
    src: './index.js',
    dest: 'dist/axios' + (isMinify ? '.min' : '') + '.js'
  }];

  var options = {
    sourceMap: true,
    format: 'umd',
    moduleName: 'axios',
    plugins: [
      resolve({
        jsnext: true,
        main: true,
        browser: true
      }),
      cjs(),
      replace({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }),
      filesize()
    ]
  };

  isMinify && options.plugins.push(uglify());

  return {
    options: options,
    files: files
  };
}

module.exports = {
  build: generateConfig(false),
  minify: generateConfig(true)
};
