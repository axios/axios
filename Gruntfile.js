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

    ts: {
      test: {
        src: ['test/typescript/*.ts'],
        out: 'test/typescript/out.js',
        options: {
          module: 'commonjs',
        }
      }
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
          src: ['dist/*.js']
        }
      }
    },

    eslint: {
      target: ['lib/**/*.js']
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

    webpack: require('./webpack.config.js'),

    watch: {
      build: {
        files: ['lib/**/*.js'],
        tasks: ['build']
      },
      test: {
        files: ['lib/**/*.js', 'test/**/*.js', '!test/typescript/axios.js', '!test/typescript/out.js'],
        tasks: ['test']
      }
    }
  });

  grunt.registerTask('test', 'Run the jasmine and nodeunit tests', ['eslint', 'nodeunit', 'karma:single', 'ts']);
  grunt.registerTask('build', 'Run webpack and bundle the source', ['webpack']);
  grunt.registerTask('publish', 'Prepare the code for release', ['clean', 'test', 'build', 'usebanner', 'update_json']);
};
