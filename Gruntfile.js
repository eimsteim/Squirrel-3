/*!
 * Squirrel's Gruntfile
 * http://hisquirrel.com
 * Copyright 2013-2014
 * Licensed under MIT (https://github.com/iinterest/Squirrel-3/blob/master/LICENSE.md)
 */
module.exports = function (grunt) {
    'use strict';
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*!\n' +
            ' * Squirrel v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
            ' * Copyright 2011-<%= grunt.template.today("yyyy-mm-dd hh:MM:ss") %> <%= pkg.author %>\n' +
            ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n' +
            ' */\n',
        concat: {
            concatCore: {
                src: [
                    'src/js/core/core.js',
                    'src/js/core/*.js'
                ],
                dest: 'build/js/<%= pkg.name%>-core.js'
            },
            concatPlugins: {
                src: [
                    'build/js/<%= pkg.name%>-core.js',
                    'src/js/*.js'
                ],
                dest: 'build/js/<%= pkg.name%>.js',
                nonull: true
            },
            // 动画 CSS 合并
            concatAnimate: {
                src: [
                    'animate/_base.css',
                    'animate/**/*.css'
                ],
                dest: 'build/css/animate.css'
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            build: {
                src: 'build/js/<%= pkg.name%>.js',
                dest: 'dist/js/<%= pkg.name%>-min.js'
            }
        },
        less: {
            compileCore: {
                files: {
                    'build/css/<%= pkg.name %>.css': 'src/less/squirrel.less'
                }
            }
        },
        cssmin: {
            compress: {
                options: {
                    banner: '<%= banner %>'
                },
                src: [
                    'build/css/<%= pkg.name%>.css',
                    'build/css/animate.css'
                ],
                dest: 'dist/css/<%= pkg.name%>-min.css'
            }
        },
        clean: {
            options: {force: true},
            build: 'build',
            dist: 'dist'
        },
        watch: {
            less: {
                files: 'src/less/*.less',
                tasks: ['less', 'cssmin', 'copy', 'sed']
            },
            script: {
                files: [
                    'src/js/*.js',
                    'src/js/core/*.js'
                ],
                tasks: ['concat:concatCore', 'concat:concatPlugins', 'uglify', 'copy', 'sed']
            }
        },
        jsdoc: {
            dist: {
                src: 'src/js/**/*.js',
                options: {
                    destination: '../Squirrel-Doc/docs/jsdoc'
                }
            }
        },
        copy: {
            fontToDist: {
                expand: true,
                src: 'fonts/*',
                dest: 'dist'
            },
            fontToBuild: {
                expand: true,
                src: 'fonts/*',
                dest: 'build'
            },
            buildToDoc: {
                expand: true,
                src: 'build/**',
                dest: '../Squirrel-Doc/docs/latest/'
            },
            distToDoc: {
                expand: true,
                src: 'dist/**',
                dest: '../Squirrel-Doc/docs/latest/'
            },
            tplIndexToDoc: {
                expand: true,
                flatten: true,
                src: 'doc_tpl/index.html',
                dest: '../Squirrel-Doc/',
                filter: 'isFile'
            },
            tplDocumentationToDoc: {
                expand: true,
                flatten: true,
                src: 'doc_tpl/documentation.html',
                dest: '../Squirrel-Doc/docs/latest/',
                filter: 'isFile'
            }
        },
        autoprefixer: {
            options: {
                browsers: ['android 3']
            },
            multipleFiles: {
                expand: true,
                flatten: true,
                src: 'build/css/animate.css',
                dest: 'build/css/'
            }
        },
        sed: {
            versionNumber: {
                path: [
                    '../Squirrel-Doc/index.html',
                    '../Squirrel-Doc/docs/latest/documentation.html'
                ],
                pattern: '%VERSION%',
                replacement: '<%= pkg.version %>'
            },
            update: {
                path: [
                    '../Squirrel-Doc/index.html',
                    '../Squirrel-Doc/docs/latest/documentation.html'
                ],
                pattern: '%UPDATE%',
                replacement: '<%= grunt.template.today("yyyy-mm-dd") %>'
            }
        }
    });

    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-sed');
    // 构建工程
    grunt.registerTask('build', ['clean', 'concat', 'autoprefixer', 'less', 'uglify', 'cssmin', 'copy', 'sed']);
    // 构建文档
    grunt.registerTask('doc', ['copy', 'sed']);

    // 监视文件变化自动构建
    // grunt watch

    // 生成 JSDoc 文档
    // grunt jsdoc
};