const fs = require('fs');
const gulp = require('gulp');
const sass = require('gulp-sass');
const tsPipeline = require('gulp-webpack-typescript-pipeline');
const path = require('path');

tsPipeline.registerBuildGulpTasks(
	gulp,
	{
		entryPoints: {
			nuclear: path.join(__dirname, 'src/game/main.ts')
		},
		outputDir: path.join(__dirname, 'src/public/js')
	}
);

// Move all images from assets into the public folder
gulp.task('assets:images', () => {
	gulp.src(['./src/assets/**/*.png'])
		.pipe(gulp.dest('./src/public/images'));
});

// Move all JS assets from node_modules into the JS folder
gulp.task('assets:js', () => {
	gulp.src(['./node_modules/paper/dist/paper-full.js'])
		.pipe(gulp.dest('./src/public/js'));
});

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

// Compile Typescript
gulp.task('ts', ['tsPipeline:build:dev']);
gulp.task('ts:prod', ['tsPipeline:build:release']);
gulp.task('ts:watch', ['tsPipeline:watch']);

gulp.task('assets', ['assets:images', 'assets:js']);
gulp.task('dev', ['assets', 'sass', 'sass:watch', 'ts:watch']);
gulp.task('prod', ['assets', 'sass', 'ts:prod']);
gulp.task('default', ['dev']);
