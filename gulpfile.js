var gulp = require('gulp');
//var argv = require('yargs').argv;
var uglify = require('gulp-uglify');
var sweetjs = require('gulp-sweetjs');
var mixotroph = require('gulp-mixotroph');
var mnlasm = require('minimalasm');

function compileCore(mode) {
  return gulp.src("src/benches/*.js")
      .pipe(mixotroph({mode:"SPEC",snippetdir:"src/macros/snippets"}))
      .pipe(mnlasm({}))
      .pipe(sweetjs({modules: ['./node_modules/minimalasm/mnlasm.sjs'], readableNames: true}));
}

gulp.task('compileSpecs', function() {
  return compileCore("SPEC").pipe(gulp.dest("gen/spec"));
});
gulp.task("compileSpecsMin", function() {
    return compileCore("SPEC").pipe(uglify())
    .pipe(gulp.dest("gen/spec"));
});

gulp.task('compilePerf', function() {
  return compileCore("PERF").pipe(uglify())
    .pipe(gulp.dest("gen/spec"));
});

gulp.task('cleanSpecs', function() {
  return gulp.src("gen/spec/*.js", {read: false})
    .pipe(clean());
});

gulp.task('cleanPerf', function() {
  return gulp.src("gen/perf/*.js", {read: false})
    .pipe(clean());
});

gulp.task('cleanAll', ["cleanSpecs", "cleanPerf"]);

