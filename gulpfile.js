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

// Move all JS assets from node_modules into the JS folder
gulp.task('assets', () => {
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

gulp.task('default', ['assets', 'sass', 'sass:watch', 'ts:watch']);
