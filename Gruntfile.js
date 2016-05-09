
module.exports = function(grunt) {
	
    grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
        'string-replace': {
            dist: {
                files: [
                    {expand: true, cwd: 'build/', src: 'main-minsafe.js', dest: 'build/'},
                    {expand: true, cwd: 'src/', src: 'init.html', dest: 'build/'},
                    {expand: true, cwd: 'src/', src: 'index.html', dest: 'build/'}
                ],
                options: {
                    replacements: [{
                        pattern: /{{ VERSION }}/g,
                        replacement: '<%= pkg.version %>'
                    }]
                }
            }
        },
        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            app: {
                files: {
                    'build/main-minsafe.js': [
                        'src/js/app.js',
                        'src/js/app.common.js',
                        'src/js/controller.init.js',
                        'src/js/controller.main.js',
                        'src/js/controller.okcancelctrl.js',
                        'src/js/controller.otactrl.js',
                        'src/js/controller.connectionctrl.js',
                        'src/js/controller.toastctrl.js',
                        'src/js/directive.svgicon.js',
                        'src/js/directive.wificon.js',
                        'src/js/factory.espcon.js',
                        'src/js/factory.interceptor.js',
                    ]
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
                        'src/js/tinycolor.js',
                        'src/js/mdColorPicker.js',
                        'build/main-minsafe.js']
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
                    {expand: true, cwd: 'build/', src: ['*.html'], dest:'dist', ext: '.html.gz'},
                    {expand: true, cwd: 'build/', src: ['app.min.js'], dest:'dist', ext: '.min.js.gz'},
                    {expand: true, cwd: 'build/', src: ['app.min.css'], dest:'dist', ext: '.min.css.gz'},
                ]
            }
        },
    });
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-contrib-concat'); // which NPM packages to load
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.registerTask('version', 'output version', function() {
		pkg = grunt.file.readJSON('package.json');
		grunt.file.write('VERSION', pkg.version);
	});
	grunt.registerTask('cleanup', 'cleanup tmp files', function() {
		grunt.file.delete('build', [{force:true}]);
	});
    grunt.registerTask('default', ['ngAnnotate', 'string-replace', 'concat', 'uglify', 'cssmin', 'compress']);
	grunt.registerTask('release', ['default', 'version']);
};