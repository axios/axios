module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    clean: {
      dist: 'dist/**'
    },

    update_json: {
      bower: {
        src: 'package.json',
        dest: 'bower.json',
        fields: [
          'name',
          'description',
          'version',
          'homepage',
          'license',
          'keywords'
        ]
      }
    },

    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      single: {
        singleRun: true
      },
      continuous: {
        singleRun: false
      }
    },

    nodeunit: {
      all: ['test/unit/*.js']
    },

    webpack: generateWebpackConfig(),

    watch: {
      build: {
        files: ['lib/**/*.js'],
        tasks: ['build']
      },
      test: {
        files: ['lib/**/*.js', 'test/**/*.js'],
        tasks: ['test']
      }
    }
  });

  grunt.registerTask('test', ['webpack:global', 'nodeunit', 'karma:single']);
  grunt.registerTask('build', ['webpack']);
  grunt.registerTask('publish', ['clean', 'test', 'build', 'update_json']);

  function generateWebpackConfig() {
    var webpack = require('webpack');
    var webpackConfig = {};
    var webpackBase = {
      entry: './index.js',
      output: {
        path: 'dist/',
        filename: 'axios.js',
        library: 'axios'
      },
      devtool: '#inline-source-map'
    };

    ['amd', 'global'].forEach(function (key) {
      webpackConfig[key] = JSON.parse(JSON.stringify(webpackBase));
      webpackConfig[key + '-min'] = JSON.parse(JSON.stringify(webpackBase));
      webpackConfig[key + '-min'].pugins = [
        new webpack.optimize.UglifyJsPlugin()
      ];
    });

    webpackConfig['amd'].output.filename = 'axios.amd.js';
    webpackConfig['amd'].output.libraryTarget = 'amd';
    webpackConfig['amd-min'].output.filename = 'axios.amd.min.js';
    webpackConfig['amd-min'].output.libraryTarget = 'amd';
    webpackConfig['global-min'].output.filename = 'axios.min.js';

    return webpackConfig;
  }
};