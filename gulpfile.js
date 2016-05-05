'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var replace = require('gulp-replace-task');
var fs = require('fs');
var yargs = require('yargs');
var ip = require('ip');
var _ = require('underscore');

var paths = {
  sass: ['./scss/**/*.scss'],
  templates: ['./templates/*-template.js']
};

gulp.task('default', ['sass', 'replace-config']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/assets/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/assets/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

gulp.task('replace-config', function () {
  var env = yargs.argv.env || process.env.REPLACE_ENV;
  var configs = JSON.parse(fs.readFileSync('./app-config.json', 'utf8'));
  var config = {
    serverUrl : 'http://' + ip.address(),
    serverPort : 3000
  };

  if (env) {
    config = _.find(configs, function (value, key) {
      return key.toLowerCase() === env.toLowerCase();
    });
  }
  var patterns = [];
  Object.keys(config).forEach(function (key) {
    patterns.push({
      match : key,
      replacement : config[key]
    });
  });
  gulp.src(paths.templates)
    .pipe(replace({patterns : patterns}))
    .pipe(rename(function (path) {
      path.basename = path.basename.replace('-template', '');
      return path;
    }))
    .pipe(gulp.dest('./www/app/shared/'));
});
