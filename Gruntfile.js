
module.exports = function(grunt) {
	
    grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            app: {
                files: {
                    'build/main-minsafe.js': ['src/main.js']
                }
            }
        },
        concat: { // concatination task settings
            dist: {
                src: [
                    'src/style.css',
                    'bower_components/angular-material/angular-material.min.css'
                ],
                dest: 'build/app.css',
            }
        },
        cssmin:{
            target: {
                files: {
                    'build/app.min.css': ['build/app.css']
                }
            }
        },
        uglify: {
            dist: {
                options: {
                    sourceMap: true,

                },
                files: {
                    'build/app.min.js': ['bower_components/angular/angular.js',
                        'bower_components/angular-animate/angular-animate.js',
                        'bower_components/angular-aria/angular-aria.js',
                        'bower_components/angular-material/angular-material.js',
                        'src/tinycolor.js',
                        'src/mdColorPicker.js',
                        'build/main-minsafe.js']
                }
            }
        },
		cachebreaker: {
			dev: {
				options: {
					match: ['app.min.js', 'app.min.css'],
					replacement: function (pkg){
						
						return pkg.version;
					}
				},
				files: {
					src: ['src/index.html', 'src/init.html' ]
				}
			}
		},
        compress: {
            main: {
                options: {
                    mode: 'gzip',
                    level: 9
                },
                files: [
                    {expand: true, cwd: 'src/', src: ['*.html'], dest:'dist', ext: '.html.gz'},
                    {expand: true, cwd: 'build/', src: ['app.min.js'], dest:'dist', ext: '.min.js.gz'},
                    {expand: true, cwd: 'build/', src: ['app.min.css'], dest:'dist', ext: '.min.css.gz'},
                ]
            }
        },
    });
    grunt.loadNpmTasks('grunt-contrib-concat'); // which NPM packages to load
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-cache-breaker');
	grunt.registerTask('version', 'output version', function() {
		pkg = grunt.file.readJSON('package.json');
		grunt.file.write('VERSION', pkg.version);
	});
	grunt.registerTask('cleanup', 'cleanup tmp files', function() {
		grunt.file.delete('build', [{force:true}]);
	});
    grunt.registerTask('default', ['ngAnnotate', 'concat', 'uglify', 'cssmin', 'cachebreaker', 'compress', 'cleanup']);
	grunt.registerTask('release', ['default', 'version']);
};