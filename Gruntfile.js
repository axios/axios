module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/* <%= pkg.name %> v<%= pkg.version %> | (c) <%= grunt.template.today("yyyy") %> by Matt Zabriskie */\n'
    },

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

    usebanner: {
      all: {
        options: {
          banner: '<%= meta.banner %>',
          linebreak: false
        },
        files: {
          src: ['dist/*.min.js']
        }
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
      all: ['test/unit/**/*.js']
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

  grunt.registerTask('test', 'Run the jasmine and nodeunit tests', ['webpack:global', 'nodeunit', 'karma:single']);
  grunt.registerTask('build', 'Run webpack and bundle the source', ['webpack']);
  grunt.registerTask('publish', 'Prepare the code for release', ['clean', 'test', 'build', 'usebanner', 'update_json']);

  function generateWebpackConfig() {
    var webpack = require('webpack');
    var webpackConfig = {};
    var webpackBase = {
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
      webpackConfig[key] = JSON.parse(JSON.stringify(webpackBase));
      webpackConfig[key + '-min'] = JSON.parse(JSON.stringify(webpackBase));

      // TODO: UglifyJsPlugin doesn' work, but optimize.minimize is deprecated
      webpackConfig[key + '-min'].optimize = {minimize: true};
//      webpackConfig[key + '-min'].pugins = [
//        new webpack.optimize.UglifyJsPlugin()
//      ];
    });

    webpackConfig['amd'].output.filename = 'axios.amd.js';
    webpackConfig['amd'].output.sourceMapFilename = 'axios.amd.map';
    webpackConfig['amd'].output.libraryTarget = 'amd';

    webpackConfig['amd-standalone'].output.filename = 'axios.amd.standalone.js';
    webpackConfig['amd-standalone'].output.sourceMapFilename = 'axios.amd.standalone.map';
    webpackConfig['amd-standalone'].output.libraryTarget = 'amd';
    webpackConfig['amd-standalone'].externals[0]['es6-promise'] = 'var undefined';

    webpackConfig['amd-min'].output.filename = 'axios.amd.min.js';
    webpackConfig['amd-min'].output.sourceMapFilename = 'axios.amd.min.map';
    webpackConfig['amd-min'].output.libraryTarget = 'amd';

    webpackConfig['amd-standalone-min'].output.filename = 'axios.amd.standalone.min.js';
    webpackConfig['amd-standalone-min'].output.sourceMapFilename = 'axios.amd.standalone.min.map';
    webpackConfig['amd-standalone-min'].output.libraryTarget = 'amd';
    webpackConfig['amd-standalone-min'].externals[0]['es6-promise'] = 'var undefined';

    webpackConfig['global-standalone'].output.filename = 'axios.standalone.js';
    webpackConfig['global-standalone'].output.sourceMapFilename = 'axios.standalone.map';
    webpackConfig['global-standalone'].externals[0]['es6-promise'] = 'var undefined';

    webpackConfig['global-min'].output.filename = 'axios.min.js';
    webpackConfig['global-min'].output.sourceMapFilename = 'axios.min.map';

    webpackConfig['global-standalone-min'].output.filename = 'axios.standalone.min.js';
    webpackConfig['global-standalone-min'].output.sourceMapFilename = 'axios.standalone.min.map';
    webpackConfig['global-standalone-min'].externals[0]['es6-promise'] = 'var undefined';

    return webpackConfig;
  }
};