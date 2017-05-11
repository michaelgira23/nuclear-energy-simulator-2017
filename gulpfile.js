const fs   = require('fs');
const gulp = require('gulp');
const sass = require('gulp-sass');

// Compile Sass
gulp.task('sass', () => {
	return gulp.src('./src/scss/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('./src/public/css'));
});

// Listen for file changes to compile Sass
gulp.task('sass:watch', () => {
	gulp.watch('./src/scss/**/*.scss', ['sass']);
});

// Move all JS assets from node_modules into the JS folder
gulp.task('assets', () => {
	gulp.src(['./node_modules/paper/dist/paper-full.js'])
		.pipe(gulp.dest('./src/public/js'));
});

gulp.task('default', ['assets', 'sass', 'sass:watch']);
