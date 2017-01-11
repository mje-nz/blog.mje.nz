// Generated on 2017-01-09 using generator-jekyllrb 1.4.1
'use strict';

// Directory reference:
//   css: assets/css
//   javascript: assets/js
//   images: assets/img
//   fonts: assets/fonts

module.exports = function (grunt) {
  // Show elapsed time after tasks run
  require('time-grunt')(grunt);
  // Load all Grunt tasks
  require('jit-grunt')(grunt, {
    buildcontrol: 'grunt-build-control'
  });

  grunt.initConfig({
    // Configurable paths
    yeoman: {
      app: 'app',
      dist: 'dist'
    },
    watch: {
      jekyll: {
        files: [
          '<%= yeoman.app %>/**/*',
          '_config.yml'
        ],
        tasks: ['jekyll:server']
      }
    },
    browserSync: {
      server: {
        options: {
          server: {
            baseDir: [
              ".jekyll",
            ]
          },
          watchTask: true
        }
      },
      dist: {
        options: {
          server: {
            baseDir: "<%= yeoman.dist %>"
          }
        }
      }
    },
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= yeoman.dist %>/*',
            // Running Jekyll also cleans the target directory.  Exclude any
            // non-standard `keep_files` here (e.g., the generated files
            // directory from Jekyll Picture Tag).
            '!<%= yeoman.dist %>/.git*'
          ]
        }]
      },
      server: [
        '.jekyll'
      ]
    },
    jekyll: {
      options: {
        config: '_config.yml,_config.build.yml',
        src: '<%= yeoman.app %>'
      },
      dist: {
        options: {
          dest: '<%= yeoman.dist %>',
        }
      },
      server: {
        options: {
          config: '_config.yml',
          dest: '.jekyll'
        }
      },
      check: {
        options: {
          doctor: true
        }
      }
    },
    usemin: {
      options: {
        assetsDirs: ['<%= yeoman.dist %>', '<%= yeoman.dist %>/assets/img']
      },
      html: ['<%= yeoman.dist %>/**/*.html'],
      css: ['<%= yeoman.dist %>/assets/css/**/*.css']
    },
    htmlmin: {
      dist: {
        options: {
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeAttributeQuotes: true,
          removeRedundantAttributes: true
        },
        files: [{
          expand: true,
          cwd: '<%= yeoman.dist %>',
          src: '**/*.html',
          dest: '<%= yeoman.dist %>'
        }]
      }
    },
    uncss: {
      options: {
        htmlroot: '<%= yeoman.dist %>'
      },
      dist: {
        files: {
          '<%= yeoman.dist %>/assets/css/main.css': ['<%= yeoman.dist %>/**/*.html']
        }
      }
    },
    autoprefixer: {
      options: {
        browsers: ['last 2 versions', '> 1%']
      },
      dist: {
        files: {
          '<%= yeoman.dist %>/assets/css/main.css': ['<%= yeoman.dist %>/assets/css/main.css'],
        },
      }
    },
    cssmin: {
      dist: {
        files: {
          '<%= yeoman.dist %>/assets/css/main.css': ['<%= yeoman.dist %>/assets/css/main.css'],
        },
        options: {
          check: 'gzip'
        }
      }
    },
    imagemin: {
      dist: {
        options: {
          progressive: true
        },
        files: [{
          expand: true,
          cwd: '<%= yeoman.dist %>',
          src: '**/*.{jpg,jpeg,png}',
          dest: '<%= yeoman.dist %>'
        }]
      }
    },
    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.dist %>',
          src: '**/*.svg',
          dest: '<%= yeoman.dist %>'
        }]
      }
    },
    filerev: {
      options: {
        length: 4
      },
      dist: {
        files: [{
          src: [
            '<%= yeoman.dist %>/assets/js/**/*.js',
            '<%= yeoman.dist %>/assets/css/**/*.css',
            '<%= yeoman.dist %>/assets/img/**/*.{gif,jpg,jpeg,png,svg,webp}',
            '<%= yeoman.dist %>/assets/fonts/**/*.{eot*,otf,svg,ttf,woff}'
          ]
        }]
      }
    },
    buildcontrol: {
      dist: {
        options: {
          remote: 'git@github.com:mje-nz/blog.mje.nz.git',
          branch: 'gh-pages',
          commit: true,
          push: true,
          connectCommits: false
        }
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
        'Gruntfile.js',
        '<%= yeoman.app %>/assets/js/**/*.js'
      ]
    },
    csslint: {
      options: {
        csslintrc: '.csslintrc'
      },
      check: {
        src: [
          '<%= yeoman.app %>/assets/css/**/*.css'
        ]
      }
    }
  });

  // Define Tasks
  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'browserSync:dist']);
    }

    grunt.task.run([
      'clean:server',
      'jekyll:server',
      'browserSync:server',
      'watch'
    ]);
  });

  grunt.registerTask('check', [
    'clean:server',
    'jekyll:check',
    'jshint:all',
    'csslint:check'
    // 'scsslint'
  ]);

  grunt.registerTask('build', [
    'clean',
    // Jekyll cleans files from the target directory, so must run first
    'jekyll:dist',
    'uncss',
    'autoprefixer',
    'cssmin',
    'imagemin',
    'svgmin',
    'filerev',
    'usemin',
    'htmlmin'
    ]);

  grunt.registerTask('checkenv', function () {
    // Sanity checks to minimise deployment surprises

    if (process.env.TRAVIS) {
      // Don't care
      return;
    }

    const exec_raw = require('child_process').execSync,
          exec = function (cmd) {return exec_raw(cmd, {'encoding': 'utf8'}).trim()},
          current_branch = exec('git rev-parse --abbrev-ref HEAD'),
          current_repo = exec('git remote get-url origin'),
          buildcontrol_remote = grunt.config.get('buildcontrol.dist.options.remote'),
          unpushed_commits_list = exec('git cherry');

    if (current_branch != 'master') {
     console.log(current_branch);
     grunt.log.error('Deploy error: Not on master branch (on ' + current_branch.trim() + ' instead)');
     return false;
    }

    if (current_repo != buildcontrol_remote) {
      grunt.log.error('Deploy error: This repo\'s origin remote is ' + current_repo + ', buildcontrol is pushing to ' + buildcontrol_remote);
      return false;
    }

    if (unpushed_commits_list != '') {
      const unpushed_commits_count = unpushed_commits_list.split(/\r\n|\r|\n/).length;
      grunt.log.error('Deploy error: ' + unpushed_commits_count + ' unpushed commits');
      return false;
    }

  });

  grunt.registerTask('deploy', [
    'checkenv',
    //'check',
    //'test',
    'build',
    'buildcontrol'
    ]);

  grunt.registerTask('default', [
    'check',
    'test',
    'build'
  ]);
};
