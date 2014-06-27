var gulp = require('gulp');

var uglify = require('gulp-uglify');
var sweetjs = require('gulp-sweetjs');
var mixotroph = require('gulp-mixotroph');

gulp.task('compileSpecs', function() {
  return gulp.src("src/benches/*.js")
    .pipe(mixotroph({mode:"spec",snippetdir:"src/macros/snippets"}))
    .pipe(sweetjs({modules: ['./node_modules/minimalasm/mnlasm.sjs'], readableNames: true}))
    .pipe(uglify())
    .pipe(gulp.dest("gen/specs"));
});