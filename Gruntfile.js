// Generated on 2017-01-09 using generator-jekyllrb 1.4.1
/*jslint node: true, esversion: 6 */
'use strict';

// Directory reference:
//   css: assets/css
//   javascript: assets/js
//   images: assets/img
//   fonts: assets/fonts

module.exports = function (grunt) {
  // Show elapsed time after tasks run
  require('time-grunt')(grunt);

  // Load all Grunt tasks (jit-grunt replaces load-grunt-tasks)
  require('jit-grunt')(grunt, {
    buildcontrol: 'grunt-build-control'
  });

  grunt.initConfig({
    // Paths
    dirs: {
      app: 'app',
      dist: 'dist'
    },

    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= dirs.dist %>/*',
            // Running Jekyll also cleans the target directory.  Exclude any
            // non-standard `keep_files` here (e.g., the generated files
            // directory from Jekyll Picture Tag).
            '!<%= dirs.dist %>/.git*'
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
        src: '<%= dirs.app %>'
      },
      dist: {
        options: {
          dest: '<%= dirs.dist %>',
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

    browserSync: {
      server: {
        bsFiles: {
          src: '.jekyll/**/*'  // Files to sync
        },
        options: {
          server: '.jekyll',  // Folder to serve from
          watchTask: true  // Allow other watch tasks to run after this task
        }
      },
      dist: {
        options: {
          server: '<%= dirs.dist %>'
        }
      }
    },

    watch: {
      jekyll: {
        files: [
          '<%= dirs.app %>/**/*',
          '_config.yml'
        ],
        tasks: ['jekyll:server']
      }
    },

    //TODO: This is supposed to run before the build, but the scripts are in
    // the theme gem so not available until after build
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
        'Gruntfile.js',
        '<%= dirs.app %>/assets/js/**/*.js'
      ]
    },

    //TODO: This is supposed to run before the build, but the stylesheets are in
    // the theme gem so not available until after build
    csslint: {
      options: {
        csslintrc: '.csslintrc'
      },
      check: {
        src: [
          '<%= dirs.app %>/assets/css/**/*.css'
        ]
      }
    },

    uncss: {
      options: {
        htmlroot: '<%= dirs.dist %>'
      },
      dist: {
        files: {
          '<%= dirs.dist %>/assets/css/main.css': ['<%= dirs.dist %>/**/*.html']
        }
      }
    },

    autoprefixer: {
      options: {
        browsers: ['last 2 versions', '> 1%']
      },
      dist: {
        files: {
          '<%= dirs.dist %>/assets/css/main.css': ['<%= dirs.dist %>/assets/css/main.css'],
        },
      }
    },

    cssmin: {
      dist: {
        files: {
          '<%= dirs.dist %>/assets/css/main.css': ['<%= dirs.dist %>/assets/css/main.css'],
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
          cwd: '<%= dirs.dist %>',
          src: '**/*.{jpg,jpeg,png,gif,svg}',
          dest: '<%= dirs.dist %>'
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
            '<%= dirs.dist %>/assets/**/*'
          ]
        }]
      }
    },

    usemin: {
      options: {
        assetsDirs: [
          '<%= dirs.dist %>',  // Need this for absolute URLs
          '<%= dirs.dist %>/assets/css'  // Need this for relative URLs
        ]
      },
      html: ['<%= dirs.dist %>/**/*.html'],
      css: ['<%= dirs.dist %>/assets/css/**/*.css']
    },

    htmlmin: {
      dist: {
        options: {
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeAttributeQuotes: true,
          removeRedundantAttributes: true,
          removeComments: true,
          processConditionalComments: true,
          minifyJS: true,
          processScripts: ['application/ld+json']
        },
        files: [{
          expand: true,
          cwd: '<%= dirs.dist %>',
          src: '**/*.html',
          dest: '<%= dirs.dist %>'
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

    cloudflare_purge: {
      dist: {
        options: {
          // Options stored in Travis environment variables
          apiKey: process.env.CLOUDFLARE_API_KEY,
          email: process.env.CLOUDFLARE_EMAIL,
          zone: process.env.CLOUDFLARE_ZONE
        },
      },
  },
  });

  // Define Tasks
  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'browserSync:dist']);
    }

    grunt.task.run([
      'clean:server',  // Clean .jekyll
      'jekyll:server',  // Build into .jekyll once
      'browserSync:server',  // Start browsersync server
      'watch'  // Watch app/, triggering jekyll:server on changes
    ]);
  });

  grunt.registerTask('check', [
    'clean:server',  // Clean .jekyll
    'jekyll:check',  // Run jekyll doctor
    'jshint:all',  // Run jshint on (unbuilt) JS files
    //'csslint:check'
    // 'scsslint'
  ]);

  grunt.registerTask('build', [
    'clean',  // Clean .jekyll and dist
    'jekyll:dist',  // Build into dist
    'uncss',
    'autoprefixer',
    'cssmin',
    'imagemin',
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
          exec = function (cmd) {return exec_raw(cmd, {'encoding': 'utf8'}).trim();},
          current_branch = exec('git rev-parse --abbrev-ref HEAD'),
          current_repo = exec('git remote get-url origin'),
          buildcontrol_remote = grunt.config.get('buildcontrol.dist.options.remote'),
          unpushed_commits_list = exec('git cherry');

    if (current_branch !== 'master') {
     console.log(current_branch);
     grunt.log.error('Deploy error: Not on master branch (on ' + current_branch.trim() + ' instead)');
     return false;
    }

    if (current_repo !== buildcontrol_remote) {
      grunt.log.error('Deploy error: This repo\'s origin remote is ' + current_repo + ', buildcontrol is pushing to ' + buildcontrol_remote);
      return false;
    }

    if (unpushed_commits_list !== '') {
      const unpushed_commits_count = unpushed_commits_list.split(/\r\n|\r|\n/).length;
      grunt.log.error('Deploy error: ' + unpushed_commits_count + ' unpushed commits');
      return false;
    }

  });

  grunt.registerTask('deploy', [
    'checkenv',
    //'check',
    'build',
    'buildcontrol',  // Push
  ]);

  // Run cloudflare_purge separately to avoid printing out its options and
  // leaking my CloudFlare API key
  grunt.registerTask('purge_cloudflare_cache', ['cloudflare_purge']);

  grunt.registerTask('default', [
    'check',
    'test',
    'build'
  ]);
};
